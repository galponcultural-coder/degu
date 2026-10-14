// 1. INYECTAR VARIABLES DE ENTORNO ANTES DE CUALQUIER IMPORTACIÓN
process.env.JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'tu_google_client_id';

import request from 'supertest';
import app from '../index'; // Ajusta la ruta a tu archivo de Express
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

// 2. Mockeamos el modelo EventoExterno de Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    eventoExterno: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Módulo Eventos Externos y Expo Geek', () => {
  const JWT_SECRET = process.env.JWT_SECRET as string;
  
  // Tokens para probar la seguridad de las rutas
  const tokenAdmin = jwt.sign({ 
    user: { id: 1, correo: 'admin@ucn.cl', rol: 'Administrador' } 
  }, JWT_SECRET);

  const tokenEstudiante = jwt.sign({ 
    user: { id: 2, rut: '22.222.222-2', rol: 'Estudiante' } 
  }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // GET /api/eventos - Listar Eventos
  // ==========================================
  describe('GET /api/eventos', () => {
    it('🟢 Debería listar todos los eventos correctamente', async () => {
      const mockEventos = [
        { id: 1, nombre: 'Expo Geek 2026', asistentesEstudiantes: 100 },
        { id: 2, nombre: 'Concierto', asistentesEstudiantes: 0 }
      ];
      (prisma.eventoExterno.findMany as jest.Mock).mockResolvedValue(mockEventos);

      const res = await request(app)
        .get('/api/eventos')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].nombre).toBe('Expo Geek 2026');
    });
  });

  // ==========================================
  // POST /api/eventos - Crear Evento
  // ==========================================
  describe('POST /api/eventos', () => {
    const nuevoEvento = {
      nombre: 'Feria de Emprendimiento',
      descripcion: 'Stands de alumnos',
      fecha: '2026-11-20T10:00:00Z',
      horario: '10:00 - 14:00',
      organizador: 'UCN'
    };

    it('🔴 Debería bloquear la creación si no es Administrador (403)', async () => {
      const res = await request(app)
        .post('/api/eventos')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send(nuevoEvento);

      expect(res.status).toBe(403);
    });

    it('🟢 Debería permitir crear un evento si es Administrador (201)', async () => {
      (prisma.eventoExterno.create as jest.Mock).mockResolvedValue({ id: 3, ...nuevoEvento });

      const res = await request(app)
        .post('/api/eventos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(nuevoEvento);

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toMatch(/Evento creado/i);
      expect(res.body.evento.id).toBe(3);
    });
  });

  // ==========================================
  // PUT /api/eventos/:id/participacion - Carga Masiva
  // ==========================================
  describe('PUT /api/eventos/:id/participacion', () => {
    it('🟢 Debería sumar participantes masivamente', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue({ 
        id: 1, asistentesEstudiantes: 10, asistentesFuncionarios: 2, asistentesExternos: 5 
      });
      
      (prisma.eventoExterno.update as jest.Mock).mockResolvedValue({
        id: 1, asistentesEstudiantes: 15, asistentesFuncionarios: 2, asistentesExternos: 55
      });

      const res = await request(app)
        .put('/api/eventos/1/participacion')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiantes: 5,
          funcionarios: 0,
          externos: 50,
          operacion: 'sumar'
        });

      expect(res.status).toBe(200);
      expect(res.body.evento.asistentesExternos).toBe(55);
      expect(prisma.eventoExterno.update).toHaveBeenCalledTimes(1);
    });

    it('🔴 Debería fallar si la operación no es válida', async () => {
      const res = await request(app)
        .put('/api/eventos/1/participacion')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estudiantes: 5, operacion: 'restar' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/La operación debe ser/i);
    });
  });

  // ==========================================
  // POST /api/eventos/:id/escanear - Lector QR Expo Geek
  // ==========================================
  describe('POST /api/eventos/:id/escanear', () => {
    it('🟢 Debería registrar un escaneo rápido exitosamente (+1)', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.eventoExterno.update as jest.Mock).mockResolvedValue({
        id: 1, asistentesEstudiantes: 121, asistentesFuncionarios: 15, asistentesExternos: 350
      });

      const res = await request(app)
        .post('/api/eventos/1/escanear')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ tipo: 'estudiante' });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Ingreso registrado');
      expect(res.body.totales.estudiantes).toBe(121);
      
      expect(prisma.eventoExterno.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          asistentesEstudiantes: { increment: 1 },
          asistentesFuncionarios: undefined,
          asistentesExternos: undefined
        }
      });
    });

    it('🔴 Debería bloquear si se envía un tipo de asistente inventado', async () => {
      const res = await request(app)
        .post('/api/eventos/1/escanear')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ tipo: 'profesor_visitante' }); 

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Tipo de asistente no válido/i);
    });

    it('🔴 Debería devolver 404 si el evento no existe', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/eventos/999/escanear')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ tipo: 'externo' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Evento no encontrado/i);
    });
  });

  // ==========================================
  // GET /api/eventos/:id/estadisticas - Métricas y Filtros
  // ==========================================
  describe('GET /api/eventos/:id/estadisticas', () => {
    const mockEventoData = {
      id: 1,
      nombre: 'Expo Geek 2026',
      asistentesEstudiantes: 100,
      asistentesFuncionarios: 10,
      asistentesExternos: 40
    };

    it('🟢 Debería devolver todas las estadísticas sumadas si no hay filtros (200)', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue(mockEventoData);

      const res = await request(app)
        .get('/api/eventos/1/estadisticas')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.evento).toBe('Expo Geek 2026');
      expect(res.body.total).toBe(150); // 100 + 10 + 40
      expect(res.body.desglose.estudiantes).toBe(100);
      expect(res.body.desglose.funcionarios).toBe(10);
      expect(res.body.desglose.externos).toBe(40);
    });

    it('🟢 Debería filtrar y sumar correctamente por query params (?filtros=estudiante,funcionario)', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue(mockEventoData);

      const res = await request(app)
        .get('/api/eventos/1/estadisticas?filtros=estudiante,funcionario')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(110); // 100 + 10 (sin externos)
      expect(res.body.desglose.estudiantes).toBe(100);
      expect(res.body.desglose.funcionarios).toBe(10);
      expect(res.body.desglose.externos).toBe(0); // Debe venir en 0 por el filtro
    });

    it('🔴 Debería devolver 404 si el evento no existe', async () => {
      (prisma.eventoExterno.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/eventos/99/estadisticas')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Evento no encontrado/i);
    });

    it('🔴 Debería bloquear el acceso si no es Administrador (403)', async () => {
      const res = await request(app)
        .get('/api/eventos/1/estadisticas')
        .set('Authorization', `Bearer ${tokenEstudiante}`); // Token de alumno

      expect(res.status).toBe(403);
    });
  });
});