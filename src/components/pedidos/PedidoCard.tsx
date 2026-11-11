import { useState } from 'react'
import { formatearMoneda } from '../../utils/dinero'
import type { EstadoPedido, Pedido } from '../../types/pedido'
import type { ValorPago } from '../../utils/pago'
import { AvisoWhatsApp } from './AvisoWhatsApp'
import { EditarPedidoForm } from './EditarPedidoForm'
import { EstadoPedidoSelector } from './EstadoPedidoSelector'
import { PagoSelector } from './PagoSelector'
import { PedidoAcciones } from './PedidoAcciones'
import { PedidoDetalle } from './PedidoDetalle'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  onCambiarPago: (id: string, nuevoValor: ValorPago) => unknown
  // HU07: debe devolver true si la cancelación se guardó correctamente.
  onCancelarPedido: (id: string) => Promise<boolean>
  // HU07: se llama después de guardar una edición, para recargar la lista.
  onPedidoEditado: () => void | Promise<void>
}

export function PedidoCard({
  pedido,
  onCambiarEstado,
  onCambiarPago,
  onCancelarPedido,
  onPedidoEditado,
}: PedidoCardProps) {
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const cantidadProductos = pedido.detalle_pedido?.length ?? 0

  async function alGuardarEdicion() {
    await onPedidoEditado()
    setEditando(false)
  }

  return (
    <article className={`pedido-card${pedido.estado === 'cancelado' ? ' pedido-card--cancelado' : ''}`}>
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
            
            onCambiar={(nuevoEstado) => onCambiarEstado(pedido.id, nuevoEstado)}
          />
          <PagoSelector
            estadoPago={pedido.estado_pago}
            metodoPago={pedido.metodo_pago}
            onCambiar={(nuevoValor) => onCambiarPago(pedido.id, nuevoValor)}
          />
          <span className="pedido-card__total">{formatearMoneda(pedido.total)}</span>
          <button
            type="button"
            className="pedido-card__flecha-boton"
            onClick={() => setExpandido((actual) => !actual)}
            aria-label={expandido ? 'Ocultar detalle del pedido' : 'Ver detalle del pedido'}
            aria-expanded={expandido}
          >
            {expandido ? <ChevronUp size={16} aria-hidden="true" focusable="false" /> : <ChevronDown size={16} aria-hidden="true" focusable="false" />}
          </button>
        </div>
      </div>

      <AvisoWhatsApp pedido={pedido} />

      {expandido && editando && (
        <EditarPedidoForm
          pedido={pedido}
          onGuardado={alGuardarEdicion}
          onCancelarEdicion={() => setEditando(false)}
        />
      )}

      {expandido && !editando && (
        <>
          <PedidoDetalle pedido={pedido} />
          <PedidoAcciones
            pedido={pedido}
            onEditar={() => setEditando(true)}
            onCancelar={() => onCancelarPedido(pedido.id)}
          />
        </>
      )}
    </article>
  )
}
