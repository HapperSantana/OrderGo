import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Categoria, DatosCategoria } from '../../types/categoria'
import { LARGO_MAXIMO_NOMBRE_CATEGORIA } from '../../utils/categorias'
import { SelectorEmoji } from './SelectorEmoji'
import { Plus, Tags } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'

type Resultado = Promise<{ error: string | null }>

interface CategoriasProductosProps {
  categorias: Categoria[]
  // Cuántos productos tiene cada categoría (clave = id de la categoría).
  conteoProductos: Map<string | null, number>
  onCrear: (datos: DatosCategoria) => Resultado
  onActualizar: (id: string, datos: DatosCategoria) => Resultado
  onEliminar: (id: string) => Resultado
}

export function CategoriasProductos({ categorias, conteoProductos, onCrear, onActualizar, onEliminar }: CategoriasProductosProps) {
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const { error: errorGuardado } = await onCrear({ nombre: nombre.trim(), emoji })
    setIsSubmitting(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }
    setNombre('')
    setEmoji(null)
  }

  return (
    <section className="tarjeta categorias" aria-labelledby="titulo-categorias">
      <TituloSeccion id="titulo-categorias" className="categorias__titulo" icono={Tags}>
        Categorías
      </TituloSeccion>
      <p className="categorias__ayuda">Organiza tu menú (bebidas, comida, postres…). Cada producto puede tener una.</p>

      <form className="categorias__formulario" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
        <SelectorEmoji valor={emoji} onChange={setEmoji} disabled={isSubmitting} etiqueta="Emoji de la nueva categoría" />
        <input
          type="text"
          className="categorias__nombre"
          value={nombre}
          maxLength={LARGO_MAXIMO_NOMBRE_CATEGORIA + 10}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Ej. Bebidas"
          aria-label="Nombre de la nueva categoría"
        />
        <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
          <Plus size={18} aria-hidden="true" focusable="false" />
          {isSubmitting ? 'Guardando…' : 'Agregar categoría'}
        </button>
      </form>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {categorias.length === 0 ? (
        <p className="categorias__vacio">Aún no tienes categorías. Crea la primera para organizar tu menú.</p>
      ) : (
        <ul className="categorias__lista">
          {categorias.map((categoria) => (
            <CategoriaFila
              key={categoria.id}
              categoria={categoria}
              cantidadProductos={conteoProductos.get(categoria.id) ?? 0}
              onActualizar={onActualizar}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface CategoriaFilaProps {
  categoria: Categoria
  cantidadProductos: number
  onActualizar: (id: string, datos: DatosCategoria) => Resultado
  onEliminar: (id: string) => Resultado
}

function CategoriaFila({ categoria, cantidadProductos, onActualizar, onEliminar }: CategoriaFilaProps) {
  const [modoEdicion, setModoEdicion] = useState(false)
  const [nombre, setNombre] = useState(categoria.nombre)
  const [emoji, setEmoji] = useState<string | null>(categoria.emoji)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function cancelar() {
    setNombre(categoria.nombre)
    setEmoji(categoria.emoji)
    setError(null)
    setModoEdicion(false)
  }

  async function guardar() {
    setError(null)
    setIsSaving(true)
    const { error: errorGuardado } = await onActualizar(categoria.id, { nombre: nombre.trim(), emoji })
    setIsSaving(false)

    if (errorGuardado) {
      setError(errorGuardado)
      return
    }
    setModoEdicion(false)
  }

  async function eliminar() {
    let aviso = ''
    if (cantidadProductos === 1) {
      aviso = ' Su producto no se borra: quedará en "Sin categoría".'
    } else if (cantidadProductos > 1) {
      aviso = ` Sus ${cantidadProductos} productos no se borran: quedarán en "Sin categoría".`
    }
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?${aviso}`)) return

    setError(null)
    setIsDeleting(true)
    const { error: errorEliminar } = await onEliminar(categoria.id)
    setIsDeleting(false)
    if (errorEliminar) setError(errorEliminar)
  }

  if (modoEdicion) {
    return (
      <li className="categoria-fila categoria-fila--edicion">
        <div className="categoria-fila__edicion">
          <SelectorEmoji valor={emoji} onChange={setEmoji} disabled={isSaving} etiqueta={`Emoji de la categoría ${categoria.nombre}`} />
          <input
            type="text"
            className="categorias__nombre"
            value={nombre}
            maxLength={LARGO_MAXIMO_NOMBRE_CATEGORIA + 10}
            onChange={(evento) => setNombre(evento.target.value)}
            aria-label={`Nombre de la categoría ${categoria.nombre}`}
          />
          <button type="button" className="boton boton--primario" disabled={isSaving} onClick={() => void guardar()}>
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton boton--enlace" disabled={isSaving} onClick={cancelar}>
            Cancelar
          </button>
        </div>
        {error && (
          <p className="mensaje-error mensaje-error--compacto" role="alert">
            {error}
          </p>
        )}
      </li>
    )
  }

  return (
    <li className="categoria-fila">
      <span className="categoria-fila__emoji" aria-hidden="true">
        {categoria.emoji ?? '·'}
      </span>
      <span className="categoria-fila__nombre">{categoria.nombre}</span>
      <span className="categoria-fila__conteo">
        {cantidadProductos} {cantidadProductos === 1 ? 'producto' : 'productos'}
      </span>
      <span className="categoria-fila__acciones">
        <button type="button" className="boton boton--enlace" onClick={() => setModoEdicion(true)}>
          Editar
        </button>
        <button type="button" className="boton boton--enlace boton--peligro" disabled={isDeleting} onClick={() => void eliminar()}>
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </span>
      {error && (
        <p className="mensaje-error mensaje-error--compacto categoria-fila__error" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}
