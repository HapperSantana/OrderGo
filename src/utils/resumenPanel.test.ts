import { describe, expect, it } from 'vitest'
import { calcularResumen, porcentaje, rangoDelPeriodo } from './resumenPanel'
import type { PedidoParaResumen } from './resumenPanel'

// Fecha local con hora, para no depender de la zona horaria de quien corre la prueba.
const local = (anio: number, mes: number, dia: number, h = 0, m = 0, s = 0, ms = 0) =>
  new Date(anio, mes - 1, dia, h, m, s, ms)

describe('rangoDelPeriodo', () => {
  describe('hoy', () => {
    it('va de las 00:00:00 a las 23:59:59.999 del día local', () => {
      const { desde, hasta } = rangoDelPeriodo('hoy', local(2026, 10, 16, 15, 30))
      expect(desde).toEqual(local(2026, 10, 16, 0, 0, 0, 0))
      expect(hasta).toEqual(local(2026, 10, 16, 23, 59, 59, 999))
    })
  })

  describe('semana (lunes a domingo)', () => {
    // 16-oct-2026 es viernes: la semana va del lunes 12 al domingo 18.
    it('un viernes empieza el lunes de esa semana', () => {
      const { desde, hasta } = rangoDelPeriodo('semana', local(2026, 10, 16, 12))
      expect(desde).toEqual(local(2026, 10, 12, 0, 0, 0, 0))
      expect(hasta).toEqual(local(2026, 10, 18, 23, 59, 59, 999))
    })

    it('el lunes a primera hora ya es el inicio de la semana', () => {
      const { desde } = rangoDelPeriodo('semana', local(2026, 10, 12, 0, 0, 1))
      expect(desde).toEqual(local(2026, 10, 12, 0, 0, 0, 0))
    })

    it('el domingo todavía pertenece a la semana que empezó el lunes anterior', () => {
      const { desde, hasta } = rangoDelPeriodo('semana', local(2026, 10, 18, 23, 0))
      expect(desde).toEqual(local(2026, 10, 12, 0, 0, 0, 0))
      expect(hasta).toEqual(local(2026, 10, 18, 23, 59, 59, 999))
    })

    it('el lunes siguiente abre una semana nueva', () => {
      const { desde } = rangoDelPeriodo('semana', local(2026, 10, 19, 8))
      expect(desde).toEqual(local(2026, 10, 19, 0, 0, 0, 0))
    })

    it('una semana que cruza el cambio de año empieza en diciembre', () => {
      // 1-ene-2027 es viernes: el lunes de esa semana fue el 28-dic-2026.
      const { desde, hasta } = rangoDelPeriodo('semana', local(2027, 1, 1, 10))
      expect(desde).toEqual(local(2026, 12, 28, 0, 0, 0, 0))
      expect(hasta).toEqual(local(2027, 1, 3, 23, 59, 59, 999))
    })
  })

  describe('mes', () => {
    it('va del día 1 al último día del mes', () => {
      const { desde, hasta } = rangoDelPeriodo('mes', local(2026, 10, 16, 12))
      expect(desde).toEqual(local(2026, 10, 1, 0, 0, 0, 0))
      expect(hasta).toEqual(local(2026, 10, 31, 23, 59, 59, 999))
    })

    it('respeta los meses cortos y los años bisiestos', () => {
      expect(rangoDelPeriodo('mes', local(2027, 2, 10)).hasta).toEqual(local(2027, 2, 28, 23, 59, 59, 999))
      expect(rangoDelPeriodo('mes', local(2028, 2, 10)).hasta).toEqual(local(2028, 2, 29, 23, 59, 59, 999))
    })

    it('diciembre termina el 31 sin saltar de año', () => {
      expect(rangoDelPeriodo('mes', local(2026, 12, 15)).hasta).toEqual(local(2026, 12, 31, 23, 59, 59, 999))
    })
  })
})

const pedido = (
  estado: PedidoParaResumen['estado'],
  pago: PedidoParaResumen['estado_pago'],
  metodo: PedidoParaResumen['metodo_pago'],
  total: number,
): PedidoParaResumen => ({ estado, estado_pago: pago, metodo_pago: metodo, total })

