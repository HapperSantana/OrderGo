import { describe, expect, it } from 'vitest'
import type { EstadoPedido, Pedido } from '../types/pedido'
import { crearFiltrosIniciales, filtrarPedidos, sonFiltrosIniciales } from './filtrosPedidos'

// CC08 (filtro "Sin entregar") y CC10 (los filtros iniciales de un día cualquiera).
const pedido = (id: string, estado: EstadoPedido, dia = 9): Pedido =>
  ({ id, estado, estado_pago: 'pendiente', metodo_pago: null, total: 10, created_at: new Date(2026, 10, dia, 12).toISOString(), cliente: { nombre: 'Ana', telefono: '1' } }) as unknown as Pedido

describe('filtro de estado "Sin entregar" (CC08)', () => {
  const todos = [pedido('a', 'pendiente'), pedido('b', 'en_preparacion'), pedido('c', 'listo'), pedido('d', 'entregado'), pedido('e', 'cancelado')]
  const sinFechas = { ...crearFiltrosIniciales('2026-11-09'), desde: '', hasta: '' }

  it('deja pendiente, en preparación y listo; quita entregado y cancelado', () => {
    const ids = filtrarPedidos(todos, { ...sinFechas, estado: 'sin_entregar' }).map((p) => p.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('"todos" sigue mostrando todos y un estado concreto sigue funcionando', () => {
    expect(filtrarPedidos(todos, { ...sinFechas, estado: 'todos' })).toHaveLength(5)
    expect(filtrarPedidos(todos, { ...sinFechas, estado: 'entregado' }).map((p) => p.id)).toEqual(['d'])
  })

  it('sin fechas muestra los sin entregar de TODOS los días (hoy y anteriores)', () => {
    const mezcla = [pedido('hoy', 'pendiente', 9), pedido('ayer', 'listo', 8), pedido('hace-una-semana', 'en_preparacion', 2), pedido('viejo-entregado', 'entregado', 2)]
    expect(filtrarPedidos(mezcla, { ...sinFechas, estado: 'sin_entregar' }).map((p) => p.id)).toEqual(['hoy', 'ayer', 'hace-una-semana'])
  })

  it('se combina con los demás filtros', () => {
    const conPago = [{ ...pedido('x', 'listo'), estado_pago: 'pagado' }, pedido('y', 'listo')] as Pedido[]
    expect(filtrarPedidos(conPago, { ...sinFechas, estado: 'sin_entregar', pago: 'pagado' }).map((p) => p.id)).toEqual(['x'])
  })
})

describe('filtros iniciales de un día cualquiera (CC10)', () => {
  it('crearFiltrosIniciales(día) fija desde y hasta en ese día', () => {
    const f = crearFiltrosIniciales('2026-11-10')
    expect([f.desde, f.hasta, f.estado, f.cliente]).toEqual(['2026-11-10', '2026-11-10', 'todos', ''])
  })

  it('sonFiltrosIniciales(filtros, día) compara contra ese día', () => {
    const deAyer = crearFiltrosIniciales('2026-11-08')
    expect(sonFiltrosIniciales(deAyer, '2026-11-08')).toBe(true)
    expect(sonFiltrosIniciales(deAyer, '2026-11-09')).toBe(false)
  })

  it('los filtros que la persona cambió NO se consideran "la vista de hoy"', () => {
    const base = crearFiltrosIniciales('2026-11-08')
    expect(sonFiltrosIniciales({ ...base, estado: 'listo' }, '2026-11-08')).toBe(false)
    expect(sonFiltrosIniciales({ ...base, estado: 'sin_entregar' }, '2026-11-08')).toBe(false)
    expect(sonFiltrosIniciales({ ...base, desde: '2026-11-01' }, '2026-11-08')).toBe(false)
    expect(sonFiltrosIniciales({ ...base, cliente: 'Ana' }, '2026-11-08')).toBe(false)
    expect(sonFiltrosIniciales({ ...base, pago: 'pagado' }, '2026-11-08')).toBe(false)
  })

  it('sin pasar el día, usa el de hoy (comportamiento de siempre)', () => {
    expect(sonFiltrosIniciales(crearFiltrosIniciales())).toBe(true)
  })
})
