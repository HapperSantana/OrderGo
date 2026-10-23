import { ETIQUETAS_METODO_PAGO, ETIQUETAS_PAGO } from '../../types/pedido'
import type { EstadoPago, MetodoPago } from '../../types/pedido'
import { valorDePago } from '../../utils/pago'
import type { ValorPago } from '../../utils/pago'

const METODOS = Object.keys(ETIQUETAS_METODO_PAGO) as MetodoPago[]

interface PagoSelectorProps {
  estadoPago: EstadoPago
  metodoPago: MetodoPago | null
  // Sin estado local propio (igual que EstadoPedidoSelector): cada cambio se
  // envía al padre, que decide si se guarda, y el control siempre muestra el
  // valor que confirma el servidor.
  onCambiar: (nuevoValor: ValorPago) => unknown
}

// Control único de pago (CC07). Marcar un pedido como pagado exige elegir el
// método en el mismo paso, por eso ya no hay un selector de "Pagado" aparte.
export function PagoSelector({ estadoPago, metodoPago, onCambiar }: PagoSelectorProps) {
  const actual = valorDePago({ estado_pago: estadoPago, metodo_pago: metodoPago })

  const colorDelValor =
    actual === 'pendiente' ? 'badge-pago--pendiente' : `metodo-pago--${actual === 'sin_metodo' ? 'ninguno' : actual}`

  return (
    <select
      className={`selector-pago badge-pago ${colorDelValor}`}
      value={actual === 'sin_metodo' ? '' : actual}
      onChange={(evento) => void onCambiar(evento.target.value as ValorPago)}
      aria-label="Pago del pedido"
    >
      {/* Solo para pedidos antiguos pagados sin método: obliga a elegir uno. */}
      {actual === 'sin_metodo' && (
        <option value="" disabled>
          Pagado · elegir método…
        </option>
      )}
      <option value="pendiente">{ETIQUETAS_PAGO.pendiente}</option>
      {METODOS.map((metodo) => (
        <option key={metodo} value={metodo}>
          Pagado · {ETIQUETAS_METODO_PAGO[metodo]}
        </option>
      ))}
    </select>
  )
}