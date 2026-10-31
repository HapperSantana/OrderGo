import { describe, expect, it } from 'vitest'
import type { Categoria } from '../types/categoria'
import type { ItemNuevoPedido } from '../types/pedido'
import type { Producto } from '../types/producto'
import { FILTRO_SIN_CATEGORIA, FILTRO_TODAS } from './categorias'
import {
  CANTIDAD_MAXIMA_SELECTOR,
  cambiarCantidadSeleccion,
  elegidosDeSeleccion,
  normalizarNombreProducto,
  pestanasDelSelector,
  productosParaSelector,
  totalRenglones,
  totalSeleccion,
  unidadesSeleccionadas,
  unirSeleccionConRenglones,
} from './seleccionProductos'

const prod = (id: string, nombre: string, precio: number, categoria_id: string | null = null, disponible = true): Producto => ({
  id, owner_id: 'u', nombre, precio, disponible, imagen_path: null, categoria_id, created_at: '2026-10-01T00:00:00Z',
})
const cat = (id: string, nombre: string, emoji: string | null = null): Categoria => ({ id, owner_id: 'u', nombre, emoji, created_at: '2026-10-01T00:00:00Z' })

describe('cambiarCantidadSeleccion', () => {
  it('suma y resta unidades sin modificar la selección original', () => {
    const original = new Map([['a', 1]])
    const nueva = cambiarCantidadSeleccion(original, 'a', 2)
    expect(nueva.get('a')).toBe(3)
    expect(original.get('a')).toBe(1)
  })

  it('un producto nuevo empieza en 1 al sumar', () => {
    expect(cambiarCantidadSeleccion(new Map(), 'a', 1).get('a')).toBe(1)
  })

  it('al llegar a 0 el producto sale de la selección', () => {
    const nueva = cambiarCantidadSeleccion(new Map([['a', 1]]), 'a', -1)
    expect(nueva.has('a')).toBe(false)
    expect(nueva.size).toBe(0)
  })

  it('nunca baja de 0 ni pasa del máximo', () => {
    expect(cambiarCantidadSeleccion(new Map(), 'a', -5).size).toBe(0)
    expect(cambiarCantidadSeleccion(new Map([['a', CANTIDAD_MAXIMA_SELECTOR]]), 'a', 1).get('a')).toBe(CANTIDAD_MAXIMA_SELECTOR)
  })
})

describe('unidades y totales de la selección', () => {
  const productos = [prod('a', 'Tacos', 18.5), prod('b', 'Agua', 20), prod('c', 'Flan', 35)]

  it('cuenta las unidades', () => {
    expect(unidadesSeleccionadas(new Map([['a', 2], ['b', 3]]))).toBe(5)
    expect(unidadesSeleccionadas(new Map())).toBe(0)
  })

  it('suma el total con los precios del catálogo', () => {
    expect(totalSeleccion(new Map([['a', 2], ['b', 1]]), productos)).toBe(57)
  })

  it('suma en centavos: 3 × $0.10 son exactamente $0.30', () => {
    expect(totalSeleccion(new Map([['x', 3]]), [prod('x', 'Dulce', 0.1)])).toBe(0.3)
  })

  it('ignora ids que ya no están en el catálogo', () => {
    expect(totalSeleccion(new Map([['fantasma', 4]]), productos)).toBe(0)
  })

  it('totalRenglones suma precio × cantidad sin errores de coma flotante', () => {
    expect(totalRenglones([{ precio: 0.1, cantidad: 3 }, { precio: 19.99, cantidad: 100 }])).toBe(1999.3)
    expect(totalRenglones([])).toBe(0)
  })
})

