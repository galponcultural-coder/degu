import request from 'supertest';
import app from '../index'; 
import { obtenerHistorialAyudantias } from '../services/estudiante.service';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../lib/prisma', () => ({
  prisma: {
    usuario: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Módulo Estudiantes', () => {
  const mockUsuario = {
    id: 1,
    nombre: 'Roberto',
    apellido: 'Carlos',
    rut: '12.345.678-9',
    rol: 'Estudiante',
    inscripciones: [
      {
        id: 10,
        taller: {
          id: 100,
          nombre: 'Taller de Node',
          semestre: '2026-2',
          horario: '14:30 - 16:00',
          dia: 1,
          bloque: 'C',
          lugar: 'Sala 3',
          estado: true,
          profesor: { nombre: 'Juan', apellido: 'Pérez' },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS DEL SERVICIO (Lógica de Negocio)
  // ==========================================
  describe('Capa de Servicio: obtenerHistorialAyudantias', () => {
    it('Debe devolver el historial completo si no se envía filtro', async () => {
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      const resultado = await obtenerHistorialAyudantias('12.345.678-9') as any;
      
      expect(resultado).toHaveProperty('estudiante');
      expect(resultado).toHaveProperty('totalAyudantias', 1);
      expect(resultado.historial[0]).toHaveProperty('semestre', '2026-2');
    });

    it('Debe devolver SOLO los semestres (filtro=semestres)', async () => {
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      const resultado = await obtenerHistorialAyudantias('12.345.678-9', 'semestres');
      
      expect(resultado).toHaveProperty('total', 1);
      expect(resultado.semestres).toEqual(['2026-2']);
      expect(resultado).not.toHaveProperty('historial');
    });
  });

  // ==========================================
  // TESTS DEL CONTROLADOR / RUTAS (API HTTP)
  // ==========================================
  describe('Capa de API: GET /api/estudiantes/:rut/ayudantias', () => {
    const rutValido = '12.345.678-9';
    const secreto = process.env.JWT_SECRET || 'super_secret_test_key';
    const tokenGenerado = jwt.sign({ id: 1, rol: 'Administrador' }, secreto);
    const tokenAdmin = `Bearer ${tokenGenerado}`;

    it('Debe responder con 200 y el JSON del historial', async () => {
      // Configuramos el mock para que responda a la petición HTTP
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      const res = await request(app)
        .get(`/api/estudiantes/${rutValido}/ayudantias`)
        .set('Authorization', tokenAdmin);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('estudiante');
      expect(res.body).toHaveProperty('historial');
    });

    it('Debe manejar correctamente los query params (?filtro=horarios)', async () => {
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      const res = await request(app)
        .get(`/api/estudiantes/${rutValido}/ayudantias?filtro=horarios`)
        .set('Authorization', tokenAdmin);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('horarios');
      expect(res.body).not.toHaveProperty('estudiante');
    });
  });
});