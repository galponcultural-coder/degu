// Si usas Vite. Si usas Create React App, cambia import.meta.env.VITE_API_URL por process.env.REACT_APP_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const registrarAsistenciaEvento = async (
  eventoId: string, 
  tipo: 'estudiante' | 'funcionario' | 'externo'
) => {
  const res = await fetch(`${API_URL}/eventos/${eventoId}/escanear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // No enviamos token (Authorization) para que cualquiera pueda auto-registrarse
    body: JSON.stringify({ tipo }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error al registrar la asistencia');
  }

  return data; // Devuelve el mensaje de éxito y los totales
};