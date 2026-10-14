import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const crearEvento = async (datos: Prisma.EventoExternoCreateInput) => {
  return await prisma.eventoExterno.create({ data: datos });
};

export const obtenerEventos = async () => {
  return await prisma.eventoExterno.findMany({
    orderBy: { fecha: 'desc' }
  });
};

export const registrarParticipacion = async (
  id: number, 
  estudiantes: number, 
  funcionarios: number, 
  externos: number, 
  operacion: 'sumar' | 'reemplazar'
) => {
  const evento = await prisma.eventoExterno.findUnique({ where: { id } });
  
  if (!evento) {
    throw new Error('Evento no encontrado');
  }

  // Lógica: Si es 'sumar', añadimos a lo que ya hay (+1, +5, etc). 
  // Si es 'reemplazar', sobreescribimos el valor (carga masiva absoluta/planilla).
  const nuevosEstudiantes = operacion === 'sumar' ? evento.asistentesEstudiantes + estudiantes : estudiantes;
  const nuevosFuncionarios = operacion === 'sumar' ? evento.asistentesFuncionarios + funcionarios : funcionarios;
  const nuevosExternos = operacion === 'sumar' ? evento.asistentesExternos + externos : externos;

  return await prisma.eventoExterno.update({
    where: { id },
    data: {
      asistentesEstudiantes: nuevosEstudiantes,
      asistentesFuncionarios: nuevosFuncionarios,
      asistentesExternos: nuevosExternos
    }
  });
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
  // Prisma se encarga de sumar +1 de forma atómica en la base de datos
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

export const obtenerEstadisticasEvento = async (
  idEvento: number,
  filtros?: ('estudiante' | 'funcionario' | 'externo')[]
) => {
  const evento = await prisma.eventoExterno.findUnique({
    where: { id: idEvento },
    select: {
      id: true,
      nombre: true,
      asistentesEstudiantes: true,
      asistentesFuncionarios: true,
      asistentesExternos: true,
    }
  });

  if (!evento) {
    throw new Error('Evento no encontrado');
  }

  // Si no se envían filtros, devolvemos todo por defecto
  const incluirEstudiantes = !filtros || filtros.includes('estudiante');
  const incluirFuncionarios = !filtros || filtros.includes('funcionario');
  const incluirExternos = !filtros || filtros.includes('externo');

  const desglose = {
    estudiantes: incluirEstudiantes ? evento.asistentesEstudiantes : 0,
    funcionarios: incluirFuncionarios ? evento.asistentesFuncionarios : 0,
    externos: incluirExternos ? evento.asistentesExternos : 0,
  };

  const totalSuma = desglose.estudiantes + desglose.funcionarios + desglose.externos;

  return {
    evento: evento.nombre,
    filtrosAplicados: filtros || ['estudiante', 'funcionario', 'externo'],
    total: totalSuma,
    desglose
  };
};