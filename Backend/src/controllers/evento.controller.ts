import { Request, Response } from 'express';
import * as service from '../services/evento.service';
import { prisma } from '../lib/prisma';

export const crear = async (req: Request, res: Response) => {
  try {
    // Si necesitas validar datos (zod/joi), hazlo aquí
    const nuevoEvento = await service.crearEvento(req.body);
    return res.status(201).json({ mensaje: 'Evento creado', evento: nuevoEvento });
  } catch (error: any) {
    return res.status(400).json({ error: 'Error al crear evento', detalle: error.message });
  }
};

export const listar = async (req: Request, res: Response) => {
  try {
    const eventos = await service.obtenerEventos();
    return res.json(eventos);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error al listar eventos' });
  }
};

export const actualizarParticipacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Extraemos los 3 contadores exactos. Por defecto sumaremos 0 si no envían alguno
    const { estudiantes = 0, funcionarios = 0, externos = 0, operacion = 'sumar' } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }

    if (operacion !== 'sumar' && operacion !== 'reemplazar') {
      return res.status(400).json({ error: 'La operación debe ser "sumar" o "reemplazar"' });
    }

    const actualizado = await service.registrarParticipacion(id, estudiantes, funcionarios, externos, operacion);

    return res.json({
      mensaje: 'Participación actualizada correctamente',
      evento: actualizado
    });
  } catch (error: any) {
    if (error.message === 'Evento no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(400).json({ error: 'Error al actualizar participación', detalle: error.message });
  }
};

export const escaneoRapido = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { tipo } = req.body; 

    if (isNaN(id)) return res.status(400).json({ error: 'ID de evento inválido' });
    if (!['estudiante', 'funcionario', 'externo'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de asistente no válido' });
    }

    const eventoActualizado = await service.registrarEscaneoQR(id, tipo);

    return res.json({
      mensaje: 'Ingreso registrado',
      totales: {
        estudiantes: eventoActualizado.asistentesEstudiantes,
        funcionarios: eventoActualizado.asistentesFuncionarios,
        externos: eventoActualizado.asistentesExternos
      }
    });
  } catch (error: any) {
    if (error.message === 'Evento no encontrado') return res.status(404).json({ error: error.message });
    return res.status(500).json({ error: 'Error al registrar el escaneo' });
  }
};

export const registrarEscaneoQR = async (
  idEvento: number,
  tipoAsistente: 'estudiante' | 'funcionario' | 'externo'
) => {
  const evento = await prisma.eventoExterno.findUnique({ where: { id: idEvento } });
  
  if (!evento) {
    throw new Error('Evento no encontrado');
  }

  // Preparamos el incremento dinámico según lo que escaneó el frontend
  const incremento = {
    asistentesEstudiantes: tipoAsistente === 'estudiante' ? { increment: 1 } : undefined,
    asistentesFuncionarios: tipoAsistente === 'funcionario' ? { increment: 1 } : undefined,
    asistentesExternos: tipoAsistente === 'externo' ? { increment: 1 } : undefined,
  };

  return await prisma.eventoExterno.update({
    where: { id: idEvento },
    data: incremento
  });
};

export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const filtrosQuery = req.query.filtros as string; // Ej: "estudiante,funcionario"

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }

    let filtrosArray: ('estudiante' | 'funcionario' | 'externo')[] | undefined = undefined;

    // Si el frontend envía filtros, los limpiamos y validamos
    if (filtrosQuery) {
      filtrosArray = filtrosQuery
        .split(',')
        .map(f => f.trim().toLowerCase())
        .filter(f => ['estudiante', 'funcionario', 'externo'].includes(f)) as ('estudiante' | 'funcionario' | 'externo')[];
    }

    const estadisticas = await service.obtenerEstadisticasEvento(id, filtrosArray);

    return res.json(estadisticas);
  } catch (error: any) {
    if (error.message === 'Evento no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al obtener estadísticas', detalle: error.message });
  }
};