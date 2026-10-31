import type { Categoria } from '../types/categoria'
import type { Producto } from '../types/producto'

// Reglas de las categorías de productos (HU12). Lógica pura: se prueba con Vitest.

export const LARGO_MAXIMO_NOMBRE_CATEGORIA = 40

// Valores especiales del filtro de categoría del catálogo (además de un id de categoría).
export const FILTRO_TODAS = 'todas'
export const FILTRO_SIN_CATEGORIA = 'sin_categoria'

// Emojis que el propietario puede elegir para una categoría. Es una lista
// cerrada y de comida a propósito: se ve igual en todos los equipos, no hace
// falta saber abrir el teclado de emojis y la base de datos solo recibe valores conocidos.
export const EMOJIS_CATEGORIA: readonly string[] = [
  '🌮', '🌯', '🥙', '🍔', '🍟', '🍕', '🌭', '🥪', '🍗', '🍖', '🥩', '🍤', '🍣', '🍜',
  '🍲', '🥗', '🍝', '🍚', '🥘', '🍳', '🥞', '🥐', '🍞', '🧀', '🍰', '🧁', '🍩', '🍪',
  '🍫', '🍦', '🍨', '☕', '🍵', '🥤', '🧃', '🍺', '🍷', '🍹', '🥛', '🍎', '🍋', '🥑',
  '🌶️', '🥕', '🍅',
]

export function esEmojiCategoriaValido(emoji: string | null): boolean {
  return emoji === null || EMOJIS_CATEGORIA.includes(emoji)
}

// Misma normalización que la columna categorias.nombre_normalizado de la base de
// datos (lower(trim(nombre))): "Bebidas" y " bebidas " son la misma categoría.
export function normalizarNombreCategoria(nombre: string): string {
  return nombre.trim().toLowerCase()
}

// Devuelve un mensaje para el usuario si el nombre no sirve, o null si es válido.
export function validarNombreCategoria(nombre: string): string | null {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribe el nombre de la categoría.'
  if (limpio.length > LARGO_MAXIMO_NOMBRE_CATEGORIA) {
    return `El nombre es demasiado largo (máximo ${LARGO_MAXIMO_NOMBRE_CATEGORIA} caracteres).`
  }
  return null
}

// Busca otra categoría con el mismo nombre normalizado. `idExcluido` sirve al
// renombrar: una categoría no es duplicado de sí misma.
export function buscarCategoriaDuplicada<T extends Pick<Categoria, 'id' | 'nombre'>>(
  categorias: T[],
  nombre: string,
  idExcluido?: string,
): T | undefined {
  const buscado = normalizarNombreCategoria(nombre)
  return categorias.find((c) => c.id !== idExcluido && normalizarNombreCategoria(c.nombre) === buscado)
}

export function ordenarCategorias<T extends Pick<Categoria, 'nombre'>>(categorias: T[]): T[] {
  return [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
}

// Texto para mostrar una categoría: "🥤 Bebidas", "Bebidas" o "Sin categoría".
export function etiquetaCategoria(categoria: Pick<Categoria, 'nombre' | 'emoji'> | null | undefined): string {
  if (!categoria) return 'Sin categoría'
  return categoria.emoji ? `${categoria.emoji} ${categoria.nombre}` : categoria.nombre
}

// Cuántos productos tiene cada categoría. La clave null cuenta los "Sin categoría".
export function contarProductosPorCategoria(productos: Pick<Producto, 'categoria_id'>[]): Map<string | null, number> {
  const conteo = new Map<string | null, number>()
  for (const producto of productos) {
    const clave = producto.categoria_id ?? null
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
  }
  return conteo
}

interface OpcionesFiltroProductos {
  busqueda: string
  // FILTRO_TODAS, FILTRO_SIN_CATEGORIA o el id de una categoría.
  categoria: string
}

export function filtrarProductos<T extends Pick<Producto, 'nombre' | 'categoria_id'>>(
  productos: T[],
  { busqueda, categoria }: OpcionesFiltroProductos,
): T[] {
  const termino = busqueda.trim().toLowerCase()
  return productos.filter((p) => {
    if (categoria === FILTRO_SIN_CATEGORIA && p.categoria_id) return false
    if (categoria !== FILTRO_TODAS && categoria !== FILTRO_SIN_CATEGORIA && p.categoria_id !== categoria) return false
    if (termino && !p.nombre.toLowerCase().includes(termino)) return false
    return true
  })
}

export interface GrupoDeCategoria<P> {
  // null = el grupo "Sin categoría".
  categoria: Categoria | null
  productos: P[]
}

// Agrupa productos por categoría para mostrarlos juntos (el selector de
// productos de los pedidos, HU13, lo usa). Las categorías salen en orden
// alfabético, "Sin categoría" siempre al final y los productos de cada grupo
// por nombre. Los grupos sin productos no se incluyen.
export function agruparPorCategoria<P extends Pick<Producto, 'nombre' | 'categoria_id'>>(
  productos: P[],
  categorias: Categoria[],
): GrupoDeCategoria<P>[] {
  const porNombre = (a: P, b: P) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  const grupos: GrupoDeCategoria<P>[] = []

  for (const categoria of ordenarCategorias(categorias)) {
    const delGrupo = productos.filter((p) => p.categoria_id === categoria.id).sort(porNombre)
    if (delGrupo.length > 0) grupos.push({ categoria, productos: delGrupo })
  }

  // Sin categoría: los que no tienen, y también los que apuntan a una categoría que ya no está en la lista.
  const idsConocidos = new Set(categorias.map((c) => c.id))
  const sueltos = productos.filter((p) => !p.categoria_id || !idsConocidos.has(p.categoria_id)).sort(porNombre)
  if (sueltos.length > 0) grupos.push({ categoria: null, productos: sueltos })

  return grupos
}
