import { useState } from 'react'
import { formatearMoneda } from '../../utils/dinero'
import { SIN_CAMBIO_DE_IMAGEN } from '../../types/producto'
import type { Categoria } from '../../types/categoria'
import type { Producto, SeleccionImagen } from '../../types/producto'
import { etiquetaCategoria } from '../../utils/categorias'
import { urlImagenProducto } from '../../lib/imagenesProductos'
import { MiniaturaProducto } from './MiniaturaProducto'
import { SelectorImagen } from './SelectorImagen'
import { CampoConIcono } from '../ui/CampoConIcono'

interface ProductoRowProps {
  producto: Producto
  categorias: Categoria[]
  onActualizar: (
    id: string,
    cambios: { nombre: string; precio: number; disponible: boolean; categoria_id: string | null },
    imagen: SeleccionImagen,
  ) => Promise<{ error: string | null }>
  onEliminar: (id: string) => Promise<{ error: string | null }>
}

export function ProductoRow({ producto, categorias, onActualizar, onEliminar }: ProductoRowProps) {
  const [modoEdicion, setModoEdicion] = useState(false)
  const [nombre, setNombre] = useState(producto.nombre)
  const [precio, setPrecio] = useState(String(producto.precio))
  const [disponible, setDisponible] = useState(producto.disponible)
  const [categoriaId, setCategoriaId] = useState(producto.categoria_id ?? '')
  const [imagen, setImagen] = useState<SeleccionImagen>(SIN_CAMBIO_DE_IMAGEN)
  // Cambiar esta clave reinicia el selector de imagen al cancelar o guardar.
  const [claveImagen, setClaveImagen] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function cancelarEdicion() {
    setNombre(producto.nombre)
    setPrecio(String(producto.precio))
    setDisponible(producto.disponible)
    setCategoriaId(producto.categoria_id ?? '')
    setImagen(SIN_CAMBIO_DE_IMAGEN)
    setClaveImagen((clave) => clave + 1)
    setError(null)
    setModoEdicion(false)
  }

  // Si la categoría elegida ya no existe (se eliminó mientras se editaba), queda sin categoría.
  const categoriaVigente = categorias.some((c) => c.id === categoriaId) ? categoriaId : ''
  const categoriaActual = categorias.find((c) => c.id === producto.categoria_id)

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
    const { error: errorGuardado } = await onActualizar(
      producto.id,
      { nombre: nombreLimpio, precio: precioNumerico, disponible, categoria_id: categoriaVigente || null },
      imagen,
    )
    setIsSaving(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }
    setImagen(SIN_CAMBIO_DE_IMAGEN)
    setClaveImagen((clave) => clave + 1)
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
        <td colSpan={6}>
          {error && (
            <p className="mensaje-error" role="alert">
              {error}
            </p>
          )}
          <div className="tabla-productos__imagen-edicion">
            <SelectorImagen
              key={claveImagen}
              urlActual={urlImagenProducto(producto.imagen_path)}
              nombreProducto={nombre}
              onChange={setImagen}
              disabled={isSaving}
            />
          </div>
          <div className="tabla-productos__edicion">
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Nombre del producto"
            />
            <CampoConIcono simbolo="$">
              <input
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(evento) => setPrecio(evento.target.value)}
                placeholder="0.00"
              />
            </CampoConIcono>
            <select
              value={categoriaVigente}
              onChange={(evento) => setCategoriaId(evento.target.value)}
              aria-label="Categoría del producto"
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {etiquetaCategoria(categoria)}
                </option>
              ))}
            </select>
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
      <td className="tabla-productos__col-imagen">
        <MiniaturaProducto url={urlImagenProducto(producto.imagen_path)} nombre={producto.nombre} />
      </td>
      <td>
        <span className="tabla-productos__nombre">{producto.nombre}</span>
        {error && (
          <p className="mensaje-error mensaje-error--compacto" role="alert">
            {error}
          </p>
        )}
      </td>
      <td>
        <span className={`etiqueta-categoria${categoriaActual ? '' : ' etiqueta-categoria--sin'}`}>
          {etiquetaCategoria(categoriaActual)}
        </span>
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
