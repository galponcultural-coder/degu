import { useState, type SubmitEvent, type ReactElement } from "react"

interface DatosEditablesEstudiante {
	nombre: string
	apellido?: string
	correo: string
	carrera: string
	telefono: string
}

interface ModalEditarDatosProps {
	estudiante: DatosEditablesEstudiante
	onGuardar: (datos: DatosEditablesEstudiante) => void
	onCerrar: () => void
}

export default function ModalEditarDatos({
	estudiante,
	onGuardar,
	onCerrar,
}: ModalEditarDatosProps): ReactElement {
	const [datos, setDatos] = useState<DatosEditablesEstudiante>({
		nombre: estudiante.nombre,
		apellido: estudiante.apellido ?? "",
		correo: estudiante.correo,
		carrera: estudiante.carrera,
		telefono: estudiante.telefono,
	})

	const actualizarCampo = (campo: keyof DatosEditablesEstudiante, valor: string) => {
		setDatos((actuales) => ({ ...actuales, [campo]: valor }))
	}

	const manejarEnvio = (evento: SubmitEvent) => {
		evento.preventDefault()
		onGuardar(datos)
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
			onClick={onCerrar}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="titulo-editar-datos"
				className="my-auto w-full max-w-xl rounded-xl border border-[#dfe3e7] bg-white p-6 shadow-2xl"
				onClick={(evento) => evento.stopPropagation()}
			>
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<h2 id="titulo-editar-datos" className="text-xl font-semibold text-[#2f363d]">
							Editar datos del estudiante
						</h2>
						<p className="mt-1 text-sm text-[#5a636d]">Actualiza la información personal.</p>
					</div>
					<button
						type="button"
						onClick={onCerrar}
						aria-label="Cerrar edición"
						className="rounded-lg px-2 py-1 text-xl leading-none text-[#5a636d] transition hover:bg-[#f3f6f9] hover:text-[#2f363d]"
					>
						×
					</button>
				</div>

				<form onSubmit={manejarEnvio} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block text-sm font-medium text-[#2f363d]">
							Nombre
							<input
								type="text"
								required
								autoFocus
								value={datos.nombre}
								onChange={(evento) => actualizarCampo("nombre", evento.target.value)}
								className="mt-1.5 w-full rounded-lg border border-[#cfd7df] px-3 py-2.5 font-normal outline-none transition focus:border-[#2f363d] focus:ring-2 focus:ring-[#2f363d]/10"
							/>
						</label>

						<label className="block text-sm font-medium text-[#2f363d]">
							Apellido
							<input
								type="text"
								required
								value={datos.apellido}
								onChange={(evento) => actualizarCampo("apellido", evento.target.value)}
								className="mt-1.5 w-full rounded-lg border border-[#cfd7df] px-3 py-2.5 font-normal outline-none transition focus:border-[#2f363d] focus:ring-2 focus:ring-[#2f363d]/10"
							/>
						</label>
					</div>

					<label className="block text-sm font-medium text-[#2f363d]">
						Correo electrónico
						<input
							type="email"
							required
							value={datos.correo}
							onChange={(evento) => actualizarCampo("correo", evento.target.value)}
							className="mt-1.5 w-full rounded-lg border border-[#cfd7df] px-3 py-2.5 font-normal outline-none transition focus:border-[#2f363d] focus:ring-2 focus:ring-[#2f363d]/10"
						/>
					</label>

					<label className="block text-sm font-medium text-[#2f363d]">
						Carrera
						<input
							type="text"
							required
							value={datos.carrera}
							onChange={(evento) => actualizarCampo("carrera", evento.target.value)}
							className="mt-1.5 w-full rounded-lg border border-[#cfd7df] px-3 py-2.5 font-normal outline-none transition focus:border-[#2f363d] focus:ring-2 focus:ring-[#2f363d]/10"
						/>
					</label>

					<label className="block text-sm font-medium text-[#2f363d]">
						Teléfono
						<input
							type="tel"
							required
							value={datos.telefono}
							onChange={(evento) => actualizarCampo("telefono", evento.target.value)}
							className="mt-1.5 w-full rounded-lg border border-[#cfd7df] px-3 py-2.5 font-normal outline-none transition focus:border-[#2f363d] focus:ring-2 focus:ring-[#2f363d]/10"
						/>
					</label>

					<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onCerrar}
							className="rounded-lg border border-[#cfd7df] px-4 py-2.5 text-sm font-semibold text-[#2f363d] transition hover:bg-[#f3f6f9]"
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[#2f363d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f252b]"
						>
							Guardar cambios
						</button>
					</div>
				</form>
			</section>
		</div>
	)
}
