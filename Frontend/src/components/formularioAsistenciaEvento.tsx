import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { registrarAsistenciaEvento } from '../services/evento.service';

export default function FormularioAsistenciaEvento() {
  const [searchParams] = useSearchParams();
  const eventoId = searchParams.get('eventoId');

  const [tipoAsistente, setTipoAsistente] = useState<'estudiante' | 'funcionario' | 'externo' | ''>('');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
  const [registrado, setRegistrado] = useState(false);
  const [cargando, setCargando] = useState(false);

  // EFECTO: Revisar si este celular ya se registró en este evento
  useEffect(() => {
    if (eventoId) {
      const yaSeRegistro = localStorage.getItem(`asistencia_evento_${eventoId}`);
      if (yaSeRegistro) {
        setRegistrado(true);
      }
    }
  }, [eventoId]);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventoId) {
      return setMensaje({ texto: 'Código QR inválido. No se detectó el evento.', tipo: 'error' });
    }
    if (!tipoAsistente) {
      return setMensaje({ texto: 'Por favor selecciona tu perfil de asistente.', tipo: 'error' });
    }

    setCargando(true);
    setMensaje(null);

    try {
      await registrarAsistenciaEvento(eventoId, tipoAsistente);
      
      // MARCA DE SEGURIDAD: Guardamos en el celular que ya se registró
      // para evitar que mande registros duplicados si recarga la página.
      localStorage.setItem(`asistencia_evento_${eventoId}`, 'true');
      
      setRegistrado(true);
    } catch (error: any) {
      setMensaje({ texto: error.message || 'Error de conexión con el servidor. Intenta de nuevo.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  // PANTALLA DE ÉXITO (O SI YA SE HABÍA REGISTRADO ANTES)
  if (registrado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border-t-8 border-green-500">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Asistencia Registrada!</h2>
          <p className="text-gray-600">Tu ingreso ya ha sido contabilizado. Gracias por acompañarnos.</p>
          <p className="text-sm text-gray-400 mt-8">Ya puedes cerrar esta pestaña.</p>
        </div>
      </div>
    );
  }

  // PANTALLA DEL FORMULARIO
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Registro de Asistencia</h2>
          <p className="text-gray-500 mt-2 text-sm">Completa este rápido formulario para confirmar tu ingreso al evento.</p>
        </div>

        {/* VALIDACIÓN DE URL (QR INVÁLIDO) */}
        {!eventoId && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm font-medium text-center border border-red-200">
            ⚠️ <strong>Error de lectura.</strong><br/> Escanea un código QR oficial del evento para registrarte.
          </div>
        )}

        <form onSubmit={handleRegistro} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">¿Cuál es tu relación con la UCN?</label>
            
            <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${tipoAsistente === 'estudiante' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <input type="radio" name="tipo" value="estudiante" className="w-5 h-5 text-blue-600"
                  checked={tipoAsistente === 'estudiante'}
                  onChange={(e) => setTipoAsistente(e.target.value as any)}
                />
                <span className="ml-3 font-medium text-gray-800">🎓 Estudiante UCN</span>
              </div>
            </label>

            <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${tipoAsistente === 'funcionario' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <input type="radio" name="tipo" value="funcionario" className="w-5 h-5 text-blue-600"
                  checked={tipoAsistente === 'funcionario'}
                  onChange={(e) => setTipoAsistente(e.target.value as any)}
                />
                <span className="ml-3 font-medium text-gray-800">💼 Funcionario / Académico UCN</span>
              </div>
            </label>

            <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${tipoAsistente === 'externo' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <input type="radio" name="tipo" value="externo" className="w-5 h-5 text-blue-600"
                  checked={tipoAsistente === 'externo'}
                  onChange={(e) => setTipoAsistente(e.target.value as any)}
                />
                <span className="ml-3 font-medium text-gray-800">🎟️ Público General (Externo)</span>
              </div>
            </label>
          </div>

          {mensaje && (
            <div className={`p-3 rounded-lg text-sm font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {mensaje.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={!eventoId || cargando}
            className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg shadow-md"
          >
            {cargando ? 'Procesando...' : 'Registrar mi asistencia'}
          </button>
        </form>
      </div>
    </div>
  );
}