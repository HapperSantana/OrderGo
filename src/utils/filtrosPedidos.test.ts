import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pedido } from '../types/pedido'
import { crearFiltrosIniciales, fechaHoy, filtrarPedidos, sonFiltrosIniciales } from './filtrosPedidos'
import type { FiltrosPedidos } from './filtrosPedidos'

// Pedido mínimo para probar: solo importan los campos que usan los filtros.
function pedido(
  id: string,
  estado: Pedido['estado'],
  pago: Pedido['estado_pago'],
  metodo: Pedido['metodo_pago'],
  fecha: Date,
  nombre = 'Cliente',
  telefono = '33 0000 0000',
): Pedido {
  return {
    id,
    owner_id: 'u',
    cliente_id: 'c',
    estado,
    estado_pago: pago,
    metodo_pago: metodo,
    notas: null,
    total: 50,
    created_at: fecha.toISOString(),
    cliente: { id: 'c', nombre, telefono },
  }
}

// Las pruebas de zona horaria cambian la variable TZ del proceso de Node. Se
// accede a ella sin tipos de Node para no tocar la configuración de TypeScript.
const entorno = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env
const TZ_ORIGINAL = entorno.TZ

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 16, 12, 0, 0)) // 16-oct-2026, mediodía (hora local)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fechaHoy y los filtros iniciales (CC03)', () => {
  afterAll(() => {
    if (TZ_ORIGINAL === undefined) delete entorno.TZ
    else entorno.TZ = TZ_ORIGINAL
  })

  it('devuelve la fecha local con formato AAAA-MM-DD', () => {
    expect(fechaHoy()).toBe('2026-10-16')
  })

  it.each([
    // [zona horaria, instante, fecha local esperada]
    ['America/Mexico_City', '2026-10-16T05:30:00Z', '2026-10-15'], // 11:30 pm del 15: en UTC ya es 16
    ['America/Mexico_City', '2026-10-16T06:30:00Z', '2026-10-16'], // pasada la medianoche local
    ['UTC', '2026-10-16T05:30:00Z', '2026-10-16'],
    ['Asia/Tokyo', '2026-10-15T20:00:00Z', '2026-10-16'], // 5:00 am del 16 en Tokio
  ])('en %s, a las %s hoy es %s', (zona, instante, esperado) => {
    entorno.TZ = zona
    vi.setSystemTime(new Date(instante))
    expect(fechaHoy()).toBe(esperado)
  })

  it('arranca mostrando solo hoy, sin ningún otro filtro', () => {
    const iniciales = crearFiltrosIniciales()
    expect(iniciales).toEqual({
      estado: 'todos',
      pago: 'todos',
      metodo: 'todos',
      desde: '2026-10-16',
      hasta: '2026-10-16',
      cliente: '',
    })
    expect(sonFiltrosIniciales(iniciales)).toBe(true)
  })

  it('espacios en el filtro de cliente no cuentan como filtro', () => {
    expect(sonFiltrosIniciales({ ...crearFiltrosIniciales(), cliente: '   ' })).toBe(true)
  })

  it('cambiar cualquier filtro deja de ser la vista inicial', () => {
    expect(sonFiltrosIniciales({ ...crearFiltrosIniciales(), pago: 'pagado' })).toBe(false)
    expect(sonFiltrosIniciales({ ...crearFiltrosIniciales(), desde: '' })).toBe(false)
  })

  it('pasada la medianoche, los filtros de ayer ya no son los iniciales', () => {
    const deAyer = crearFiltrosIniciales()
    vi.setSystemTime(new Date(2026, 9, 17, 0, 5, 0))
    expect(sonFiltrosIniciales(deAyer)).toBe(false)
  })
})

