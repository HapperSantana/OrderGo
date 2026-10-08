import { useState } from 'react'
import { formatearMoneda } from '../../utils/dinero'
import type { EstadoPago, EstadoPedido, MetodoPago, Pedido } from '../../types/pedido'
import { EstadoPedidoSelector } from './EstadoPedidoSelector'
import { PagoSelector } from './PagoSelector'
import { PedidoDetalle } from './PedidoDetalle'

function formatearFechaHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PedidoCardProps {
  pedido: Pedido
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => unknown
  onCambiarEstadoPago: (id: string, nuevoEstado: EstadoPago) => unknown
  onCambiarMetodoPago: (id: string, nuevoMetodo: MetodoPago) => unknown
}

export function PedidoCard({ pedido, onCambiarEstado, onCambiarEstadoPago, onCambiarMetodoPago }: PedidoCardProps) {
  const [expandido, setExpandido] = useState(false)
  const cantidadProductos = pedido.detalle_pedido?.length ?? 0

  return (
    <article className="pedido-card">
      <div className="pedido-card__resumen">
        <button
          type="button"
          className="pedido-card__cliente-boton"
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
        </button>

        <div className="pedido-card__derecha">
          <EstadoPedidoSelector
            estado={pedido.estado}
            disabled={pedido.estado === 'cancelado'}
            onCambiar={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
          />
          <PagoSelector
            estadoPago={pedido.estado_pago}
            metodoPago={pedido.metodo_pago}
            onCambiarEstado={(nuevoEstado) => onCambiarEstadoPago(pedido.id, nuevoEstado)}
            onCambiarMetodo={(nuevoMetodo) => onCambiarMetodoPago(pedido.id, nuevoMetodo)}
          />
          <span className="pedido-card__total">{formatearMoneda(pedido.total)}</span>
          <button
            type="button"
            className="pedido-card__flecha-boton"
            onClick={() => setExpandido((actual) => !actual)}
            aria-label={expandido ? 'Ocultar detalle del pedido' : 'Ver detalle del pedido'}
            aria-expanded={expandido}
          >
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expandido && <PedidoDetalle pedido={pedido} />}
    </article>
  )
}