describe('elegidosDeSeleccion', () => {
  const productos = [prod('a', 'Tacos', 18), prod('b', 'Agua', 20), prod('c', 'Flan', 35)]

  it('devuelve los elegidos en el orden en que se eligieron, con su cantidad', () => {
    const elegidos = elegidosDeSeleccion(new Map([['c', 1], ['a', 2]]), productos)
    expect(elegidos.map((e) => [e.producto.nombre, e.cantidad])).toEqual([['Flan', 1], ['Tacos', 2]])
  })

  it('el orden de elección sobrevive a cambios de cantidad (un producto vuelve al final si se quita y se elige de nuevo)', () => {
    let seleccion = new Map<string, number>()
    seleccion = cambiarCantidadSeleccion(seleccion, 'a', 1)
    seleccion = cambiarCantidadSeleccion(seleccion, 'b', 1)
    seleccion = cambiarCantidadSeleccion(seleccion, 'a', 1)
    expect(elegidosDeSeleccion(seleccion, productos).map((e) => e.producto.nombre)).toEqual(['Tacos', 'Agua'])
    seleccion = cambiarCantidadSeleccion(cambiarCantidadSeleccion(seleccion, 'a', -2), 'a', 1)
    expect(elegidosDeSeleccion(seleccion, productos).map((e) => e.producto.nombre)).toEqual(['Agua', 'Tacos'])
  })

  it('ignora ids inexistentes', () => {
    expect(elegidosDeSeleccion(new Map([['fantasma', 1]]), productos)).toEqual([])
  })
})

describe('unirSeleccionConRenglones', () => {
  const tacos = prod('a', 'Tacos', 18)
  const agua = prod('b', 'Agua', 20)

  it('agrega renglones nuevos con el precio del catálogo y sin instrucciones', () => {
    const resultado = unirSeleccionConRenglones([], [{ producto: tacos, cantidad: 2 }])
    expect(resultado).toEqual([{ nombre: 'Tacos', precio: 18, cantidad: 2 }])
  })

  it('si el producto YA está en el pedido, suma la cantidad a ese renglón (no lo duplica)', () => {
    const renglones: ItemNuevoPedido[] = [{ nombre: 'Tacos', precio: 18, cantidad: 2 }]
    const resultado = unirSeleccionConRenglones(renglones, [{ producto: tacos, cantidad: 3 }])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].cantidad).toBe(5)
  })

  it('el renglón existente conserva su precio con descuento y sus instrucciones', () => {
    const renglones: ItemNuevoPedido[] = [{ nombre: 'Tacos', precio: 15, cantidad: 1, instrucciones: 'sin cebolla' }]
    const [renglon] = unirSeleccionConRenglones(renglones, [{ producto: tacos, cantidad: 1 }])
    expect(renglon).toEqual({ nombre: 'Tacos', precio: 15, cantidad: 2, instrucciones: 'sin cebolla' })
  })

  it('reconoce el mismo producto aunque cambien mayúsculas o espacios', () => {
    const renglones: ItemNuevoPedido[] = [{ nombre: '  TACOS ', precio: 18, cantidad: 1 }]
    expect(unirSeleccionConRenglones(renglones, [{ producto: tacos, cantidad: 1 }])).toHaveLength(1)
  })

  it('mezcla renglones existentes y nuevos conservando el orden', () => {
    const renglones: ItemNuevoPedido[] = [{ nombre: 'Tacos', precio: 18, cantidad: 1 }]
    const resultado = unirSeleccionConRenglones(renglones, [{ producto: agua, cantidad: 1 }, { producto: tacos, cantidad: 1 }])
    expect(resultado.map((r) => [r.nombre, r.cantidad])).toEqual([['Tacos', 2], ['Agua', 1]])
  })

  it('no modifica los renglones originales', () => {
    const renglones: ItemNuevoPedido[] = [{ nombre: 'Tacos', precio: 18, cantidad: 1 }]
    unirSeleccionConRenglones(renglones, [{ producto: tacos, cantidad: 4 }])
    expect(renglones[0].cantidad).toBe(1)
  })

  it('conserva propiedades extra de los renglones existentes (la clave de React)', () => {
    const renglones = [{ clave: 'k1', nombre: 'Tacos', precio: 18, cantidad: 1 }]
    const [renglon] = unirSeleccionConRenglones(renglones, [{ producto: tacos, cantidad: 1 }]) as typeof renglones
    expect(renglon.clave).toBe('k1')
  })

  it('ignora cantidades de 0 o negativas', () => {
    expect(unirSeleccionConRenglones([], [{ producto: tacos, cantidad: 0 }, { producto: agua, cantidad: -2 }])).toEqual([])
  })

  it('acepta el precio como texto (Postgres puede devolver numeric como string)', () => {
    const comoTexto = { ...tacos, precio: '18.50' as unknown as number }
    expect(unirSeleccionConRenglones([], [{ producto: comoTexto, cantidad: 1 }])[0].precio).toBe(18.5)
  })
})

