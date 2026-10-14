import request from 'supertest';
import app from '../index'; // Ajusta la ruta a tu archivo principal donde exportas 'app'
import { prisma } from '../lib/prisma'; // Ajusta la ruta a tu instancia de Prisma
import jwt from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';

// 1. Mockeamos Prisma para que no toque la base de datos real
// Agregamos la tabla administrador por si algún servicio la llama directamente
jest.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    usuario: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    administrador: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    }
  },
}));

describe('Endpoint: PATCH /api/admin/transferir-mando', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
  
  // Generamos tokens con la nueva estructura (dentro del objeto 'user')
  // El admin ya no tiene RUT, tiene ID y correo. Y su rol es un string plano.
  const tokenAdmin = jwt.sign({ 
    user: { id: 1, correo: 'admin@ucn.cl', rol: 'Administrador' } 
  }, JWT_SECRET);

  const tokenEstudiante = jwt.sign({ 
    user: { id: 2, rut: '22.222.222-2', rol: RolUsuario.Estudiante } 
  }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks(); // Limpiar contadores antes de cada prueba
  });

  it('🔴 [Seguridad] Debería bloquear la petición si no se envía un token (401)', async () => {
    const res = await request(app)
      .patch('/api/admin/transferir-mando')
      .send({ rutNuevoAdmin: '33.333.333-3', palabraConfirmacion: 'CONFIRMAR' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Acceso denegado/i);
  });

  it('🔴 [Seguridad] Debería bloquear a un usuario que no es Administrador (403)', async () => {
    const res = await request(app)
      .patch('/api/admin/transferir-mando')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({ rutNuevoAdmin: '33.333.333-3', palabraConfirmacion: 'CONFIRMAR' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/requiere permisos de Administrador/i);
  });

  it('🔴 [Validación] Debería fallar si la palabra de confirmación es incorrecta (400)', async () => {
    const res = await request(app)
      .patch('/api/admin/transferir-mando')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rutNuevoAdmin: '33.333.333-3', palabraConfirmacion: 'ACEPTAR' }); // Palabra errónea

    expect(res.status).toBe(400);
    // Asumiendo que tu validador intercepta esto o el servicio arroja error 400
  });

  it('🔴 [Lógica] Debería fallar si el candidato ya es Administrador (400)', async () => {
    // Simulamos que la transacción de Prisma arroja el error que programamos en el servicio
    (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
      new Error('Este usuario ya es Administrador del sistema.')
    );

    const res = await request(app)
      .patch('/api/admin/transferir-mando')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rutNuevoAdmin: '11.111.111-1', palabraConfirmacion: 'CONFIRMAR' });

    expect(res.status).toBe(400);
    expect(res.body.detalle).toMatch(/Administrador del sistema/i);
  });

  it('🟢 [Éxito] Debería ejecutar la transferencia correctamente (200)', async () => {
    // Simulamos que la transacción de Prisma devuelve un true (éxito)
    (prisma.$transaction as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .patch('/api/admin/transferir-mando')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rutNuevoAdmin: '33.333.333-3', palabraConfirmacion: 'CONFIRMAR' });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/Traspaso de administración exitoso/i);
    
    // Verificamos que la función $transaction de Prisma realmente haya sido llamada
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});