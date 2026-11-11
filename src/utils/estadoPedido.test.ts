import { describe, expect, it } from 'vitest'
import type { EstadoPedido } from '../types/pedido'
import { ESTADOS_FINALES, esEstadoFinal, motivoDeBloqueo, puedeCambiarEstado } from './estadoPedido'

const TODOS: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado']
const NO_FINALES: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo']

describe('puedeCambiarEstado (CC09: un pedido entregado no retrocede)', () => {
  it('un pedido entregado NO puede pasar a ningún otro estado', () => {
    for (const nuevo of TODOS.filter((estado) => estado !== 'entregado')) {
      expect(puedeCambiarEstado('entregado', nuevo), `entregado -> ${nuevo}`).toBe(false)
    }
  })

  it('un pedido cancelado tampoco cambia de estado', () => {
    for (const nuevo of TODOS.filter((estado) => estado !== 'cancelado')) {
      expect(puedeCambiarEstado('cancelado', nuevo), `cancelado -> ${nuevo}`).toBe(false)
    }
  })

  it('entre pendiente, en preparación y listo se puede ir y volver', () => {
    for (const actual of NO_FINALES) {
      for (const nuevo of NO_FINALES) expect(puedeCambiarEstado(actual, nuevo), `${actual} -> ${nuevo}`).toBe(true)
    }
  })

  it('desde un estado no final se puede avanzar hasta entregado', () => {
    for (const actual of NO_FINALES) expect(puedeCambiarEstado(actual, 'entregado'), `${actual} -> entregado`).toBe(true)
  })

  it('"cambiar" al mismo estado siempre se permite (no es un cambio)', () => {
    for (const estado of TODOS) expect(puedeCambiarEstado(estado, estado)).toBe(true)
  })

  it('las 25 combinaciones: solo las que salen de un estado final hacia otro estado están prohibidas', () => {
    const prohibidas = TODOS.flatMap((actual) => TODOS.filter((nuevo) => !puedeCambiarEstado(actual, nuevo)).map((nuevo) => `${actual}->${nuevo}`))
    expect(prohibidas).toHaveLength(8)
    expect(prohibidas.every((par) => par.startsWith('entregado->') || par.startsWith('cancelado->'))).toBe(true)
  })
})

describe('estados finales', () => {
  it('son entregado y cancelado', () => {
    expect(ESTADOS_FINALES).toEqual(['entregado', 'cancelado'])
    expect(NO_FINALES.some(esEstadoFinal)).toBe(false)
    expect(esEstadoFinal('entregado')).toBe(true)
    expect(esEstadoFinal('cancelado')).toBe(true)
  })

  it('solo los estados finales explican por qué están bloqueados', () => {
    expect(motivoDeBloqueo('entregado')).toContain('entregado')
    expect(motivoDeBloqueo('cancelado')).toContain('cancelado')
    for (const estado of NO_FINALES) expect(motivoDeBloqueo(estado)).toBeUndefined()
  })
})
