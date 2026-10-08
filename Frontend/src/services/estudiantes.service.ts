import type {
  ActualizarEstudiantePayload,
  ActualizarEstudianteResponse,
  BusquedaEstudiantesResponse,
  CrearEstudianteInput,
  HistorialAyudantiasResponse,
  RegistroUsuarioPayload,
  RegistroUsuarioResponse,
  RespuestaCrearEstudiantesBatch,
} from '../interfaces/Estudiante';

const baseUrl = import.meta.env.VITE_API_URL;


export async function buscarEstudiantes(
  query: string,
  page = 1,
  limit = 10
): Promise<BusquedaEstudiantesResponse> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};

  if (token) headers.Authorization = `Bearer ${token}`;

  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${baseUrl}/estudiantes/buscar?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Error al buscar estudiantes");
  }

  return response.json();
}

export async function registrarUsuario(
  payload: RegistroUsuarioPayload
): Promise<RegistroUsuarioResponse> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/estudiantes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || data.detalle || 'Error al registrar usuario')
  }

  return data as RegistroUsuarioResponse
}

export async function registrarEstudiantesBatch(
  estudiantes: CrearEstudianteInput[]
): Promise<RespuestaCrearEstudiantesBatch> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/estudiantes/batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ estudiantes }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || data.detalle || 'Error al crear estudiantes en batch');
  }

  return data as RespuestaCrearEstudiantesBatch;
}

export async function actualizarEstudiante(
  rutActual: string,
  payload: ActualizarEstudiantePayload
): Promise<ActualizarEstudianteResponse> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${baseUrl}/estudiantes/${encodeURIComponent(rutActual)}`,
    { method: 'PATCH', headers, body: JSON.stringify(payload) }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || data.detalle || 'Error al actualizar estudiante'
    );
  }

  return data as ActualizarEstudianteResponse;
}
export async function obtenerHistorialAyudantias(
  rut: string
): Promise<HistorialAyudantiasResponse> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${baseUrl}/estudiantes/${encodeURIComponent(rut)}/ayudantias`,
    { headers }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || data.detalle || 'Error al obtener el historial de ayudantías'
    );
  }

  return data as HistorialAyudantiasResponse;
}