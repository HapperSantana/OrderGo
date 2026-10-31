import { describe, expect, it } from 'vitest'
import type { Categoria } from '../types/categoria'
import {
  EMOJIS_CATEGORIA,
  FILTRO_SIN_CATEGORIA,
  FILTRO_TODAS,
  agruparPorCategoria,
  buscarCategoriaDuplicada,
  contarProductosPorCategoria,
  esEmojiCategoriaValido,
  etiquetaCategoria,
  filtrarProductos,
  normalizarNombreCategoria,
  ordenarCategorias,
  validarNombreCategoria,
} from './categorias'

const cat = (id: string, nombre: string, emoji: string | null = null): Categoria => ({
  id,
  owner_id: 'u',
  nombre,
  emoji,
  created_at: '2026-10-01T00:00:00Z',
})
const prod = (nombre: string, categoria_id: string | null) => ({ nombre, categoria_id })

describe('normalizarNombreCategoria (espejo de lower(trim(nombre)) en la base de datos)', () => {
  it('ignora mayúsculas y espacios en los extremos', () => {
    expect(normalizarNombreCategoria('  Bebidas ')).toBe('bebidas')
    expect(normalizarNombreCategoria('BEBIDAS')).toBe('bebidas')
  })

  it('conserva los acentos y los espacios internos (son nombres distintos)', () => {
    expect(normalizarNombreCategoria('Café')).not.toBe(normalizarNombreCategoria('Cafe'))
    expect(normalizarNombreCategoria('Platos  fuertes')).toBe('platos  fuertes')
  })

  it('las mayúsculas acentuadas y la eñe se igualan', () => {
    expect(normalizarNombreCategoria('ÑOÑOS')).toBe('ñoños')
    expect(normalizarNombreCategoria('CAFÉ')).toBe(normalizarNombreCategoria('café'))
  })
})

describe('validarNombreCategoria', () => {
  it('acepta un nombre normal', () => {
    expect(validarNombreCategoria('Bebidas')).toBeNull()
  })

  it('rechaza vacío o solo espacios', () => {
    expect(validarNombreCategoria('')).toBe('Escribe el nombre de la categoría.')
    expect(validarNombreCategoria('    ')).toBe('Escribe el nombre de la categoría.')
  })

  it('acepta exactamente 40 caracteres y rechaza 41', () => {
    expect(validarNombreCategoria('x'.repeat(40))).toBeNull()
    expect(validarNombreCategoria('x'.repeat(41))).toMatch(/máximo 40/)
  })

  it('los espacios de los extremos no cuentan para el largo', () => {
    expect(validarNombreCategoria(`  ${'x'.repeat(40)}  `)).toBeNull()
  })
})

describe('buscarCategoriaDuplicada', () => {
  const categorias = [cat('1', 'Bebidas'), cat('2', 'Comida')]

  it('detecta un duplicado sin importar mayúsculas ni espacios', () => {
    expect(buscarCategoriaDuplicada(categorias, '  bebidas ')?.id).toBe('1')
    expect(buscarCategoriaDuplicada(categorias, 'COMIDA')?.id).toBe('2')
  })

  it('un nombre nuevo no es duplicado', () => {
    expect(buscarCategoriaDuplicada(categorias, 'Postres')).toBeUndefined()
  })

  it('al renombrar, la categoría no es duplicado de sí misma', () => {
    expect(buscarCategoriaDuplicada(categorias, 'bebidas', '1')).toBeUndefined()
  })

  it('al renombrar, sí choca con OTRA categoría', () => {
    expect(buscarCategoriaDuplicada(categorias, 'comida', '1')?.id).toBe('2')
  })

  it('"Café" y "Cafe" son categorías distintas (igual que en la base de datos)', () => {
    expect(buscarCategoriaDuplicada([cat('1', 'Café')], 'Cafe')).toBeUndefined()
  })
})

describe('emojis', () => {
  it('acepta null y los emojis de la lista', () => {
    expect(esEmojiCategoriaValido(null)).toBe(true)
    expect(esEmojiCategoriaValido('🌮')).toBe(true)
    expect(esEmojiCategoriaValido('🌶️')).toBe(true)
  })

  it('rechaza cualquier otro texto', () => {
    expect(esEmojiCategoriaValido('')).toBe(false)
    expect(esEmojiCategoriaValido('taco')).toBe(false)
    expect(esEmojiCategoriaValido('🚀')).toBe(false)
  })

  it('la lista no tiene repetidos y cada emoji cabe en el límite de la base de datos (16 caracteres)', () => {
    expect(new Set(EMOJIS_CATEGORIA).size).toBe(EMOJIS_CATEGORIA.length)
    for (const emoji of EMOJIS_CATEGORIA) expect([...emoji].length).toBeLessThanOrEqual(16)
  })
})

