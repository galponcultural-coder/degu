import { useEffect, useMemo, useState, type ReactElement } from "react"
import { Link, useLocation } from "react-router-dom"
import Navbar from "../components/navbar"
import {
  obtenerResumenAsistenciaEstudiante,
  type ResumenAsistenciaEstudianteItem,
} from "../services/perfilAsistencia.service"
import { exportarPerfilEstudianteExcel } from "../utils/excel.utils"
import { useAuth } from "../context/AuthContext"
import { obtenerTalleresPorSemestre, type TallerApi } from "../services/talleres.service"
import { inscribirEstudiantesBatch } from "../services/inscripcion.service"
import { obtenerSemestreActual } from "../utils/semestre.utils"

import { obtenerHistorialAyudantias } from "../services/estudiantes.service"
import type { AyudantiaItem } from "../interfaces/Estudiante"

export interface EstudiantePerfil {
  id?: number
  nombre: string
  apellido?: string
  rut: string
  correo: string
  carrera: string
  telefono: string
  semestreActual?: string
  promedioAsistencia?: number
  talleresInscritos?: number
  talleresAprobados?: number
}

interface ResumenTaller {
  id: number
  codigo: string
  nombre: string
  semestre: string
  bloque: string
  asistencia: number
  estado: "Calificado" | "No califica"
}

interface PerfilProps {
  estudiante?: EstudiantePerfil
  historialTalleres?: ResumenTaller[]
}

function colorAsistencia(asistencia: number): string {
  if (asistencia >= 80) return "bg-emerald-500"
  if (asistencia >= 60) return "bg-amber-500"
  return "bg-rose-500"
}

function colorEstado(estado: ResumenTaller["estado"]): string {
  if (estado === "Calificado") return "bg-emerald-100 text-emerald-700 border border-emerald-200"
  if (estado === "No califica") return "bg-amber-100 text-amber-700 border border-amber-200"
  return "bg-rose-100 text-rose-700 border border-rose-200"
}

function mapearHistorialDesdeResumen(resumen: ResumenAsistenciaEstudianteItem[]): ResumenTaller[] {
  return resumen.map((item) => ({
    id: item.tallerId,
    codigo: `TALL-${String(item.tallerId).padStart(3, "0")}`,
    nombre: item.nombre,
    semestre: item.semestre,
    bloque: item.bloque,
    asistencia: item.porcentaje,
    estado: item.porcentaje >= 80 ? "Calificado" : "No califica",
  }))
}