describe('normalizarNombreProducto', () => {
  it('ignora mayúsculas y espacios en los extremos', () => {
    expect(normalizarNombreProducto('  Tacos Al Pastor ')).toBe('tacos al pastor')
  })
})

describe('productosParaSelector', () => {
  const categorias = [cat('1', 'Comida', '🌮'), cat('2', 'Bebidas', '🥤')]
  const productos = [
    prod('a', 'Tacos', 18, '1'), prod('b', 'Agua', 20, '2'), prod('c', 'Torta', 60, '1'),
    prod('d', 'Elote', 25, null), prod('e', 'Pozole', 80, '1', false), prod('f', 'Cerveza', 40, '2', false),
  ]
  const nombres = (cambios: Partial<{ busqueda: string; categoria: string }> = {}) =>
    productosParaSelector(productos, categorias, { busqueda: '', categoria: FILTRO_TODAS, ...cambios }).map((g) => [g.categoria?.nombre ?? 'Sin categoría', g.productos.map((p) => p.nombre)])

  it('solo muestra productos DISPONIBLES', () => {
    const todos = nombres().flatMap(([, p]) => p as string[])
    expect(todos).not.toContain('Pozole')
    expect(todos).not.toContain('Cerveza')
    expect(todos).toHaveLength(4)
  })

  it('agrupa por categoría (alfabético) con "Sin categoría" al final', () => {
    expect(nombres()).toEqual([['Bebidas', ['Agua']], ['Comida', ['Tacos', 'Torta']], ['Sin categoría', ['Elote']]])
  })

  it('filtra por una categoría', () => {
    expect(nombres({ categoria: '1' })).toEqual([['Comida', ['Tacos', 'Torta']]])
  })

  it('filtra por "Sin categoría"', () => {
    expect(nombres({ categoria: FILTRO_SIN_CATEGORIA })).toEqual([['Sin categoría', ['Elote']]])
  })

  it('busca por nombre en todas las categorías, sin importar mayúsculas', () => {
    expect(nombres({ busqueda: 'T' })).toEqual([['Comida', ['Tacos', 'Torta']], ['Sin categoría', ['Elote']]])
    expect(nombres({ busqueda: 'AGUA' })).toEqual([['Bebidas', ['Agua']]])
  })

  it('una búsqueda que no coincide devuelve lista vacía', () => {
    expect(nombres({ busqueda: 'zzz' })).toEqual([])
  })

  it('un producto no disponible no aparece aunque coincida con la búsqueda', () => {
    expect(nombres({ busqueda: 'pozole' })).toEqual([])
  })
})

describe('pestanasDelSelector', () => {
  const categorias = [cat('1', 'Comida'), cat('2', 'Bebidas'), cat('3', 'Postres')]

  it('solo incluye categorías con productos disponibles', () => {
    const productos = [prod('a', 'Tacos', 1, '1'), prod('b', 'Cerveza', 1, '2', false)]
    const { categorias: visibles } = pestanasDelSelector(productos, categorias)
    expect(visibles.map((c) => c.nombre)).toEqual(['Comida'])
  })

  it('indica si hay productos disponibles sin categoría', () => {
    expect(pestanasDelSelector([prod('a', 'Elote', 1, null)], categorias).haySinCategoria).toBe(true)
    expect(pestanasDelSelector([prod('a', 'Tacos', 1, '1')], categorias).haySinCategoria).toBe(false)
    expect(pestanasDelSelector([prod('a', 'Elote', 1, null, false)], categorias).haySinCategoria).toBe(false)
  })

  it('un producto con una categoría que ya no existe cuenta como "Sin categoría"', () => {
    expect(pestanasDelSelector([prod('a', 'Huérfano', 1, 'borrada')], categorias).haySinCategoria).toBe(true)
  })
})