describe('calcularResumen', () => {
  it('sin pedidos todo es cero', () => {
    const r = calcularResumen([])
    expect(r.pedidos).toBe(0)
    expect(r.ingresos).toBe(0)
    expect(r.sinEntregar).toBe(0)
    expect(r.canceladosPagados).toEqual({ cantidad: 0, monto: 0 })
  })

  it('cuenta pedidos, sin entregar y entregados sin contar los cancelados', () => {
    const r = calcularResumen([
      pedido('pendiente', 'pendiente', null, 50),
      pedido('en_preparacion', 'pendiente', null, 50),
      pedido('listo', 'pagado', 'efectivo', 50),
      pedido('entregado', 'pagado', 'tarjeta', 50),
      pedido('cancelado', 'pendiente', null, 50),
    ])
    expect(r.pedidos).toBe(4)
    expect(r.sinEntregar).toBe(3)
    expect(r.entregados).toBe(1)
    expect(r.cancelados).toBe(1)
    expect(r.porEstado).toEqual({ pendiente: 1, en_preparacion: 1, listo: 1, entregado: 1, cancelado: 1 })
  })

  describe('ingresos (regla: pedido pagado y no cancelado)', () => {
    it('suma solo los pedidos pagados', () => {
      const r = calcularResumen([
        pedido('entregado', 'pagado', 'efectivo', 100),
        pedido('listo', 'pendiente', null, 80),
      ])
      expect(r.ingresos).toBe(100)
    })

    it('un pedido pagado todavía sin entregar sí cuenta como ingreso', () => {
      expect(calcularResumen([pedido('listo', 'pagado', 'tarjeta', 70)]).ingresos).toBe(70)
    })

    it('un pedido cancelado que ya estaba pagado NO suma a los ingresos', () => {
      const r = calcularResumen([
        pedido('entregado', 'pagado', 'efectivo', 100),
        pedido('cancelado', 'pagado', 'tarjeta', 60),
      ])
      expect(r.ingresos).toBe(100)
      expect(r.ingresosPorMetodo.tarjeta).toBe(0)
    })

    it('los cancelados pagados se informan aparte, con cantidad y monto', () => {
      const r = calcularResumen([
        pedido('cancelado', 'pagado', 'tarjeta', 60),
        pedido('cancelado', 'pagado', 'efectivo', 40.5),
        pedido('cancelado', 'pendiente', null, 99),
      ])
      expect(r.canceladosPagados).toEqual({ cantidad: 2, monto: 100.5 })
    })
  })

  describe('ingresos por método de pago', () => {
    it('reparte los ingresos por método', () => {
      const r = calcularResumen([
        pedido('entregado', 'pagado', 'efectivo', 100),
        pedido('entregado', 'pagado', 'efectivo', 50),
        pedido('entregado', 'pagado', 'tarjeta', 200),
        pedido('entregado', 'pagado', 'transferencia', 30),
        pedido('entregado', 'pagado', 'otro', 10),
      ])
      expect(r.ingresosPorMetodo).toEqual({ efectivo: 150, tarjeta: 200, transferencia: 30, otro: 10 })
      expect(r.ingresos).toBe(390)
    })

    it('la suma por método (más sin método) siempre coincide con los ingresos', () => {
      const r = calcularResumen([
        pedido('entregado', 'pagado', 'efectivo', 19.99),
        pedido('entregado', 'pagado', 'tarjeta', 0.1),
        pedido('entregado', 'pagado', 'otro', 0.2),
        pedido('entregado', 'pagado', null, 5.35),
      ])
      const m = r.ingresosPorMetodo
      const suma = Math.round((m.efectivo + m.tarjeta + m.transferencia + m.otro + r.ingresosSinMetodo) * 100) / 100
      expect(suma).toBe(r.ingresos)
    })

    it('un pedido antiguo pagado sin método se cuenta aparte pero sí es ingreso', () => {
      const r = calcularResumen([pedido('entregado', 'pagado', null, 75)])
      expect(r.ingresos).toBe(75)
      expect(r.ingresosSinMetodo).toBe(75)
    })
  })

  describe('dinero sin errores de coma flotante', () => {
    it('0.1 + 0.2 da exactamente 0.3', () => {
      const r = calcularResumen([
        pedido('entregado', 'pagado', 'efectivo', 0.1),
        pedido('entregado', 'pagado', 'efectivo', 0.2),
      ])
      expect(r.ingresos).toBe(0.3)
    })

    it('muchos importes con centavos suman exacto', () => {
      const pedidos = Array.from({ length: 100 }, () => pedido('entregado', 'pagado', 'efectivo', 19.99))
      expect(calcularResumen(pedidos).ingresos).toBe(1999)
    })

    it('acepta el total como texto (Postgres puede devolver numeric como string)', () => {
      const comoTexto = { ...pedido('entregado', 'pagado', 'efectivo', 0), total: '37.50' as unknown as number }
      expect(calcularResumen([comoTexto]).ingresos).toBe(37.5)
    })
  })
})

describe('porcentaje', () => {
  it('calcula el porcentaje entero', () => {
    expect(porcentaje(1, 4)).toBe(25)
    expect(porcentaje(2, 3)).toBe(67)
  })

  it('con total cero devuelve 0 en lugar de dividir entre cero', () => {
    expect(porcentaje(0, 0)).toBe(0)
    expect(porcentaje(5, 0)).toBe(0)
  })
})