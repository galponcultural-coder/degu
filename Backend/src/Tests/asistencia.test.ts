import request from 'supertest';
import express from 'express';
import asistenciaRoutes from '../routes/asistencia.routes';
import { PrismaClient } from '@prisma/client'; 

const app = express();
app.use(express.json());
app.use('/api/asistencias', asistenciaRoutes);

jest.mock('../src/generated', () => {
  const mPrismaClient = {
    taller: { findUnique: jest.fn() },
    sesion: { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    inscripcion: { findFirst: jest.fn(), findMany: jest.fn() },
    asistencia: { create: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Endpoints de Asistencia', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/asistencias/sesion', () => {
    
    it('Debería retornar status 400 si faltan parámetros (bloque o minutosValidez)', async () => {
      const res = await request(app)
        .post('/api/asistencias/sesion')
        .send({ tallerId: 1 });

      expect(res.status).toBe(400);
    });

    it('Debería retornar error 400 si el taller no existe', async () => {
      (prismaMock.taller.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/asistencias/sesion')
        .send({ tallerId: 999, bloque: 'A', minutosValidez: 15 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no existe');
    });

    it('Debería crear la sesión exitosamente (Camino Feliz)', async () => {
      (prismaMock.taller.findUnique as jest.Mock).mockResolvedValue({ id: 1, nombre: 'Taller de Programación' });
      
      (prismaMock.sesion.create as jest.Mock).mockResolvedValue({
        id: 10,
        tallerId: 1,
        qrToken: 'un-token-uuid-falso',
        activa: true
      });

      const res = await request(app)
        .post('/api/asistencias/sesion')
        .send({ tallerId: 1, bloque: 'A', minutosValidez: 15 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(prismaMock.sesion.create).toHaveBeenCalledTimes(1); 
    });
  });

  describe('PATCH /api/asistencias/registrar-qr', () => {

    it('Debería rechazar si el token no se envía', async () => {
      const res = await request(app)
        .patch('/api/asistencias/registrar-qr')
        .send({ rutEstudiante: '12345678-9' });

      expect(res.status).toBe(400);
    });

    it('Debería rechazar si el alumno no está inscrito en ese taller', async () => {
      (prismaMock.sesion.findFirst as jest.Mock).mockResolvedValue({ id: 10, tallerId: 1 });
      
      (prismaMock.inscripcion.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/asistencias/registrar-qr')
        .send({ qrToken: 'token-valido', rutEstudiante: '12345678-9' });

      expect(res.status).toBe(403); 
    });

    it('Debería registrar la asistencia con éxito (Camino Feliz)', async () => {
      (prismaMock.sesion.findFirst as jest.Mock).mockResolvedValue({ id: 10, tallerId: 1 });
      (prismaMock.inscripcion.findFirst as jest.Mock).mockResolvedValue({ id: 5, estudianteRut: '12345678-9' });
      (prismaMock.asistencia.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.asistencia.create as jest.Mock).mockResolvedValue({ id: 100, estado: 'PRESENTE' });

      const res = await request(app)
        .patch('/api/asistencias/registrar-qr')
        .send({ qrToken: 'token-valido', rutEstudiante: '12345678-9' });

      expect(res.status).toBe(200);
      expect(prismaMock.asistencia.create).toHaveBeenCalled();
    });

  });
});