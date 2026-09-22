import { useState } from 'react'
import { formatearMoneda } from '../../utils/dinero'
import type { Producto } from '../../types/producto'

interface ProductoRowProps {
  producto: Producto
  onActualizar: (
    id: string,
    cambios: { nombre: string; precio: number; disponible: boolean },
  ) => Promise<{ error: string | null }>
  onEliminar: (id: string) => Promise<{ error: string | null }>
}

export function ProductoRow({ producto, onActualizar, onEliminar }: ProductoRowProps) {
  const [modoEdicion, setModoEdicion] = useState(false)
  const [nombre, setNombre] = useState(producto.nombre)
  const [precio, setPrecio] = useState(String(producto.precio))
  const [disponible, setDisponible] = useState(producto.disponible)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function cancelarEdicion() {
    setNombre(producto.nombre)
    setPrecio(String(producto.precio))
    setDisponible(producto.disponible)
    setError(null)
    setModoEdicion(false)
  }

  async function guardarEdicion() {
    setError(null)
    const nombreLimpio = nombre.trim()
    const precioNumerico = Number(precio)

    if (!nombreLimpio) {
      setError('El nombre no puede estar vacío.')
      return
    }
    if (!precio || Number.isNaN(precioNumerico) || precioNumerico <= 0) {
      setError('Captura un precio mayor a cero.')
      return
    }

    setIsSaving(true)
    const { error: errorGuardado } = await onActualizar(producto.id, {
      nombre: nombreLimpio,
      precio: precioNumerico,
      disponible,
    })
    setIsSaving(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }
    setModoEdicion(false)
  }

  async function eliminar() {
    const confirmado = window.confirm(`¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer.`)
    if (!confirmado) return

    setError(null)
    setIsDeleting(true)
    const { error: errorEliminar } = await onEliminar(producto.id)
    setIsDeleting(false)

    if (errorEliminar) setError(errorEliminar)
  }

  if (modoEdicion) {
    return (
      <tr className="tabla-productos__fila tabla-productos__fila--edicion">
        <td colSpan={4}>
          {error && (
            <p className="mensaje-error" role="alert">
              {error}
            </p>
          )}
          <div className="tabla-productos__edicion">
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Nombre del producto"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={precio}
              onChange={(evento) => setPrecio(evento.target.value)}
              placeholder="0.00"
            />
            <label className="tabla-productos__disponible-check">
              <input
                type="checkbox"
                checked={disponible}
                onChange={(evento) => setDisponible(evento.target.checked)}
              />
              Disponible
            </label>
            <div className="tabla-productos__acciones">
              <button type="button" className="boton boton--primario" disabled={isSaving} onClick={() => void guardarEdicion()}>
                {isSaving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" className="boton boton--enlace" onClick={cancelarEdicion} disabled={isSaving}>
                Cancelar
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="tabla-productos__fila">
      <td>
        <span className="tabla-productos__nombre">{producto.nombre}</span>
        {error && (
          <p className="mensaje-error mensaje-error--compacto" role="alert">
            {error}
          </p>
        )}
      </td>
      <td>{formatearMoneda(producto.precio)}</td>
      <td>
        <span className={`badge-disponible ${producto.disponible ? 'badge-disponible--si' : 'badge-disponible--no'}`}>
          {producto.disponible ? 'Disponible' : 'No disponible'}
        </span>
      </td>
      <td className="tabla-productos__acciones">
        <button type="button" className="boton boton--enlace" onClick={() => setModoEdicion(true)}>
          Editar
        </button>
        <button type="button" className="boton boton--enlace boton--peligro" disabled={isDeleting} onClick={() => void eliminar()}>
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </td>
    </tr>
  )
}
