import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

// NOTA: Cambiamos rutAdminActual (string) por idAdminActual (number), 
// ya que los administradores ahora solo se identifican por ID o Correo.
export const transferirMando = async (idAdminActual: number, rutNuevoAdmin: string, palabraConfirmacion: string) => {
  // 1. Validación de seguridad de la intención
  if (palabraConfirmacion !== 'CONFIRMAR') {
    throw new Error('Validación fallida: Debe escribir CONFIRMAR en mayúsculas para proceder.');
  }

  // 2. Ejecutar la transacción para garantizar la atomicidad del traspaso
  return await prisma.$transaction(async (tx) => {
    
    // 3. Buscar al usuario candidato (Estudiante, Profesor, etc.) en la tabla Usuario
    const usuarioCandidato = await tx.usuario.findUnique({
      where: { rut: rutNuevoAdmin }
    });

    if (!usuarioCandidato) {
      throw new Error('El RUT ingresado no pertenece a un usuario registrado.');
    }

    if (!usuarioCandidato.correo) {
      throw new Error('El usuario candidato no tiene un correo registrado, el cual es obligatorio para ser Administrador.');
    }

    // 4. Verificar si este usuario ya tiene una cuenta en la tabla Administrador
    const adminExistente = await tx.administrador.findUnique({
      where: { correo: usuarioCandidato.correo }
    });

    if (adminExistente) {
      throw new Error('Este usuario ya es Administrador del sistema.');
    }

    // 5. Crear una contraseña temporal para el nuevo Administrador 
    // (Ejemplo: 'admin123'. En el frontend deberías pedirle que la cambie luego)
    const salt = await bcrypt.genSalt(10);
    const passwordTemporal = await bcrypt.hash('admin123', salt);

    // 6. Crear el nuevo administrador
    await tx.administrador.create({
      data: {
        nombre: usuarioCandidato.nombre,
        correo: usuarioCandidato.correo,
        password: passwordTemporal
      }
    });

    // 7. Revocar los permisos eliminando al administrador actual
    // Al eliminarlo de la tabla Administrador, pierde el acceso al sistema como admin.
    await tx.administrador.delete({
      where: { id: idAdminActual }
    });

    return true; // Transacción completada
  });
};