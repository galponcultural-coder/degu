import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt'; 
import { OAuth2Client } from 'google-auth-library';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET || !GOOGLE_CLIENT_ID) {
  throw new Error('Faltan variables de entorno cruciales (JWT_SECRET o GOOGLE_CLIENT_ID)');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const autenticarAdministrador = async (correo: string, passwordPlan: string) => {
  // 1. Ahora buscamos en la tabla Administrador
  const admin = await prisma.administrador.findUnique({
    where: { correo }
  });

  if (!admin) {
    throw new Error('Credenciales incorrectas');
  }

  // 2. Comparamos la contraseña de la tabla Administrador
  const passwordCorrecto = await bcrypt.compare(passwordPlan, admin.password);
  
  if (!passwordCorrecto) {
    throw new Error('Credenciales incorrectas');
  }

  // 3. Generamos el token solo con los datos que tiene el Administrador
  // Inyectamos el rol manualmente para que el frontend lo reconozca
  const token = jwt.sign(
    { 
      user: {
        id: admin.id,
        nombre: admin.nombre,
        correo: admin.correo,
        rol: 'Administrador' 
      }
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return token; 
};

export const registrarUsuario = async (datos: any) => { 
  // Los usuarios generales (Estudiantes, Profesores, Ayudantes) ya no tienen password.
  // Solo se guardan sus datos de perfil y rol.
  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      rut: datos.rut,
      correo: datos.correo,
      rol: datos.rol 
    }
  });

  return usuario;
};

export const validarToken = async (token: string) => {
  const decoded: any = jwt.verify(token, JWT_SECRET);
  
  // Dependiendo de si el token es de un Administrador o un Usuario normal, buscamos en su respectiva tabla
  if (decoded.user.rol === 'Administrador') {
    const admin = await prisma.administrador.findUnique({
      where: { id: decoded.user.id },
      select: { id: true, nombre: true, correo: true }
    });
    
    if (!admin) throw new Error('Administrador no encontrado');
    return { ...admin, rol: 'Administrador' }; // Devolvemos el rol para el frontend
    
  } else {
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.user.id }, 
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rut: true,
        correo: true,
        rol: true
      }
    });

    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }
};

export const autenticarConGoogle = async (tokenGoogle: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: tokenGoogle,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('No se pudo obtener la información desde Google');
  }

  const correo = payload.email.toLowerCase();
  
  const dominioUsuario = correo.split('@')[1];
  const dominiosPermitidos = ['ucn.cl', 'alumnos.ucn.cl'];

  if (!dominiosPermitidos.includes(dominioUsuario)) {
    const error: any = new Error('Acceso denegado. Solo se permiten correos institucionales.');
    error.status = 403; 
    throw error;
  }

  // Ahora validamos si ese correo de Google pertenece a un Administrador
  const admin = await prisma.administrador.findUnique({
    where: { correo }
  });

  if (!admin) {
    const error: any = new Error('Tu correo institucional es válido, pero no estás registrado como Administrador.');
    error.status = 403; 
    throw error;
  }

  const token = jwt.sign(
    { 
      user: {
        id: admin.id,
        nombre: admin.nombre,
        correo: admin.correo,
        rol: 'Administrador'
      }
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return token;
};

export const solicitarRecuperacion = async (correo: string) => {
  // Ahora la recuperación de contraseña es solo para administradores
  const admin = await prisma.administrador.findUnique({
    where: { correo }
  });

  if (!admin) {
    return; // No revelar si el correo existe
  }

  const token = jwt.sign(
    {
      type: "password-reset",
      userId: admin.id
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  return token;
};

export const restablecerContrasena = async (
  token: string,
  nuevaPassword: string
) => {
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & {
    type: string;
    userId: number;
  };

  if (payload.type !== "password-reset") {
    throw new Error("Token inválido");
  }

  const admin = await prisma.administrador.findUnique({
    where: { id: payload.userId }
  });

  if (!admin) {
    throw new Error("Administrador no encontrado");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(nuevaPassword, salt);

  await prisma.administrador.update({
    where: { id: admin.id },
    data: {
      password: passwordHash
    }
  });
};