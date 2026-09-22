import { ETIQUETAS_ESTADO } from '../../types/pedido'
import type { EstadoPedido } from '../../types/pedido'

// Preparado para los 5 estados aunque, en este sprint, todo pedido nace
// (y se queda) en "pendiente"; HU05 agregará la interacción para cambiarlo.
const ESTILO_POR_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'badge-estado--pendiente',
  en_preparacion: 'badge-estado--en-preparacion',
  listo: 'badge-estado--listo',
  entregado: 'badge-estado--entregado',
  cancelado: 'badge-estado--cancelado',
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return <span className={`badge-estado ${ESTILO_POR_ESTADO[estado]}`}>{ETIQUETAS_ESTADO[estado]}</span>
}