export default function Perfil({ estudiante, historialTalleres }: PerfilProps): ReactElement {
  const location = useLocation()
  const state = location.state as PerfilProps | null

  const estudianteBase = state?.estudiante ?? estudiante

  const [estudianteFinal, setEstudianteFinal] = useState<EstudiantePerfil | null>(
    estudianteBase ?? null,
  )
  const [historialFinal, setHistorialFinal] = useState<ResumenTaller[]>(
    historialTalleres ?? [],
  )
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const [talleresDisponibles, setTalleresDisponibles] = useState<TallerApi[]>([])
  const [tallerParaInscribir, setTallerParaInscribir] = useState<string>('')
  const [cargandoInscripcion, setCargandoInscripcion] = useState(false)
  const [errorInscripcion, setErrorInscripcion] = useState<string | null>(null)
  const [exitoInscripcion, setExitoInscripcion] = useState<string | null>(null)
  const [triggerRecarga, setTriggerRecarga] = useState(0)
  const [ayudantias, setAyudantias] = useState<AyudantiaItem[]>([])
  const [cargandoAyudantias, setCargandoAyudantias] = useState(false)
  const [errorAyudantias, setErrorAyudantias] = useState<string | null>(null)

  useEffect(() => {
    async function loadTalleres() {
      try {
        const semestre = obtenerSemestreActual()
        const data = await obtenerTalleresPorSemestre(semestre)
        setTalleresDisponibles(data)
      } catch (err) {
        console.error("Error al cargar talleres:", err)
      }
    }
    if (user?.rol === 'Administrador') {
      loadTalleres()
    }
  }, [user])

  // Nombres únicos ya no inscritos (comparando por nombre contra historial)
  const nombresInscritos = useMemo(
    () => new Set(historialFinal.map((t) => t.nombre)),
    [historialFinal]
  )

  const nombresParaElegir = useMemo(() => {
    const todosLosNombres = Array.from(new Set(talleresDisponibles.map((t) => t.nombre))).sort()
    return todosLosNombres.filter((n) => !nombresInscritos.has(n))
  }, [talleresDisponibles, nombresInscritos])

  // IDs de todos los bloques del nombre elegido
  const idsDelTallerElegido = useMemo(
    () => talleresDisponibles.filter((t) => t.nombre === tallerParaInscribir).map((t) => t.id),
    [talleresDisponibles, tallerParaInscribir]
  )

  // Historial de ayudantías agrupado por semestre (más recientes primero)
  const ayudantiasPorSemestre = useMemo(() => {
    const grupos = new Map<string, AyudantiaItem[]>()
    for (const a of ayudantias) {
      const lista = grupos.get(a.semestre) ?? []
      lista.push(a)
      grupos.set(a.semestre, lista)
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [ayudantias])

  const handleInscribir = async () => {
    if (!estudianteFinal?.id || !tallerParaInscribir || idsDelTallerElegido.length === 0) return
    setCargandoInscripcion(true)
    setErrorInscripcion(null)
    setExitoInscripcion(null)

    try {
      await inscribirEstudiantesBatch(
        idsDelTallerElegido.map((tallerId) => ({ estudianteId: estudianteFinal.id!, tallerId }))
      )
      setExitoInscripcion('Estudiante inscrito exitosamente.')
      setTallerParaInscribir('')
      setTriggerRecarga((prev) => prev + 1)
      setTimeout(() => setExitoInscripcion(null), 3000)
    } catch (err: any) {
      setErrorInscripcion(err.message || 'Error al inscribir estudiante.')
      setTimeout(() => setErrorInscripcion(null), 5000)
    } finally {
      setCargandoInscripcion(false)
    }
  }

  useEffect(() => {
    let activo = true

    async function cargarPerfil() {
      try {
        setCargando(true)
        setError(null)

        if (!estudianteBase) {
          setError("No hay datos del estudiante para cargar el perfil.")
          return
        }

        if (!activo) return
        setEstudianteFinal(estudianteBase)

        if (!estudianteBase.id) {
          setError("Falta el id del estudiante para cargar el resumen de asistencia.")
          return
        }

        const resumen = await obtenerResumenAsistenciaEstudiante(estudianteBase.id)
        if (!activo) return

        const historialDesdeResumen = mapearHistorialDesdeResumen(resumen)
        setHistorialFinal(historialDesdeResumen)

        const promedioAsistencia = resumen.length
          ? Math.round(resumen.reduce((acc, item) => acc + item.porcentaje, 0) / resumen.length)
          : 0

        const talleresInscritos = resumen.length
        const talleresAprobados = resumen.filter((item) => item.porcentaje >= 80).length

        setEstudianteFinal((actual) =>
          actual
            ? {
                ...actual,
                promedioAsistencia,
                talleresInscritos,
                talleresAprobados,
              }
            : actual,
        )
      } catch (fetchError) {
        if (!activo) return
        setError(fetchError instanceof Error ? fetchError.message : "Error al cargar el perfil")
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarPerfil()

    return () => {
      activo = false
    }
  }, [estudianteBase, triggerRecarga])

  useEffect(() => {
    if (!estudianteBase?.rut) return

    let activo = true

    async function cargarAyudantias() {
      try {
        setCargandoAyudantias(true)
        setErrorAyudantias(null)
        const data = await obtenerHistorialAyudantias(estudianteBase!.rut)
        if (!activo) return
        setAyudantias(data.historial)
      } catch (err) {
        if (!activo) return
        setAyudantias([])
        setErrorAyudantias(err instanceof Error ? err.message : "Error al cargar las ayudantías")
      } finally {
        if (activo) setCargandoAyudantias(false)
      }
    }

    cargarAyudantias()

    return () => {
      activo = false
    }
  }, [estudianteBase?.rut])

  const manejarExportacionExcel = async () => {
    if (!estudianteFinal) return

    await exportarPerfilEstudianteExcel({
      nombre: estudianteFinal.nombre,
      apellido: estudianteFinal.apellido,
      rut: estudianteFinal.rut,
      correo: estudianteFinal.correo,
      promedioAsistencia: estudianteFinal.promedioAsistencia ?? 0,
      talleresInscritos: estudianteFinal.talleresInscritos ?? historialFinal.length,
      talleresAprobados:
        estudianteFinal.talleresAprobados ??
        historialFinal.filter((item) => item.estado === "Calificado").length,
      historial: historialFinal,
    })
  }

  const resumenAsistencia = useMemo(() => {
    if (!estudianteFinal?.promedioAsistencia) return 0
    return estudianteFinal.promedioAsistencia
  }, [estudianteFinal])

  return (
    <div>
      <Navbar />
      <main className="min-h-screen bg-[#f6f7f8] px-4 py-8 sm:px-6">
        <section className="mx-auto w-full max-w-6xl">
          <header className="mb-6 rounded-2xl border border-[#dfe3e7] bg-gradient-to-b from-[#f6f7f8] to-[#fcfcfd] p-6 shadow-[0_8px_22px_-18px_rgba(31,35,40,0.28)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f363d]">
                  Perfil de estudiante
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[#2f363d] md:text-4xl">
                  Datos e historial de talleres
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#5a636d]">
                  Información personal y participación histórica en talleres, incluyendo asistencia y semestre.
                </p>
              </div>

              <Link
                to="/estudiantes"
                className="inline-flex items-center justify-center rounded-xl border border-[#dfe3e7] bg-white px-4 py-2 text-sm font-semibold text-[#2f363d] transition hover:border-[#bfc8d1] hover:bg-[#f8fafc]"
              >
                Volver
              </Link>
            </div>
          </header>

          {cargando && (
            <div className="rounded-2xl border border-[#dfe3e7] bg-white p-6 text-sm text-[#5a636d]">
              Cargando perfil...
            </div>
          )}

          {error && !cargando && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!cargando && estudianteFinal && (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <section className="rounded-2xl border border-[#dfe3e7] bg-gradient-to-b from-[#f6f7f8] to-[#fcfcfd] p-5 shadow-[0_8px_22px_-18px_rgba(31,35,40,0.28)]">
                  <h2 className="mb-4 text-lg font-semibold text-[#2f363d]">Información del estudiante</h2>

                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Nombre</p>
                      <p className="mt-1 text-[#2f363d]">
                        {estudianteFinal.nombre} {estudianteFinal.apellido ?? ""}
                      </p>
                    </article>

                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">RUT</p>
                      <p className="mt-1 text-[#2f363d]">{estudianteFinal.rut}</p>
                    </article>

                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Correo</p>
                      <p className="mt-1 break-all text-[#2f363d]">{estudianteFinal.correo}</p>
                    </article>

                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Carrera</p>
                      <p className="mt-1 break-all text-[#2f363d]">{estudianteFinal.carrera}</p>
                    </article>
                  </div>
                  <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Teléfono</p>
                    <p className="mt-1 text-[#2f363d]">{estudianteFinal.telefono}</p>
                  </article>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Talleres Inscritos</p>
                      <p className="mt-1 text-xl font-semibold text-[#2f363d]">
                        {estudianteFinal.talleresInscritos ?? historialFinal.length}
                      </p>
                    </article>

                    <article className="rounded-xl border border-[#dfe3e7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#68727d]">Talleres Aprobados</p>
                      <p className="mt-1 text-xl font-semibold text-[#2f363d]">
                        {estudianteFinal.talleresAprobados ??
                          historialFinal.filter((item) => item.estado === "Calificado").length}
                      </p>
                    </article>
                  </div>

                  {user?.rol === 'Administrador' && (
                    <div className="mt-6 p-5 bg-white border border-[#dfe3e7] rounded-xl shadow-sm">
                      <h3 className="text-base font-semibold text-[#2f363d] mb-2">Inscribir en un nuevo taller</h3>
                      <p className="text-xs text-gray-500 mb-4">Inscribe al estudiante en alguno de los talleres dictados en este semestre.</p>

                      {errorInscripcion && (
                        <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                          {errorInscripcion}
                        </div>
                      )}

                      {exitoInscripcion && (
                        <div className="mb-3 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
                          {exitoInscripcion}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-700 outline-none focus:border-blue-500"
                          value={tallerParaInscribir}
                          onChange={(e) => setTallerParaInscribir(e.target.value)}
                        >
                          <option value="">-- Seleccionar Taller --</option>
                          {nombresParaElegir.map((nombre) => (
                            <option key={nombre} value={nombre}>
                              {nombre}
                            </option>
                          ))}
                        </select>

                        {tallerParaInscribir && idsDelTallerElegido.length > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Se inscribirá en los {idsDelTallerElegido.length} bloques de este taller.
                          </p>
                        )}
                        <button
                          onClick={handleInscribir}
                          disabled={!tallerParaInscribir || cargandoInscripcion}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cargandoInscripcion ? 'Inscribiendo...' : 'Inscribir estudiante'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <aside className="rounded-2xl border border-[#dfe3e7] bg-gradient-to-b from-[#f6f7f8] to-[#fcfcfd] p-5 shadow-[0_8px_22px_-18px_rgba(31,35,40,0.28)]">
                  <h3 className="text-base font-semibold text-[#2f363d]">Resumen</h3>
                  <p className="mt-2 text-sm text-[#5a636d]">Asistencia promedio general</p>
                  <p className="mt-1 text-3xl font-bold text-[#2f363d]">{resumenAsistencia}%</p>
                  <div className="mt-3 h-3 w-full rounded-full bg-[#e5e9ee]">
                    <div
                      className={`h-3 rounded-full ${colorAsistencia(resumenAsistencia)}`}
                      style={{ width: `${resumenAsistencia}%` }}
                    />
                  </div>

                  <p className="mt-6 text-sm text-[#5a636d]">Talleres históricos</p>
                  <p className="text-2xl font-semibold text-[#2f363d]">{historialFinal.length}</p>
                </aside>
              </div>

              <section className="mt-4 rounded-2xl border border-[#dfe3e7] bg-gradient-to-b from-[#f6f7f8] to-[#fcfcfd] p-5 shadow-[0_8px_22px_-18px_rgba(31,35,40,0.28)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#2f363d]">Historial de talleres</h2>
                  <span className="text-sm font-medium text-[#5a636d]">Total: {historialFinal.length}</span>
                  <button
                    onClick={manejarExportacionExcel}
                    className="inline-flex items-center justify-center rounded-xl border border-[#dfe3e7] bg-[#2f363d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f252b]"
                  >
                    Exportar Excel
                  </button>
                </div>

                <div className="grid gap-3">
                  {historialFinal.map((taller) => (
                    <article
                      key={taller.id}
                      className="rounded-xl border border-[#dfe3e7] bg-white p-4 transition hover:-translate-y-[1px] hover:border-[#b7c2cd] hover:shadow-[0_10px_20px_-16px_rgba(31,35,40,0.34)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#cfd7df] bg-[#f3f6f9] px-2.5 py-1 text-xs font-semibold text-[#2f363d]">
                              {taller.codigo}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colorEstado(taller.estado)}`}>
                              {taller.estado}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-[#2f363d]">{taller.nombre}</h3>
                          <p className="mt-1 text-sm text-[#5a636d]">Semestre {taller.semestre} · Bloque {taller.bloque}</p>
                        </div>

                        <div className="min-w-40">
                          <div className="mb-1 flex items-end justify-between">
                            <span className="text-sm text-[#5a636d]">Asistencia</span>
                            <span className="text-sm font-semibold text-[#2f363d]">{taller.asistencia}%</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-[#e5e9ee]">
                            <div
                              className={`h-2.5 rounded-full ${colorAsistencia(taller.asistencia)}`}
                              style={{ width: `${taller.asistencia}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-4 rounded-2xl border border-[#dfe3e7] bg-gradient-to-b from-[#f6f7f8] to-[#fcfcfd] p-5 shadow-[0_8px_22px_-18px_rgba(31,35,40,0.28)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#2f363d]">Ayudante</h2>
                  <span className="text-sm font-medium text-[#5a636d]">Total: {ayudantias.length}</span>
                </div>

                {cargandoAyudantias && (
                  <p className="text-sm text-[#5a636d]">Cargando ayudantías...</p>
                )}

                {errorAyudantias && !cargandoAyudantias && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {errorAyudantias}
                  </div>
                )}

                {!cargandoAyudantias && !errorAyudantias && ayudantias.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[#cfd7df] bg-white p-4 text-sm text-[#5a636d]">
                    No hay ayudantías.
                  </p>
                )}

                {ayudantias.length > 0 && (
                  <div className="grid gap-5">
                    {ayudantiasPorSemestre.map(([semestre, items]) => (
                      <div key={semestre}>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#68727d]">
                          Semestre {semestre}
                        </h3>

                        <div className="grid gap-3">
                          {items.map((a) => (
                            <article
                              key={`${a.tallerId}-${a.dia}-${a.bloque}`}
                              className="rounded-xl border border-[#dfe3e7] bg-white p-4 transition hover:-translate-y-[1px] hover:border-[#b7c2cd] hover:shadow-[0_10px_20px_-16px_rgba(31,35,40,0.34)]"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h4 className="text-base font-semibold text-[#2f363d]">{a.taller}</h4>
                                  <p className="mt-1 text-sm text-[#5a636d]">
                                    {a.dia} · Bloque {a.bloque} · {a.horario}
                                  </p>
                                </div>

                                <div className="text-sm text-[#5a636d] sm:text-right">
                                  <p>
                                    <span className="font-semibold text-[#2f363d]">Lugar:</span> {a.lugar}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold text-[#2f363d]">Profesor:</span>{" "}
                                    {a.profesor ?? "Sin asignar"}
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  )
}