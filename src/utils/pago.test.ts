import { describe, expect, it } from 'vitest'
import type { MetodoPago } from '../types/pedido'
import { cambiosDePago, valorDePago } from './pago'

describe('cambiosDePago (CC07: método de pago obligatorio)', () => {
  it.each<MetodoPago>(['efectivo', 'tarjeta', 'transferencia', 'otro'])(
    'elegir "%s" marca el pedido como pagado con ese método',
    (metodo) => {
      expect(cambiosDePago(metodo)).toEqual({ estado_pago: 'pagado', metodo_pago: metodo })
    },
  )

  it('elegir "pendiente" limpia el método de pago', () => {
    expect(cambiosDePago('pendiente')).toEqual({ estado_pago: 'pendiente', metodo_pago: null })
  })

  it('nunca produce un pedido pagado sin método', () => {
    const valores = ['pendiente', 'efectivo', 'tarjeta', 'transferencia', 'otro'] as const
    for (const valor of valores) {
      const { estado_pago, metodo_pago } = cambiosDePago(valor)
      expect(estado_pago === 'pagado' && metodo_pago === null).toBe(false)
    }
  })
})

describe('valorDePago', () => {
  it('un pedido con pago pendiente muestra "pendiente"', () => {
    expect(valorDePago({ estado_pago: 'pendiente', metodo_pago: null })).toBe('pendiente')
  })

  it('un pedido pagado muestra su método', () => {
    expect(valorDePago({ estado_pago: 'pagado', metodo_pago: 'tarjeta' })).toBe('tarjeta')
  })

  it('un pedido antiguo pagado sin método se señala como "sin_metodo"', () => {
    expect(valorDePago({ estado_pago: 'pagado', metodo_pago: null })).toBe('sin_metodo')
  })

  it('es consistente con cambiosDePago (ida y vuelta)', () => {
    for (const valor of ['pendiente', 'efectivo', 'tarjeta', 'transferencia', 'otro'] as const) {
      expect(valorDePago(cambiosDePago(valor))).toBe(valor)
    }
  })
})