describe('filtrarPedidos', () => {
  const hoy = new Date(2026, 9, 16, 12, 0, 0)
  const ayer = new Date(2026, 9, 15, 12, 0, 0)

  const pedidos = [
    pedido('a', 'pendiente', 'pendiente', null, hoy, 'María López', '33 1111 2222'),
    pedido('b', 'listo', 'pagado', 'efectivo', hoy, 'Juan Pérez', '33 3333 4444'),
    pedido('c', 'entregado', 'pagado', 'tarjeta', hoy, 'maría Gómez', '55 5555 6666'),
    pedido('d', 'entregado', 'pagado', 'transferencia', hoy),
    pedido('e', 'cancelado', 'pagado', 'otro', hoy),
    pedido('f', 'entregado', 'pagado', 'efectivo', ayer),
  ]

  // Filtros de hoy + los cambios que se quieran probar. "sinFechas" abre todos los días.
  const ids = (cambios: Partial<FiltrosPedidos> = {}) =>
    filtrarPedidos(pedidos, { ...crearFiltrosIniciales(), ...cambios })
      .map((p) => p.id)
      .join('')
  const sinFechas = { desde: '', hasta: '' }

  it('por defecto solo muestra los pedidos de hoy', () => {
    expect(ids()).toBe('abcde')
  })

  it('sin fechas muestra todos los días', () => {
    expect(ids(sinFechas)).toBe('abcdef')
  })

  it('filtra por estado', () => {
    expect(ids({ estado: 'entregado' })).toBe('cd')
    expect(ids({ estado: 'cancelado' })).toBe('e')
  })

  it('filtra por pago', () => {
    expect(ids({ pago: 'pagado' })).toBe('bcde')
    expect(ids({ pago: 'pendiente' })).toBe('a')
  })

  it('filtra por método de pago', () => {
    expect(ids({ metodo: 'efectivo' })).toBe('b')
    expect(ids({ metodo: 'tarjeta' })).toBe('c')
    expect(ids({ metodo: 'transferencia' })).toBe('d')
    expect(ids({ metodo: 'otro' })).toBe('e')
  })

  it('un método de pago en varios días incluye los de ayer', () => {
    expect(ids({ metodo: 'efectivo', ...sinFechas })).toBe('bf')
  })

  it('pago pendiente combinado con un método no da resultados', () => {
    expect(ids({ pago: 'pendiente', metodo: 'efectivo' })).toBe('')
  })

  it('busca por nombre sin importar mayúsculas ni acentos escritos en mayúscula', () => {
    expect(ids({ cliente: 'MARÍA' })).toBe('ac')
  })

  it('busca por teléfono', () => {
    expect(ids({ cliente: '3333' })).toBe('b')
  })

  it('ignora los espacios alrededor del texto buscado', () => {
    expect(ids({ cliente: '  juan  ' })).toBe('b')
  })

  it('combina estado + pago + método', () => {
    expect(ids({ estado: 'entregado', pago: 'pagado', metodo: 'tarjeta' })).toBe('c')
  })

  it('un cliente inexistente no da resultados', () => {
    expect(ids({ cliente: 'zzz' })).toBe('')
  })

  describe('límites de fecha (inclusivos)', () => {
    const borde = [
      pedido('i', 'pendiente', 'pendiente', null, new Date(2026, 9, 5, 0, 0, 0)), // inicio del día 5
      pedido('j', 'pendiente', 'pendiente', null, new Date(2026, 9, 5, 23, 59, 59)), // fin del día 5
      pedido('k', 'pendiente', 'pendiente', null, new Date(2026, 9, 6, 12, 0, 0)),
    ]
    const dia = (desde: string, hasta: string) =>
      filtrarPedidos(borde, { ...crearFiltrosIniciales(), desde, hasta })
        .map((p) => p.id)
        .join('')

    it('un solo día incluye de las 00:00 a las 23:59', () => {
      expect(dia('2026-10-05', '2026-10-05')).toBe('ij')
    })

    it('"desde" es inclusivo', () => {
      expect(dia('2026-10-06', '')).toBe('k')
    })

    it('"hasta" incluye todo el día indicado', () => {
      expect(dia('', '2026-10-05')).toBe('ij')
    })

    it('una fecha futura no da resultados', () => {
      expect(dia('2026-10-09', '')).toBe('')
    })
  })
})