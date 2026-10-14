import request from 'supertest';
import app from '../index'; // Ajusta la ruta a tu app Express
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

// 1. Mockeamos las funciones específicas de Prisma que usa el servicio de métricas
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    asistencia: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]), // Esto evita el error 'length'
      aggregate: jest.fn().mockResolvedValue({ _avg: { notaSatisfaccion: 0 } }),
    },
    taller: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe('Endpoint: GET /api/metricas/dashboard', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';
  
  // Generamos un token válido genérico (no importa el rol para este endpoint)
  const tokenValido = jwt.sign({ rut: '11.111.111-1', rol: 'Administrador' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('🔴 [Seguridad] Debería bloquear la petición si no se envía un token (401)', async () => {
    const res = await request(app).get('/api/metricas/dashboard');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Acceso denegado/i);
  });

  it('🔴 [Seguridad] Debería bloquear si el token es inválido (401)', async () => {
    const res = await request(app)
      .get('/api/metricas/dashboard')
      .set('Authorization', 'Bearer token_falso_inventado');

    expect(res.status).toBe(401);
  });

  it('🟢 [Éxito] Debería devolver el JSON estructurado correctamente (200)', async () => {
    // Simulamos las respuestas de la base de datos
    (prisma.asistencia.count as jest.Mock).mockResolvedValue(150); // 150 asistencias totales
    
    // groupBy devuelve un arreglo, el length es la cantidad de estudiantes únicos
    (prisma.asistencia.groupBy as jest.Mock).mockResolvedValue(new Array(45)); // 45 estudiantes únicos
    
    (prisma.asistencia.aggregate as jest.Mock).mockResolvedValue({
      _avg: { notaSatisfaccion: 4.65 } // Nota promedio
    });

    (prisma.taller.findMany as jest.Mock).mockResolvedValue([
      { id: 1, nombre: 'Guitarra', _count: { inscripciones: 30 } },
      { id: 2, nombre: 'Teatro', _count: { inscripciones: 25 } },
      { id: 3, nombre: 'Pintura', _count: { inscripciones: 20 } }
    ]);

    const res = await request(app)
      .get('/api/metricas/dashboard')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(res.status).toBe(200);
    
    // Verificamos que la estructura Volumen exista y esté calculada
    expect(res.body.volumen.totalAsistenciasFisicas).toBe(150);
    expect(res.body.volumen.estudiantesUnicos).toBe(45);
    
    // Verificamos que la Calidad esté redondeada a 1 decimal como dictaba el servicio
    expect(res.body.calidad.satisfaccionPromedio).toBe(4.7);
    
    // Verificamos el Rendimiento
    expect(res.body.rendimiento.topTalleres).toHaveLength(3);
    expect(res.body.rendimiento.topTalleres[0].nombre).toBe('Guitarra');
  });

  it('🔴 [Error Servidor] Debería manejar errores de base de datos correctamente (500)', async () => {
    // Forzamos a Prisma a fallar
    (prisma.asistencia.count as jest.Mock).mockRejectedValue(new Error('Conexión perdida con la BD'));

    const res = await request(app)
      .get('/api/metricas/dashboard')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Error interno al calcular/i);
  });
});