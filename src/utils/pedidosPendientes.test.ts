import { describe, expect, it } from 'vitest'
import type { EstadoPedido } from '../types/pedido'
import { describirDia, esSinEntregarDeDiaAnterior, resumirPendientesAnteriores, tituloAvisoPendientes } from './pedidosPendientes'

// Fechas en hora LOCAL (valen en cualquier zona horaria).
const creado = (anio: number, mes: number, dia: number, h = 12, m = 0) => new Date(anio, mes - 1, dia, h, m).toISOString()
const pedido = (estado: EstadoPedido, created_at: string) => ({ estado, created_at })
const HOY = '2026-11-09'

describe('esSinEntregarDeDiaAnterior (CC08)', () => {
  it('cuenta los pedidos en proceso de un día anterior', () => {
    for (const estado of ['pendiente', 'en_preparacion', 'listo'] as EstadoPedido[]) {
      expect(esSinEntregarDeDiaAnterior(pedido(estado, creado(2026, 11, 8)), HOY), estado).toBe(true)
    }
  })

  it('NO cuenta los entregados ni los cancelados, por antiguos que sean', () => {
    expect(esSinEntregarDeDiaAnterior(pedido('entregado', creado(2026, 11, 1)), HOY)).toBe(false)
    expect(esSinEntregarDeDiaAnterior(pedido('cancelado', creado(2026, 11, 1)), HOY)).toBe(false)
  })

  it('NO cuenta los de hoy, ni siquiera el de las 00:00 ni el de las 23:59', () => {
    expect(esSinEntregarDeDiaAnterior(pedido('pendiente', creado(2026, 11, 9, 0, 0)), HOY)).toBe(false)
    expect(esSinEntregarDeDiaAnterior(pedido('pendiente', creado(2026, 11, 9, 23, 59)), HOY)).toBe(false)
  })

  it('cuenta el de ayer a las 23:59 (el límite del día es la medianoche LOCAL)', () => {
    expect(esSinEntregarDeDiaAnterior(pedido('listo', creado(2026, 11, 8, 23, 59)), HOY)).toBe(true)
    expect(esSinEntregarDeDiaAnterior(pedido('listo', creado(2026, 11, 8, 0, 0)), HOY)).toBe(true)
  })

  it('un pedido de un día FUTURO (reloj desajustado) no cuenta', () => {
    expect(esSinEntregarDeDiaAnterior(pedido('pendiente', creado(2026, 11, 10)), HOY)).toBe(false)
  })
})

describe('resumirPendientesAnteriores', () => {
  it('sin pedidos: cero y sin fecha', () => {
    expect(resumirPendientesAnteriores([], HOY)).toEqual({ cantidad: 0, masAntiguo: null })
  })

  it('cuenta solo los pendientes de días anteriores y reporta el más antiguo', () => {
    const pedidos = [
      pedido('pendiente', creado(2026, 11, 9)), // hoy: no
      pedido('listo', creado(2026, 11, 8)), // sí
      pedido('en_preparacion', creado(2026, 11, 5)), // sí (el más antiguo)
      pedido('entregado', creado(2026, 11, 2)), // no
      pedido('cancelado', creado(2026, 11, 1)), // no
      pedido('pendiente', creado(2026, 11, 7)), // sí
    ]
    expect(resumirPendientesAnteriores(pedidos, HOY)).toEqual({ cantidad: 3, masAntiguo: '2026-11-05' })
  })

  it('el más antiguo no depende del orden de la lista', () => {
    const a = [pedido('pendiente', creado(2026, 11, 3)), pedido('pendiente', creado(2026, 11, 8))]
    expect(resumirPendientesAnteriores(a, HOY).masAntiguo).toBe('2026-11-03')
    expect(resumirPendientesAnteriores([...a].reverse(), HOY).masAntiguo).toBe('2026-11-03')
  })

  it('al entregar un pedido deja de contar', () => {
    const antes = [pedido('listo', creado(2026, 11, 8)), pedido('pendiente', creado(2026, 11, 7))]
    const despues = [pedido('entregado', creado(2026, 11, 8)), pedido('pendiente', creado(2026, 11, 7))]
    expect(resumirPendientesAnteriores(antes, HOY).cantidad).toBe(2)
    expect(resumirPendientesAnteriores(despues, HOY).cantidad).toBe(1)
  })

  it('al cambiar el día, los pedidos pendientes de "hoy" pasan a ser de un día anterior', () => {
    const pedidos = [pedido('pendiente', creado(2026, 11, 9, 20))]
    expect(resumirPendientesAnteriores(pedidos, '2026-11-09').cantidad).toBe(0)
    expect(resumirPendientesAnteriores(pedidos, '2026-11-10').cantidad).toBe(1)
  })
})

describe('textos del aviso', () => {
  it('singular y plural', () => {
    expect(tituloAvisoPendientes(1)).toBe('Tienes 1 pedido de un día anterior sin entregar')
    expect(tituloAvisoPendientes(2)).toBe('Tienes 2 pedidos de días anteriores sin entregar')
    expect(tituloAvisoPendientes(12)).toBe('Tienes 12 pedidos de días anteriores sin entregar')
  })

  it('describe el día en español, sin correrse por la zona horaria', () => {
    expect(describirDia('2026-11-07')).toBe('7 de noviembre')
    expect(describirDia('2026-01-01')).toBe('1 de enero')
    expect(describirDia('2026-12-31')).toBe('31 de diciembre')
  })
})
