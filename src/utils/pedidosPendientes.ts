import { ESTADOS_SIN_ENTREGAR } from '../types/pedido'
import type { Pedido } from '../types/pedido'
import { VISTA_SIN_ENTREGAR } from './filtrosPedidos'
import { fechaLocalISO } from './medianoche'

// CC08: pedidos que quedaron sin entregar en días anteriores. La lista de hoy no los muestra, y es fácil
// olvidarlos: se avisa de ellos.

type PedidoMinimo = Pick<Pedido, 'estado' | 'created_at'>

export interface PendientesAnteriores {
  cantidad: number
  // Fecha local ("AAAA-MM-DD") del pedido pendiente más antiguo; null si no hay ninguno.
  masAntiguo: string | null
}

// Un pedido cuenta si (1) sigue en proceso (ni entregado ni cancelado) y (2) se hizo en un día anterior a hoy,
// según la fecha LOCAL del usuario. Un pedido de hoy, aunque sea de la madrugada, no cuenta.
export function esSinEntregarDeDiaAnterior(pedido: PedidoMinimo, hoy: string): boolean {
  if (!ESTADOS_SIN_ENTREGAR.includes(pedido.estado)) return false
  return fechaLocalISO(new Date(pedido.created_at)) < hoy
}

export function resumirPendientesAnteriores(pedidos: PedidoMinimo[], hoy: string): PendientesAnteriores {
  let cantidad = 0
  let masAntiguo: string | null = null

  for (const pedido of pedidos) {
    if (!esSinEntregarDeDiaAnterior(pedido, hoy)) continue
    cantidad++
    const dia = fechaLocalISO(new Date(pedido.created_at))
    if (masAntiguo === null || dia < masAntiguo) masAntiguo = dia
  }

  return { cantidad, masAntiguo }
}

// Dirección de la lista de pedidos ya en la vista "Sin entregar" (la usa el aviso del panel).
export const RUTA_PEDIDOS_SIN_ENTREGAR = `/pedidos?vista=${VISTA_SIN_ENTREGAR}`

// El panel no descarga todos los pedidos: le basta saber CUÁNTOS hay sin entregar antes de hoy y la fecha (con hora)
// del más antiguo. Convierte esa respuesta al mismo resumen que usa la lista de pedidos.
export function resumirConsultaPendientes(cantidad: number, masAntiguoCreadoEn: string | null): PendientesAnteriores {
  if (cantidad <= 0 || !masAntiguoCreadoEn) return { cantidad: 0, masAntiguo: null }
  return { cantidad, masAntiguo: fechaLocalISO(new Date(masAntiguoCreadoEn)) }
}

export function tituloAvisoPendientes(cantidad: number): string {
  return cantidad === 1
    ? 'Tienes 1 pedido de un día anterior sin entregar'
    : `Tienes ${cantidad} pedidos de días anteriores sin entregar`
}

// "2026-11-07" -> "7 de noviembre"
export function describirDia(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}
