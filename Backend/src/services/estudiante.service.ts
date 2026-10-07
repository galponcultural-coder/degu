import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { RolUsuario, Prisma } from '@prisma/client'

const RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BuscarEstudiantesParams {
  query: string;
  skip?: number;
  take?: number;
}

interface CrearEstudianteInput {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  password?: string;
  carrera?: string;
  telefono?: string;
}

export const obtenerTodos = async (busqueda?: string) => {
  return await prisma.usuario.findMany({
    where: {
      rol: 'Estudiante',
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { apellido: { contains: busqueda, mode: 'insensitive' } },
          { rut: { contains: busqueda, mode: 'insensitive' } }
        ]
      })
    },
    select: { id: true, nombre: true, apellido: true, rut: true, correo: true, carrera: true, telefono: true },
    orderBy: { nombre: 'asc' }
  });
};


export async function crearEstudiante(input: CrearEstudianteInput) {
  const nombre = input.nombre.trim();
  const apellido = input.apellido.trim();
  const rut = input.rut.trim().toUpperCase();
  const correo = input.correo.trim().toLowerCase();
  const { password, carrera, telefono } = input;

  if (!RUT_REGEX.test(rut)) {
    throw { status: 400, message: 'El formato del RUT es inválido (Ej: 12.345.678-9).' };
  }

  if (!EMAIL_REGEX.test(correo)) {
    throw { status: 400, message: 'El formato del correo electrónico es inválido.' };
  }

  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { rut: { equals: rut, mode: 'insensitive' } },
        { correo: { equals: correo, mode: 'insensitive' } }
      ],
    },
  });

  if (usuarioExistente) {
    if (usuarioExistente.rut.toUpperCase() === rut) {
      throw { status: 409, message: 'Ya existe un usuario registrado con ese RUT.' };
    }
    throw { status: 409, message: 'Ya existe un usuario registrado con ese correo.' };
  }

  const passToHash = password || "123456";
  const passwordHasheada = await bcrypt.hash(passToHash, 10);

  const nuevoEstudiante = await prisma.usuario.create({
    data: {
      nombre,
      apellido,
      rut,
      correo,
      password: passwordHasheada,
      carrera: carrera?.trim(),
      telefono: telefono?.trim(),
      rol: RolUsuario.Estudiante,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      correo: true,
      carrera: true,
      telefono: true,
      rol: true,
    },
  });

  return nuevoEstudiante;
}

export async function crearEstudiantesBatch(inputs: CrearEstudianteInput[]) {
  if (inputs.length === 0) return { creados: [], errores: [] };

  // 1. Una sola query para traer TODOS los duplicados posibles
  const ruts = inputs.map(i => i.rut);
  const correos = inputs.map(i => i.correo);

  const existentes = await prisma.usuario.findMany({
    where: {
      OR: [{ rut: { in: ruts } }, { correo: { in: correos } }],
    },
    select: { rut: true, correo: true },
  });

  const rutsExistentes = new Set(existentes.map((u: { rut: string; correo: string }) => u.rut));
  const correosExistentes = new Set(existentes.map((u: { rut: string; correo: string }) => u.correo));

  const validos: CrearEstudianteInput[] = [];
  const errores: { input: CrearEstudianteInput; message: string }[] = [];

  for (const input of inputs) {
    if (rutsExistentes.has(input.rut)) {
      errores.push({ input, message: 'Ya existe un usuario registrado con ese RUT.' });
    } else if (correosExistentes.has(input.correo)) {
      errores.push({ input, message: 'Ya existe un usuario registrado con ese correo.' });
    } else {
      validos.push(input);
    }
  }

  const passwordsUnicas = new Set(validos.map(i => i.password || '123456'));
  const hashCache = new Map<string, string>();
  for (const pass of passwordsUnicas) {
    hashCache.set(pass, await bcrypt.hash(pass, 10));
  }

  const creados = await prisma.usuario.createManyAndReturn({
    data: validos.map(input => ({
      nombre: input.nombre,
      apellido: input.apellido,
      rut: input.rut,
      correo: input.correo,
      password: hashCache.get(input.password || '123456')!,
      carrera: input.carrera,
      telefono: input.telefono,
      rol: RolUsuario.Estudiante,
    })),
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      correo: true,
      carrera: true,
      telefono: true,
      rol: true,
    },
    skipDuplicates: true,
  });

  return { creados, errores };
}

export const obtenerPorRut = async (rut: string) => {
  return await prisma.usuario.findUnique({
    where: { rut },
    select: { id: true, nombre: true, apellido: true, rut: true, correo: true, rol: true }
  });
};

export async function buscarEstudiantes({
  query,
  skip = 0,
  take = 10,
}: BuscarEstudiantesParams) {
  const q = query.trim();

  if (!q) return { data: [], total: 0 };

  if (RUT_REGEX.test(q)) {
    const estudiante = await prisma.usuario.findFirst({
      where: {
        rut: q.toUpperCase(),
        rol: RolUsuario.Estudiante,
      },
      select: { id: true, nombre: true, apellido: true, rut: true, correo: true, carrera: true, telefono: true },
    });

    return {
      data: estudiante ? [estudiante] : [],
      total: estudiante ? 1 : 0,
    };
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  const where: Prisma.UsuarioWhereInput = {
    rol: RolUsuario.Estudiante,
    AND: tokens.map((token) => ({
      OR: [
        { nombre: { contains: token, mode: 'insensitive' } },
        { apellido: { contains: token, mode: 'insensitive' } },
      ],
    })),
  };

  const [data, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, apellido: true, rut: true, correo: true, carrera: true, telefono: true },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
      skip,
      take,
    }),
    prisma.usuario.count({ where }),
  ]);

  return { data, total };
}

