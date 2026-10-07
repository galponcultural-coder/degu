import { z } from 'zod';

// Formato esperado en tu sistema: 12.345.678-9 o 1.234.567-K
const RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

export const rutParamSchema = z.object({
  params: z.object({
    rut: z.string().min(1, "El RUT es obligatorio"),
  })
});

export const buscarEstudianteSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  })
});

export const actualizarEstudianteSchema = z.object({
  params: z.object({
    rut: z.string().min(1, "El RUT actual en la URL es obligatorio"),
  }),
  body: z.object({
    nombre: z.string().trim().min(1, "El nombre no puede estar vacío").optional(),
    apellido: z.string().trim().min(1, "El apellido no puede estar vacío").optional(),
    rut: z
      .string()
      .trim()
      .regex(RUT_REGEX, "Formato de RUT inválido (Ej: 12.345.678-9)")
      .optional(),
    correo: z
      .string()
      .trim()
      .email("Formato de correo electrónico inválido")
      .optional(),
    carrera: z.string().trim().min(1, "La carrera no puede estar vacía").optional(),
    telefono: z.string().trim().min(1, "El teléfono no puede estar vacío").optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
  })
});

export const crearEstudianteSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    apellido: z.string().trim().min(1, "El apellido es obligatorio"),
    rut: z
      .string()
      .trim()
      .min(1, "El RUT es obligatorio")
      .regex(RUT_REGEX, "Formato de RUT inválido (Ej: 12.345.678-9)"),
    correo: z
      .string()
      .trim()
      .email("Formato de correo electrónico inválido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
    carrera: z.string().trim().optional(),
    telefono: z.string().trim().optional(),
  })
});

export const cambioRolSchema = z.object({
  params: z.object({
    rut: z.string().min(1),
  }),
  body: z.object({
    rol: z.enum(['Estudiante', 'Profesor', 'Ayudante', 'Administrador'], {
      message: "El rol proporcionado no es válido"
    }),
  })
});