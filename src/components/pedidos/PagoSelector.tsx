import { ETIQUETAS_METODO_PAGO, ETIQUETAS_PAGO } from '../../types/pedido'
import type { EstadoPago, MetodoPago } from '../../types/pedido'

const METODOS: MetodoPago[] = ['efectivo', 'tarjeta', 'transferencia', 'otro']

interface PagoSelectorProps {
  estadoPago: EstadoPago
  metodoPago: MetodoPago | null
  // Igual que EstadoPedidoSelector: sin estado local propio. Cada cambio se
  // envía de inmediato al padre, que es quien decide si se guarda o no.
  onCambiarEstado: (nuevoEstado: EstadoPago) => unknown
  onCambiarMetodo: (nuevoMetodo: MetodoPago) => unknown
}

export function PagoSelector({ estadoPago, metodoPago, onCambiarEstado, onCambiarMetodo }: PagoSelectorProps) {
  return (
    <div className="pago-selector" onClick={(evento) => evento.stopPropagation()}>
      <select
        className={`selector-pago badge-pago ${estadoPago === 'pagado' ? 'badge-pago--pagado' : 'badge-pago--pendiente'}`}
        value={estadoPago}
        onChange={(evento) => void onCambiarEstado(evento.target.value as EstadoPago)}
        aria-label="Estado de pago"
      >
        <option value="pendiente">{ETIQUETAS_PAGO.pendiente}</option>
        <option value="pagado">{ETIQUETAS_PAGO.pagado}</option>
      </select>

      {estadoPago === 'pagado' && (
        <select
          className="selector-metodo-pago"
          value={metodoPago ?? ''}
          onChange={(evento) => void onCambiarMetodo(evento.target.value as MetodoPago)}
          aria-label="Método de pago"
        >
          <option value="" disabled>
            Método…
          </option>
          {METODOS.map((metodo) => (
            <option key={metodo} value={metodo}>
              {ETIQUETAS_METODO_PAGO[metodo]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}