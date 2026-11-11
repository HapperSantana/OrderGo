import type { EstadoPedido } from '../types/pedido'

// Estados "finales": cuando un pedido llega a uno de ellos, deja de cambiar de estado.
export const ESTADOS_FINALES: EstadoPedido[] = ['entregado', 'cancelado']

export function esEstadoFinal(estado: EstadoPedido): boolean {
  return ESTADOS_FINALES.includes(estado)
}

// CC09: ¿se puede pasar del estado actual al nuevo? Un pedido entregado no retrocede (ni se cancela), y uno
// cancelado tampoco cambia. Entre los demás estados se puede ir y volver (por ejemplo, de Listo a En preparación).
//
// La base de datos hace cumplir esta regla para "entregado" (disparador pedidos_estado_no_retrocede en
// supabase/schema.sql); "cancelado" se protege en la interfaz y con la función cancelar_pedido.
export function puedeCambiarEstado(actual: EstadoPedido, nuevo: EstadoPedido): boolean {
  if (actual === nuevo) return true
  return !esEstadoFinal(actual)
}

// Texto que explica por qué un selector de estado está bloqueado (para el atributo title).
export function motivoDeBloqueo(estado: EstadoPedido): string | undefined {
  if (estado === 'entregado') return 'Un pedido entregado ya no puede cambiar de estado'
  if (estado === 'cancelado') return 'Un pedido cancelado ya no puede cambiar de estado'
  return undefined
}
