import { autenticarConGoogle } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// 1. Interceptamos la librería de Google
jest.mock('google-auth-library');

// 2. Interceptamos a Prisma para NO tocar la base de datos real
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Servicio de Autenticación - Google', () => {

  // Limpiamos los mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debería generar un token de sesión si el correo UCN (Edgar) es válido y existe en la BD', async () => {
    // Simulamos a Google validando el correo (Google puede devolver mayúsculas)
    (OAuth2Client.prototype.verifyIdToken as jest.Mock).mockResolvedValue({
      getPayload: () => ({ email: 'Edgar.Gallardo@ucn.cl' })
    });

    // Simulamos a Prisma encontrando a Edgar
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      nombre: 'Edgar',
      apellido: 'Gallardo',
      correo: 'edgar.gallardo@ucn.cl', // Base de datos
      rol: 'Administrador'
    });

    // Ejecutamos el servicio
    const token = await autenticarConGoogle('un-token-falso-de-test');

    // Verificaciones
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const payloadDecodificado = jwt.decode(token) as any;
    
    // CORRECCIÓN 1: Evaluamos algo que sí está dentro del JWT (el nombre en lugar del correo)
    expect(payloadDecodificado.user.nombre).toBe('Edgar');
    expect(payloadDecodificado.user.rol).toBe('Administrador');
    
    // CORRECCIÓN 2: Verificamos que Prisma fue llamado con el correo en minúsculas
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { correo: 'edgar.gallardo@ucn.cl' }
    });
  });

  it('Debería lanzar un error 404 si el correo de Google no está en la base de datos', async () => {
    (OAuth2Client.prototype.verifyIdToken as jest.Mock).mockResolvedValue({
      getPayload: () => ({ email: 'fantasma@alumnos.ucn.cl' })
    });

    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(autenticarConGoogle('token-invalido')).rejects.toThrow(
      'Tu correo UCN es válido, pero no estás registrado en el sistema.'
    );
  });

});