describe('etiquetaCategoria', () => {
  it('con emoji, sin emoji y sin categoría', () => {
    expect(etiquetaCategoria(cat('1', 'Bebidas', '🥤'))).toBe('🥤 Bebidas')
    expect(etiquetaCategoria(cat('1', 'Bebidas'))).toBe('Bebidas')
    expect(etiquetaCategoria(null)).toBe('Sin categoría')
    expect(etiquetaCategoria(undefined)).toBe('Sin categoría')
  })
})

describe('ordenarCategorias', () => {
  it('ordena alfabéticamente sin distinguir mayúsculas ni acentos, y no modifica la lista original', () => {
    const original = [cat('1', 'postres'), cat('2', 'Álcohol'), cat('3', 'Bebidas'), cat('4', 'Comida')]
    expect(ordenarCategorias(original).map((c) => c.nombre)).toEqual(['Álcohol', 'Bebidas', 'Comida', 'postres'])
    expect(original[0].nombre).toBe('postres')
  })
})

describe('contarProductosPorCategoria', () => {
  it('cuenta por categoría y cuenta aparte los "Sin categoría" (clave null)', () => {
    const conteo = contarProductosPorCategoria([prod('a', '1'), prod('b', '1'), prod('c', '2'), prod('d', null)])
    expect(conteo.get('1')).toBe(2)
    expect(conteo.get('2')).toBe(1)
    expect(conteo.get(null)).toBe(1)
    expect(conteo.get('3')).toBeUndefined()
  })
})

describe('filtrarProductos', () => {
  const productos = [prod('Tacos', '1'), prod('Agua', '2'), prod('Torta', null), prod('Taco de pollo', '1')]
  const nombres = (cambios: Partial<Parameters<typeof filtrarProductos>[1]> = {}) =>
    filtrarProductos(productos, { busqueda: '', categoria: FILTRO_TODAS, ...cambios }).map((p) => p.nombre)

  it('sin filtros muestra todo', () => {
    expect(nombres()).toEqual(['Tacos', 'Agua', 'Torta', 'Taco de pollo'])
  })

  it('filtra por una categoría', () => {
    expect(nombres({ categoria: '1' })).toEqual(['Tacos', 'Taco de pollo'])
  })

  it('"Sin categoría" muestra solo los que no tienen', () => {
    expect(nombres({ categoria: FILTRO_SIN_CATEGORIA })).toEqual(['Torta'])
  })

  it('combina categoría y búsqueda, sin importar mayúsculas', () => {
    expect(nombres({ categoria: '1', busqueda: 'POLLO' })).toEqual(['Taco de pollo'])
    expect(nombres({ categoria: '2', busqueda: 'taco' })).toEqual([])
  })

  it('una categoría sin productos da lista vacía', () => {
    expect(nombres({ categoria: '99' })).toEqual([])
  })
})

describe('agruparPorCategoria', () => {
  const categorias = [cat('1', 'Comida', '🌮'), cat('2', 'Bebidas', '🥤'), cat('3', 'Postres')]

  it('agrupa, ordena las categorías alfabéticamente y pone "Sin categoría" al final', () => {
    const grupos = agruparPorCategoria([prod('Tacos', '1'), prod('Agua', '2'), prod('Torta', null), prod('Flan', '3')], categorias)
    expect(grupos.map((g) => g.categoria?.nombre ?? 'Sin categoría')).toEqual(['Bebidas', 'Comida', 'Postres', 'Sin categoría'])
  })

  it('ordena los productos de cada grupo por nombre', () => {
    const grupos = agruparPorCategoria([prod('Quesadilla', '1'), prod('Alambre', '1'), prod('Tacos', '1')], categorias)
    expect(grupos[0].productos.map((p) => p.nombre)).toEqual(['Alambre', 'Quesadilla', 'Tacos'])
  })

  it('omite los grupos vacíos (categorías sin productos y "Sin categoría" si no hay sueltos)', () => {
    const grupos = agruparPorCategoria([prod('Tacos', '1')], categorias)
    expect(grupos).toHaveLength(1)
    expect(grupos[0].categoria?.id).toBe('1')
  })

  it('un producto que apunta a una categoría que ya no existe va a "Sin categoría"', () => {
    const grupos = agruparPorCategoria([prod('Huérfano', 'categoria-borrada')], categorias)
    expect(grupos).toHaveLength(1)
    expect(grupos[0].categoria).toBeNull()
  })

  it('sin productos no hay grupos', () => {
    expect(agruparPorCategoria([], categorias)).toEqual([])
  })

  it('no repite productos entre grupos', () => {
    const productos = [prod('A', '1'), prod('B', '2'), prod('C', null), prod('D', 'x')]
    const total = agruparPorCategoria(productos, categorias).reduce((n, g) => n + g.productos.length, 0)
    expect(total).toBe(productos.length)
  })
})
