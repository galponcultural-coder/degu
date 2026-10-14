import { prisma } from '../src/lib/prisma';
import crypto from 'crypto'; 
import bcrypt from 'bcrypt'; 

async function main() {
  console.log('🌱 Iniciando seed analítico para el Galpón Cultural...');

  try {
    console.log('🧹 Limpiando tablas viejas...');
    await prisma.asistencia.deleteMany();
    await prisma.sesion.deleteMany();
    await prisma.inscripcion.deleteMany();
    await prisma.taller.deleteMany();
    await prisma.grupoTaller.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.administrador.deleteMany();
    await prisma.eventoExterno.deleteMany();

    console.log('🔐 Encriptando contraseñas por defecto...');
    const passwordHasheada = await bcrypt.hash('password123', 10);

    console.log('👨‍💼 Creando Administrador del sistema...');
    // El administrador ahora vive en su propia tabla
    await prisma.administrador.create({
      data: {
        nombre: "Edgar Gallardo",
        correo: "galponcultural@ucn.cl",
        password: passwordHasheada, 
      }
    });

    console.log('👨‍🏫 Creando Profesores...');
    const profesoresData = [
      { nombre: "Andrés", apellido: "Morales", carrera: "N/A", telefono: "+56922222222", rut: "22.222.222-2", correo: "andres.morales@ucn.cl", rol: "Profesor" as const },
      { nombre: "Valentina", apellido: "Soto", carrera: "N/A", telefono: "+56933333333", rut: "33.333.333-3", correo: "valentina.soto@ucn.cl", rol: "Profesor" as const },
      { nombre: "Ignacio", apellido: "Vera", carrera: "N/A", telefono: "+56944444444", rut: "44.444.444-4", correo: "ignacio.vera@ucn.cl", rol: "Profesor" as const },
    ];

    // Ya no inyectamos "password" a los profesores
    const profesores = await Promise.all(
      profesoresData.map((p) => prisma.usuario.create({ data: { ...p } }))
    );
    const [profAndres, profValentina, profIgnacio] = profesores;

    console.log('🎓 Creando estudiantes...');
    const estudiantesData = [
      { nombre: "Camila", apellido: "Fuentes", carrera: "Ingeniería Comercial", telefono: "+56955555551", rut: "20.111.111-1", correo: "camila.fuentes@alumnos.ucn.cl" },
      { nombre: "Diego", apellido: "Contreras", carrera: "Ingeniería Civil", telefono: "+56955555552", rut: "20.222.222-2", correo: "diego.contreras@alumnos.ucn.cl" },
      { nombre: "Fernanda", apellido: "Rojas", carrera: "Psicología", telefono: "+56955555553", rut: "20.333.333-3", correo: "fernanda.rojas@alumnos.ucn.cl" },
      { nombre: "Sebastián", apellido: "Muñoz", carrera: "Derecho", telefono: "+56955555554", rut: "20.444.444-4", correo: "sebastian.munoz@alumnos.ucn.cl" },
      { nombre: "Antonia", apellido: "Pizarro", carrera: "Enfermería", telefono: "+56955555555", rut: "20.555.555-5", correo: "antonia.pizarro@alumnos.ucn.cl" },
      { nombre: "Tomás", apellido: "Bravo", carrera: "Arquitectura", telefono: "+56955555556", rut: "20.666.666-6", correo: "tomas.bravo@alumnos.ucn.cl" },
      { nombre: "Javiera", apellido: "Cortés", carrera: "Ingeniería Civil", telefono: "+56955555557", rut: "20.777.777-7", correo: "javiera.cortes@alumnos.ucn.cl" },
    ];

    // Ya no inyectamos "password" a los estudiantes
    const estudiantes = await Promise.all(
      estudiantesData.map((e) =>
        prisma.usuario.create({ data: { ...e, rol: "Estudiante" } })
      )
    );
    const [camila, diego, fernanda, sebastian, antonia, tomas, javiera] = estudiantes;

    console.log('📚 Abriendo catálogo de talleres (semestre 2026-1)...');
    const tallerAjedrez = await prisma.taller.create({
      data: { nombre: "Ajedrez", descripcion: "Táctica y estrategia para todo nivel.", horario: "Lunes 10:00 - 12:00", dia: 1, bloque: "B", semestre: "2026-1", lugar: "Sala de Piano", profesorId: profAndres.id }
    });
    const tallerCoro = await prisma.taller.create({
      data: { nombre: "Coro Universitario", descripcion: "Canto grupal, todas las voces.", horario: "Martes 17:00 - 19:00", dia: 2, bloque: "F", semestre: "2026-1", lugar: "Sala de Música", profesorId: profValentina.id }
    });
    const tallerCeramica = await prisma.taller.create({
      data: { nombre: "Cerámica", descripcion: "Modelado y torno básico.", horario: "Miércoles 15:00 - 17:00", dia: 3, bloque: "D", semestre: "2026-1", lugar: "Salón de Artes Escénicas (Salón Exterior)", profesorId: profIgnacio.id }
    });

    console.log('📚 Abriendo catálogo de talleres (semestre 2026-2, semestre actual)...');

    const grupoCueca = await prisma.grupoTaller.create({ data: {} });

    const tallerCuecaLunes = await prisma.taller.create({
      data: { nombre: "Cueca", descripcion: "Baile tradicional chileno, nivel inicial.", horario: "Lunes 12:00 - 13:00", dia: 1, bloque: "C", semestre: "2026-2", lugar: "Salón Graciela Ramos (Sala de Espejos)", profesorId: profValentina.id, grupoId: grupoCueca.id }
    });
    const tallerCuecaMiercoles = await prisma.taller.create({
      data: { nombre: "Cueca", descripcion: "Baile tradicional chileno, nivel inicial.", horario: "Miércoles 12:00 - 13:00", dia: 3, bloque: "C", semestre: "2026-2", lugar: "Salón Graciela Ramos (Sala de Espejos)", profesorId: profValentina.id, grupoId: grupoCueca.id }
    });
    const tallerCuecaViernes = await prisma.taller.create({
      data: { nombre: "Cueca", descripcion: "Baile tradicional chileno, nivel inicial.", horario: "Viernes 12:00 - 13:00", dia: 5, bloque: "C", semestre: "2026-2", lugar: "Salón Graciela Ramos (Sala de Espejos)", profesorId: profValentina.id, grupoId: grupoCueca.id }
    });

    const grupoYoga = await prisma.grupoTaller.create({ data: {} });

    const tallerYogaMartes = await prisma.taller.create({
      data: { nombre: "Yoga", descripcion: "Relajación y respiración consciente.", horario: "Martes 07:00 - 08:00", dia: 2, bloque: "A", semestre: "2026-2", lugar: "Salón Graciela Ramos (Sala de Espejos)", profesorId: profIgnacio.id, grupoId: grupoYoga.id }
    });
    const tallerYogaJueves = await prisma.taller.create({
      data: { nombre: "Yoga", descripcion: "Relajación y respiración consciente.", horario: "Jueves 07:00 - 08:00", dia: 4, bloque: "A", semestre: "2026-2", lugar: "Salón Graciela Ramos (Sala de Espejos)", profesorId: profIgnacio.id, grupoId: grupoYoga.id }
    });
    const tallerTeatro = await prisma.taller.create({
      data: { nombre: "Taller de Teatro", descripcion: "Improvisación y técnicas de actuación.", horario: "Jueves 18:00 - 20:00", dia: 4, bloque: "G", semestre: "2026-2", lugar: "Salón de Artes Escénicas (Salón Exterior)", profesorId: profAndres.id }
    });
    const tallerFotografia = await prisma.taller.create({
      data: { nombre: "Fotografía Digital", descripcion: "Composición y edición básica.", horario: "Martes 08:00 - 10:00", dia: 2, bloque: "A", semestre: "2026-2", lugar: "Sala de Piano", profesorId: profIgnacio.id }
    });

    console.log('📝 Inscribiendo alumnos en talleres...');
    const inscripciones = [
      // 2026-1
      { estudianteId: camila.id, tallerId: tallerAjedrez.id },
      { estudianteId: diego.id, tallerId: tallerAjedrez.id },
      { estudianteId: fernanda.id, tallerId: tallerCoro.id },
      { estudianteId: sebastian.id, tallerId: tallerCoro.id },
      { estudianteId: antonia.id, tallerId: tallerCeramica.id },
      { estudianteId: tomas.id, tallerId: tallerCeramica.id },

      // 2026-2 
      { estudianteId: camila.id, tallerId: tallerCuecaLunes.id },
      { estudianteId: camila.id, tallerId: tallerCuecaMiercoles.id },
      { estudianteId: camila.id, tallerId: tallerCuecaViernes.id },

      { estudianteId: javiera.id, tallerId: tallerCuecaLunes.id },
      { estudianteId: javiera.id, tallerId: tallerCuecaMiercoles.id },
      { estudianteId: javiera.id, tallerId: tallerCuecaViernes.id },

      { estudianteId: sebastian.id, tallerId: tallerYogaMartes.id },
      { estudianteId: sebastian.id, tallerId: tallerYogaJueves.id },

      { estudianteId: antonia.id, tallerId: tallerYogaMartes.id },
      { estudianteId: antonia.id, tallerId: tallerYogaJueves.id },

      { estudianteId: diego.id, tallerId: tallerTeatro.id },
      { estudianteId: fernanda.id, tallerId: tallerTeatro.id },
      { estudianteId: sebastian.id, tallerId: tallerTeatro.id },

      { estudianteId: antonia.id, tallerId: tallerFotografia.id },
      { estudianteId: tomas.id, tallerId: tallerFotografia.id },
    ];
    await prisma.inscripcion.createMany({ data: inscripciones });

    console.log('⏰ Generando sesiones activas...');
    const ahora = new Date();
    const validez = new Date(ahora.getTime() + 60 * 60000); 

    // 2026-1
    const sesionAjedrez = await prisma.sesion.create({ data: { tallerId: tallerAjedrez.id, fecha: ahora, bloque: 2, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionCoro = await prisma.sesion.create({ data: { tallerId: tallerCoro.id, fecha: ahora, bloque: 6, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionCeramica = await prisma.sesion.create({ data: { tallerId: tallerCeramica.id, fecha: ahora, bloque: 4, qrToken: crypto.randomUUID(), validoHasta: validez } });

    // 2026-2
    const sesionCuecaLunes = await prisma.sesion.create({ data: { tallerId: tallerCuecaLunes.id, fecha: ahora, bloque: 3, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionCuecaMiercoles = await prisma.sesion.create({ data: { tallerId: tallerCuecaMiercoles.id, fecha: ahora, bloque: 3, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionTeatro = await prisma.sesion.create({ data: { tallerId: tallerTeatro.id, fecha: ahora, bloque: 7, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionFotografia = await prisma.sesion.create({ data: { tallerId: tallerFotografia.id, fecha: ahora, bloque: 1, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionYogaMartes = await prisma.sesion.create({ data: { tallerId: tallerYogaMartes.id, fecha: ahora, bloque: 1, qrToken: crypto.randomUUID(), validoHasta: validez } });
    const sesionYogaJueves = await prisma.sesion.create({ data: { tallerId: tallerYogaJueves.id, fecha: ahora, bloque: 1, qrToken: crypto.randomUUID(), validoHasta: validez } });
    
    console.log('🙋 Registrando asistencias y encuestas de satisfacción...');

    // 2026-1
    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionAjedrez.id, estudianteId: camila.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionAjedrez.id, estudianteId: diego.id, estado: "Presente", notaSatisfaccion: 4 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionCoro.id, estudianteId: fernanda.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionCoro.id, estudianteId: sebastian.id, estado: "Atrasado", notaSatisfaccion: 3 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionCeramica.id, estudianteId: antonia.id, estado: "Presente", notaSatisfaccion: 2, comentario: "Faltó arcilla para todos" },
      { sesionId: sesionCeramica.id, estudianteId: tomas.id, estado: "Ausente" },
    ]});

    // 2026-2
    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionCuecaLunes.id, estudianteId: camila.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionCuecaLunes.id, estudianteId: javiera.id, estado: "Presente", notaSatisfaccion: 5 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionCuecaMiercoles.id, estudianteId: camila.id, estado: "Presente", notaSatisfaccion: 4 },
      { sesionId: sesionCuecaMiercoles.id, estudianteId: javiera.id, estado: "Ausente" },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionYogaMartes.id, estudianteId: sebastian.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionYogaMartes.id, estudianteId: antonia.id, estado: "Presente", notaSatisfaccion: 4 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionYogaJueves.id, estudianteId: sebastian.id, estado: "Ausente" },
      { sesionId: sesionYogaJueves.id, estudianteId: antonia.id, estado: "Presente", notaSatisfaccion: 5 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionTeatro.id, estudianteId: diego.id, estado: "Presente", notaSatisfaccion: 4 },
      { sesionId: sesionTeatro.id, estudianteId: fernanda.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionTeatro.id, estudianteId: sebastian.id, estado: "Presente", notaSatisfaccion: 3 },
    ]});

    await prisma.asistencia.createMany({ data: [
      { sesionId: sesionFotografia.id, estudianteId: antonia.id, estado: "Presente", notaSatisfaccion: 5 },
      { sesionId: sesionFotografia.id, estudianteId: tomas.id, estado: "Presente", notaSatisfaccion: 4 },
    ]});

    // =========================================================================
    // NUEVO: CREACIÓN DE EVENTOS EXTERNOS PARA PRUEBAS
    // =========================================================================
    console.log('🎪 Creando Eventos Externos (Expo Geek)...');
    await prisma.eventoExterno.createMany({
      data: [
        {
          nombre: "Expo Geek 2026",
          descripcion: "Convención anual de videojuegos, tecnología y cultura pop.",
          fecha: new Date("2026-11-15T10:00:00Z"),
          horario: "10:00 - 18:00",
          lugar: "Patio Central UCN",
          organizador: "Agrupación Geek UCN",
          // Pre-cargamos algunos asistentes para tener datos base
          asistentesEstudiantes: 120,
          asistentesFuncionarios: 15,
          asistentesExternos: 350
        },
        {
          nombre: "Concierto Banda Universitaria",
          descripcion: "Presentación de fin de semestre abierta a la comunidad.",
          fecha: new Date("2026-12-01T19:00:00Z"),
          horario: "19:00 - 21:00",
          lugar: "Galpón Cultural",
          organizador: "Dirección General Estudiantil",
          asistentesEstudiantes: 0,
          asistentesFuncionarios: 0,
          asistentesExternos: 0
        }
      ]
    });

    console.log('✅ Seed completado.');
    console.log('----------------------------------------------------');
    console.log('Inicia sesión con:');
    console.log('Correo: galponcultural@ucn.cl');
    console.log('Clave:  password123');
    console.log('----------------------------------------------------');

  } catch (e) {
    console.error('❌ Error fatal en el seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();