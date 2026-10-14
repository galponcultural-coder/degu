import { RolUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma"; // Ajusta esta ruta si tu cliente de Prisma vive en otro lugar

interface CrearProfesorInput {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
}

export async function crearProfesor(input: CrearProfesorInput) {
  const { nombre, apellido, rut, correo } = input;

  // Verificamos que no exista ya un usuario con ese rut o correo
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ rut }, { correo }],
    },
  });

  if (usuarioExistente) {
    if (usuarioExistente.rut === rut) {
      throw { status: 409, message: "Ya existe un usuario registrado con ese RUT." };
    }
    throw { status: 409, message: "Ya existe un usuario registrado con ese correo." };
  }

  // Creamos al profesor directamente sin password
  const nuevoProfesor = await prisma.usuario.create({
    data: {
      nombre,
      apellido,
      rut,
      correo,
      rol: RolUsuario.Profesor, 
    },
  });

  return nuevoProfesor;
}

export async function obtenerProfesores() {
  const profesores = await prisma.usuario.findMany({
    where: { rol: RolUsuario.Profesor },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      correo: true,
      rol: true,
    },
  });

  return profesores;
}