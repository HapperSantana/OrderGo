import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NuevoCliente } from '../../types/cliente'
import { UserPlus } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'

interface ClienteFormProps {
  onGuardar: (cliente: NuevoCliente) => Promise<{ error: string | null }>
}

const CAMPOS_INICIALES: NuevoCliente = { nombre: '', telefono: '', direccion: '', notas: '' }

export function ClienteForm({ onGuardar }: ClienteFormProps) {
  const [campos, setCampos] = useState<NuevoCliente>(CAMPOS_INICIALES)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function actualizarCampo<K extends keyof NuevoCliente>(campo: K, valor: string) {
    setCampos((actual) => ({ ...actual, [campo]: valor }))
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const nombre = campos.nombre.trim()
    const telefono = campos.telefono.trim()

    if (!nombre || !telefono) {
      setError('El nombre y el teléfono son obligatorios.')
      return
    }

    setIsSubmitting(true)
    const { error: errorGuardado } = await onGuardar({
      nombre,
      telefono,
      direccion: campos.direccion?.trim() || undefined,
      notas: campos.notas?.trim() || undefined,
    })
    setIsSubmitting(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }

    setCampos(CAMPOS_INICIALES)
  }

  return (
    <form className="tarjeta formulario-cliente" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <TituloSeccion className="formulario-cliente__titulo" icono={UserPlus}>
        Nuevo cliente
      </TituloSeccion>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      <div className="formulario-cliente__rejilla">
        <label className="campo">
          <span className="campo__etiqueta">Nombre *</span>
          <input
            type="text"
            required
            value={campos.nombre}
            onChange={(evento) => actualizarCampo('nombre', evento.target.value)}
            placeholder="Nombre del cliente"
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Teléfono *</span>
          <input
            type="tel"
            required
            value={campos.telefono}
            onChange={(evento) => actualizarCampo('telefono', evento.target.value)}
            placeholder="Ej. 33 1234 5678"
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Dirección</span>
          <input
            type="text"
            value={campos.direccion}
            onChange={(evento) => actualizarCampo('direccion', evento.target.value)}
            placeholder="Opcional"
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Notas</span>
          <input
            type="text"
            value={campos.notas}
            onChange={(evento) => actualizarCampo('notas', evento.target.value)}
            placeholder="Ej. alergias, referencias"
          />
        </label>
      </div>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        <UserPlus size={18} aria-hidden="true" focusable="false" />
        {isSubmitting ? 'Guardando…' : 'Guardar cliente'}
      </button>
    </form>
  )
}
