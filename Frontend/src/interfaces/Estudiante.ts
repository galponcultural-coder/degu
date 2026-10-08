export interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  carrera: string;
  telefono: string;
}

export type RolUsuario = 'Administrador' | 'Profesor' | 'Ayudante' | 'Estudiante';

export interface BusquedaEstudiantesResponse {
  data: Estudiante[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface RegistroUsuarioPayload {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  password?: string;
  rol: RolUsuario;
  carrera?: string;
  telefono?: string;
}

export interface RegistroUsuarioResponse {
  mensaje: string;
  usuario: Omit<Estudiante, 'carrera' | 'telefono'> & {
    rol: string;
    carrera?: string;
    telefono?: string;
  };
}

export interface CrearEstudianteInput {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  carrera: string;
  telefono: string;
  rol: string;
  password?: string;
}

export interface EstudianteCreado extends Estudiante {
  rol: string;
}

export interface ErrorCreacion {
  input: CrearEstudianteInput;
  message: string;
}

export interface RespuestaCrearEstudiantesBatch {
  mensaje: string;
  creados: EstudianteCreado[];
  errores: ErrorCreacion[];
}


export type ActualizarEstudiantePayload = Partial<Omit<CrearEstudianteInput, 'rol'>>;

export interface ActualizarEstudianteResponse {
  mensaje: string;
  usuario: EstudianteCreado;
}