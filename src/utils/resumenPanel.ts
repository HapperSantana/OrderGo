import type { EstadoPedido, MetodoPago, Pedido } from '../types/pedido'

// Periodo que resume el panel principal (HU09). Arranca en "hoy".
export type Periodo = 'hoy' | 'semana' | 'mes'

export const ETIQUETAS_PERIODO: Record<Periodo, string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
}

export interface RangoPeriodo {
  desde: Date
  hasta: Date
}

// Rango del periodo en la zona horaria LOCAL del usuario: el corte del día es
// la medianoche local. La semana va de lunes a domingo y el mes es el mes
// calendario. Los límites son inclusivos (el "hasta" es el último milisegundo).
export function rangoDelPeriodo(periodo: Periodo, ahora: Date = new Date()): RangoPeriodo {
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth()
  const dia = ahora.getDate()

  if (periodo === 'hoy') {
    return { desde: new Date(anio, mes, dia, 0, 0, 0, 0), hasta: new Date(anio, mes, dia, 23, 59, 59, 999) }
  }

  if (periodo === 'semana') {
    // getDay(): 0 = domingo ... 6 = sábado. Días transcurridos desde el lunes:
    const desdeElLunes = (ahora.getDay() + 6) % 7
    return {
      desde: new Date(anio, mes, dia - desdeElLunes, 0, 0, 0, 0),
      hasta: new Date(anio, mes, dia - desdeElLunes + 6, 23, 59, 59, 999),
    }
  }

  // El día 0 del mes siguiente es el último día de este mes.
  return { desde: new Date(anio, mes, 1, 0, 0, 0, 0), hasta: new Date(anio, mes + 1, 0, 23, 59, 59, 999) }
}

// Lo único que necesita el panel de cada pedido.
export type PedidoParaResumen = Pick<Pedido, 'estado' | 'estado_pago' | 'metodo_pago' | 'total'>

export interface ResumenPanel {
  // Pedidos del periodo sin contar los cancelados.
  pedidos: number
  // Pendientes, en preparación o listos: todavía no se entregan.
  sinEntregar: number
  entregados: number
  cancelados: number
  // Suma de los pedidos pagados que NO están cancelados.
  ingresos: number
  porEstado: Record<EstadoPedido, number>
  ingresosPorMetodo: Record<MetodoPago, number>
  // Pedidos antiguos pagados sin método (de antes de que fuera obligatorio).
  ingresosSinMetodo: number
  // Pedidos cancelados que ya estaban pagados: no suman a los ingresos, pero se
  // muestran aparte para que se revise si hay que devolver el dinero.
  canceladosPagados: { cantidad: number; monto: number }
}

const centavos = (importe: number) => Math.round(Number(importe) * 100)

// Reglas de negocio acordadas (retrospectiva del Sprint 4):
//  1. Un ingreso es un pedido pagado y NO cancelado.
//  2. Un pedido cancelado que ya estaba pagado no suma; se informa aparte.
// Los importes se suman en centavos para evitar errores de coma flotante
// (por ejemplo 0.1 + 0.2 = 0.30000000000000004 en JavaScript).
export function calcularResumen(pedidos: PedidoParaResumen[]): ResumenPanel {
  const porEstado: Record<EstadoPedido, number> = {
    pendiente: 0,
    en_preparacion: 0,
    listo: 0,
    entregado: 0,
    cancelado: 0,
  }
  const metodos: Record<MetodoPago, number> = { efectivo: 0, tarjeta: 0, transferencia: 0, otro: 0 }
  let ingresos = 0
  let sinMetodo = 0
  let canceladosPagadosCantidad = 0
  let canceladosPagadosMonto = 0

  for (const pedido of pedidos) {
    porEstado[pedido.estado] += 1
    const pagado = pedido.estado_pago === 'pagado'

    if (pedido.estado === 'cancelado') {
      if (pagado) {
        canceladosPagadosCantidad += 1
        canceladosPagadosMonto += centavos(pedido.total)
      }
      continue
    }

    if (pagado) {
      const importe = centavos(pedido.total)
      ingresos += importe
      if (pedido.metodo_pago) metodos[pedido.metodo_pago] += importe
      else sinMetodo += importe
    }
  }

  return {
    pedidos: pedidos.length - porEstado.cancelado,
    sinEntregar: porEstado.pendiente + porEstado.en_preparacion + porEstado.listo,
    entregados: porEstado.entregado,
    cancelados: porEstado.cancelado,
    ingresos: ingresos / 100,
    porEstado,
    ingresosPorMetodo: {
      efectivo: metodos.efectivo / 100,
      tarjeta: metodos.tarjeta / 100,
      transferencia: metodos.transferencia / 100,
      otro: metodos.otro / 100,
    },
    ingresosSinMetodo: sinMetodo / 100,
    canceladosPagados: { cantidad: canceladosPagadosCantidad, monto: canceladosPagadosMonto / 100 },
  }
}

// Porcentaje entero de `parte` sobre `total` (0 si no hay total).
export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((parte / total) * 100)
}