export const obtenerHistorialAsistencia = async (rut: string) => {
  const estudianteConAsistencias = await prisma.usuario.findUnique({
    where: { rut },
    select: {
      id: true,
      asistencias: {
        include: {
          sesion: {
            include: {
              taller: {
                select: {
                  nombre: true,
                  id: true, 
                  semestre: true
                }
              }
            }
          }
        },
        orderBy: {
          fechaHora: 'desc'
        }
      }
    }
  });

  if (!estudianteConAsistencias) {
    throw new Error('Estudiante no encontrado');
  }

  return estudianteConAsistencias.asistencias;
};

export const actualizarPerfil = async (rutActual: string, datos: Partial<CrearEstudianteInput>) => {
  const { rut: nuevoRut, correo: nuevoCorreo, password, nombre, apellido, carrera, telefono } = datos;

  const estudianteActual = await prisma.usuario.findUnique({
    where: { rut: rutActual }
  });

  if (!estudianteActual) {
    throw { status: 404, message: 'Estudiante no encontrado.' };
  }

  if (nuevoRut !== undefined && !RUT_REGEX.test(nuevoRut.trim())) {
    throw { status: 400, message: 'El formato del RUT es inválido (Ej: 12.345.678-9).' };
  }

  if (nuevoCorreo !== undefined && !EMAIL_REGEX.test(nuevoCorreo.trim())) {
    throw { status: 400, message: 'El formato del correo electrónico es inválido.' };
  }

  if (nuevoRut || nuevoCorreo) {
    const rutNormalizado = nuevoRut?.trim().toUpperCase();
    const correoNormalizado = nuevoCorreo?.trim().toLowerCase();

    const usuarioConflicto = await prisma.usuario.findFirst({
      where: {
        AND: [
          { id: { not: estudianteActual.id } }, // Excluye al estudiante que estamos editando
          {
            OR: [
              ...(rutNormalizado ? [{ rut: rutNormalizado }] : []),
              ...(correoNormalizado ? [{ correo: { equals: correoNormalizado, mode: 'insensitive' as const } }] : []),
            ],
          },
        ],
      },
    });

    if (usuarioConflicto) {
      if (rutNormalizado && usuarioConflicto.rut.toUpperCase() === rutNormalizado) {
        throw { status: 409, message: 'Ya existe otro usuario registrado con ese RUT.' };
      }
      if (correoNormalizado && usuarioConflicto.correo.toLowerCase() === correoNormalizado) {
        throw { status: 409, message: 'Ya existe otro usuario registrado con ese correo.' };
      }
    }
  }

  const updateData: Prisma.UsuarioUpdateInput = {};
  if (nombre !== undefined) updateData.nombre = nombre.trim();
  if (apellido !== undefined) updateData.apellido = apellido.trim();
  if (nuevoRut !== undefined) updateData.rut = nuevoRut.trim().toUpperCase();
  if (nuevoCorreo !== undefined) updateData.correo = nuevoCorreo.trim().toLowerCase();
  if (carrera !== undefined) updateData.carrera = carrera.trim();
  if (telefono !== undefined) updateData.telefono = telefono.trim();

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  return await prisma.usuario.update({
    where: { id: estudianteActual.id },
    data: updateData,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      correo: true,
      carrera: true,
      telefono: true,
      rol: true,
    }
  });
};

export const obtenerHistorialAyudantias = async (rut: string) => {
  const rutNormalizado = rut.trim().toUpperCase();

  const usuario = await prisma.usuario.findFirst({
    where: {
      rut: { equals: rutNormalizado, mode: 'insensitive' },
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
      rol: true,
      inscripciones: {
        select: {
          id: true,
          taller: {
            select: {
              id: true,
              nombre: true,
              semestre: true,
              horario: true,
              dia: true,
              bloque: true,
              lugar: true,
              estado: true,
              profesor: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
            },
          },
        },
        orderBy: {
          taller: {
            semestre: 'desc', 
          },
        },
      },
    },
  });

  if (!usuario) {
    throw { status: 404, message: 'Estudiante no encontrado.' };
  }

  const historial = usuario.inscripciones.map((item: any) => ({
    tallerId: item.taller.id,
    taller: item.taller.nombre,
    semestre: item.taller.semestre,
    horario: item.taller.horario,
    dia: item.taller.dia,
    bloque: item.taller.bloque,
    lugar: item.taller.lugar,
    activo: item.taller.estado,
    profesor: item.taller.profesor
      ? `${item.taller.profesor.nombre} ${item.taller.profesor.apellido}`
      : null,
  }));

  return {
    estudiante: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rut: usuario.rut,
      rol: usuario.rol,
    },
    totalAyudantias: historial.length,
    historial,
  };
};