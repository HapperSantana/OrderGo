import { useState } from 'react'
import type { FormEvent } from 'react'
import { SIN_CAMBIO_DE_IMAGEN } from '../../types/producto'
import type { Categoria } from '../../types/categoria'
import type { NuevoProducto, SeleccionImagen } from '../../types/producto'
import { etiquetaCategoria } from '../../utils/categorias'
import { SelectorImagen } from './SelectorImagen'
import { PackagePlus } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'
import { CampoConIcono } from '../ui/CampoConIcono'

interface ProductoFormProps {
  categorias: Categoria[]
  // `imagen` es el archivo elegido (sin reducir ni subir todavía) o null si no se eligió ninguno.
  onGuardar: (producto: NuevoProducto, imagen: File | null) => Promise<{ error: string | null }>
}

const CAMPOS_INICIALES = { nombre: '', precio: '', categoriaId: '' }

export function ProductoForm({ categorias, onGuardar }: ProductoFormProps) {
  const [campos, setCampos] = useState(CAMPOS_INICIALES)
  const [imagen, setImagen] = useState<SeleccionImagen>(SIN_CAMBIO_DE_IMAGEN)
  // Cambiar esta clave reinicia el selector de imagen (vista previa y archivo) tras guardar.
  const [claveImagen, setClaveImagen] = useState(0)
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
    // Si la categoría elegida ya no existe (se eliminó mientras el formulario estaba abierto), se guarda sin categoría.
    const categoriaId = categorias.some((c) => c.id === campos.categoriaId) ? campos.categoriaId : null
    const { error: errorGuardado } = await onGuardar(
      { nombre, precio, disponible: true, categoria_id: categoriaId },
      imagen.archivo,
    )
    setIsSubmitting(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }

    setCampos(CAMPOS_INICIALES)
    setImagen(SIN_CAMBIO_DE_IMAGEN)
    setClaveImagen((clave) => clave + 1)
  }

  return (
    <form className="tarjeta formulario-producto" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <TituloSeccion className="formulario-producto__titulo" icono={PackagePlus}>
        Nuevo producto
      </TituloSeccion>

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
          <CampoConIcono simbolo="$">
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={campos.precio}
              onChange={(evento) => setCampos((actual) => ({ ...actual, precio: evento.target.value }))}
              placeholder="0.00"
            />
          </CampoConIcono>
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Categoría</span>
          <select
            value={categorias.some((c) => c.id === campos.categoriaId) ? campos.categoriaId : ''}
            onChange={(evento) => setCampos((actual) => ({ ...actual, categoriaId: evento.target.value }))}
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {etiquetaCategoria(categoria)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="formulario-producto__imagen">
        <span className="campo__etiqueta">Imagen (opcional)</span>
        <SelectorImagen
          key={claveImagen}
          urlActual={null}
          nombreProducto={campos.nombre}
          onChange={setImagen}
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        <PackagePlus size={18} aria-hidden="true" focusable="false" />
        {isSubmitting ? 'Guardando…' : 'Agregar al catálogo'}
      </button>
    </form>
  )
}
