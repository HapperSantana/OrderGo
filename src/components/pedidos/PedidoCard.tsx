import { useState } from 'react'
import { formatearMoneda } from '../../utils/dinero'
import type { Pedido } from '../../types/pedido'
import { EstadoBadge } from './EstadoBadge'
import { PedidoDetalle } from './PedidoDetalle'

function formatearFechaHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [expandido, setExpandido] = useState(false)
  const cantidadProductos = pedido.detalle_pedido?.length ?? 0

  return (
    <article className="pedido-card">
      <button
        type="button"
        className="pedido-card__resumen"
        onClick={() => setExpandido((actual) => !actual)}
        aria-expanded={expandido}
      >
        <div className="pedido-card__cliente">
          <span className="pedido-card__nombre">{pedido.cliente?.nombre ?? 'Cliente eliminado'}</span>
          <span className="pedido-card__meta">
            {formatearFechaHora(pedido.created_at)} · {cantidadProductos}{' '}
            {cantidadProductos === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <div className="pedido-card__derecha">
          <EstadoBadge estado={pedido.estado} />
          <span className="pedido-card__total">{formatearMoneda(pedido.total)}</span>
          <span className="pedido-card__flecha" aria-hidden="true">
            {expandido ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expandido && <PedidoDetalle pedido={pedido} />}
    </article>
  )
}
