import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NuevoProducto } from '../../types/producto'

interface ProductoFormProps {
  onGuardar: (producto: NuevoProducto) => Promise<{ error: string | null }>
}

const CAMPOS_INICIALES = { nombre: '', precio: '' }

export function ProductoForm({ onGuardar }: ProductoFormProps) {
  const [campos, setCampos] = useState(CAMPOS_INICIALES)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const nombre = campos.nombre.trim()
    const precio = Number(campos.precio)

    if (!nombre) {
      setError('El nombre del producto es obligatorio.')
      return
    }
    if (!campos.precio || Number.isNaN(precio) || precio <= 0) {
      setError('Captura un precio mayor a cero.')
      return
    }

    setIsSubmitting(true)
    const { error: errorGuardado } = await onGuardar({ nombre, precio, disponible: true })
    setIsSubmitting(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }

    setCampos(CAMPOS_INICIALES)
  }

  return (
    <form className="tarjeta formulario-producto" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <h2 className="formulario-producto__titulo">Nuevo producto</h2>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      <div className="formulario-producto__rejilla">
        <label className="campo">
          <span className="campo__etiqueta">Nombre *</span>
          <input
            type="text"
            required
            value={campos.nombre}
            onChange={(evento) => setCampos((actual) => ({ ...actual, nombre: evento.target.value }))}
            placeholder="Ej. Tacos al pastor"
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Precio *</span>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={campos.precio}
            onChange={(evento) => setCampos((actual) => ({ ...actual, precio: evento.target.value }))}
            placeholder="0.00"
          />
        </label>
      </div>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando…' : 'Agregar al catálogo'}
      </button>
    </form>
  )
}
