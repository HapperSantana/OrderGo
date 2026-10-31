import type { Categoria } from '../types/categoria'
import type { ItemNuevoPedido } from '../types/pedido'
import type { Producto } from '../types/producto'
import { agruparPorCategoria, filtrarProductos } from './categorias'
import type { GrupoDeCategoria } from './categorias'

// Lógica pura del selector de productos del pedido (HU13). Se prueba con Vitest.

// Máximo de unidades de un producto que se puede sumar de una vez en el selector.
export const CANTIDAD_MAXIMA_SELECTOR = 99

// Misma normalización que productos.nombre_normalizado en la base de datos.
export function normalizarNombreProducto(nombre: string): string {
  return nombre.trim().toLowerCase()
}

const centavos = (importe: number) => Math.round(Number(importe) * 100)

// Un producto del catálogo con la cantidad que se eligió en el selector.
export interface ProductoElegido {
  producto: Pick<Producto, 'id' | 'nombre' | 'precio'>
  cantidad: number
}

// Selección en curso dentro del selector: id de producto -> cantidad (siempre ≥ 1).
export type SeleccionProductos = ReadonlyMap<string, number>

// Suma (o resta) unidades de un producto. Nunca baja de 0 (a 0 el producto sale de la
// selección) ni pasa del máximo. Devuelve un Map nuevo: no modifica el original.
export function cambiarCantidadSeleccion(seleccion: SeleccionProductos, productoId: string, delta: number): Map<string, number> {
  const nueva = new Map(seleccion)
  const cantidad = Math.min(CANTIDAD_MAXIMA_SELECTOR, Math.max(0, (nueva.get(productoId) ?? 0) + delta))
  if (cantidad === 0) nueva.delete(productoId)
  else nueva.set(productoId, cantidad)
  return nueva
}

export function unidadesSeleccionadas(seleccion: SeleccionProductos): number {
  let total = 0
  for (const cantidad of seleccion.values()) total += cantidad
  return total
}

// Los productos elegidos, en el orden en que se fueron eligiendo (el pedido respeta el
// orden en que la persona los tocó). Ignora ids que ya no existen en el catálogo.
export function elegidosDeSeleccion(
  seleccion: SeleccionProductos,
  productos: Pick<Producto, 'id' | 'nombre' | 'precio'>[],
): ProductoElegido[] {
  const elegidos: ProductoElegido[] = []
  for (const [id, cantidad] of seleccion) {
    const producto = productos.find((p) => p.id === id)
    if (producto) elegidos.push({ producto, cantidad })
  }
  return elegidos
}

// Total en pesos de una selección, sumado en centavos para evitar errores de coma flotante.
export function totalSeleccion(seleccion: SeleccionProductos, productos: Pick<Producto, 'id' | 'precio'>[]): number {
  let total = 0
  for (const producto of productos) total += centavos(producto.precio) * (seleccion.get(producto.id) ?? 0)
  return total / 100
}

// Total del pedido: suma de precio × cantidad de cada renglón, en centavos.
export function totalRenglones(renglones: Pick<ItemNuevoPedido, 'precio' | 'cantidad'>[]): number {
  return renglones.reduce((total, r) => total + centavos(r.precio) * r.cantidad, 0) / 100
}

// Mezcla lo elegido en el selector con los renglones que el pedido ya tiene:
//  - si el producto YA está en el pedido, se suma la cantidad a ese renglón (que
//    conserva su precio y sus instrucciones: puede tener un descuento);
//  - si no está, se agrega un renglón nuevo con el precio del catálogo.
// No modifica los renglones originales. Conserva las propiedades extra de los
// renglones existentes (por ejemplo la "clave" que usa React).
export function unirSeleccionConRenglones<T extends ItemNuevoPedido>(
  renglones: T[],
  elegidos: ProductoElegido[],
): (T | ItemNuevoPedido)[] {
  const resultado: (T | ItemNuevoPedido)[] = renglones.map((r) => ({ ...r }))

  for (const { producto, cantidad } of elegidos) {
    if (!(cantidad > 0)) continue
    const nombreNormalizado = normalizarNombreProducto(producto.nombre)
    const existente = resultado.findIndex((r) => normalizarNombreProducto(r.nombre) === nombreNormalizado)

    if (existente >= 0) {
      resultado[existente] = { ...resultado[existente], cantidad: resultado[existente].cantidad + cantidad }
    } else {
      resultado.push({ nombre: producto.nombre, precio: Number(producto.precio), cantidad })
    }
  }

  return resultado
}

interface OpcionesSelector {
  busqueda: string
  // FILTRO_TODAS, FILTRO_SIN_CATEGORIA o el id de una categoría.
  categoria: string
}

// Lo que muestra el selector: solo productos DISPONIBLES, filtrados por categoría y
// búsqueda, y agrupados por categoría (alfabético, "Sin categoría" al final).
export function productosParaSelector(
  productos: Producto[],
  categorias: Categoria[],
  { busqueda, categoria }: OpcionesSelector,
): GrupoDeCategoria<Producto>[] {
  const disponibles = productos.filter((p) => p.disponible)
  return agruparPorCategoria(filtrarProductos(disponibles, { busqueda, categoria }), categorias)
}

// Categorías que vale la pena mostrar como pestañas: las que tienen al menos un
// producto disponible, y si hay disponibles sin categoría, cuántos son.
export function pestanasDelSelector(
  productos: Pick<Producto, 'disponible' | 'categoria_id'>[],
  categorias: Categoria[],
): { categorias: Categoria[]; haySinCategoria: boolean } {
  const disponibles = productos.filter((p) => p.disponible)
  const idsConocidos = new Set(categorias.map((c) => c.id))
  return {
    categorias: categorias.filter((c) => disponibles.some((p) => p.categoria_id === c.id)),
    haySinCategoria: disponibles.some((p) => !p.categoria_id || !idsConocidos.has(p.categoria_id)),
  }
}
