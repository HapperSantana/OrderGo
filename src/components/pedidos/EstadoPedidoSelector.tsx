import { ESTADOS_SELECCIONABLES, ETIQUETAS_ESTADO } from '../../types/pedido'
import { esEstadoFinal, motivoDeBloqueo } from '../../utils/estadoPedido'
import type { EstadoPedido } from '../../types/pedido'

// Colores de cada estado: el selector se ve como una insignia interactiva en vez de un <select> genérico.
const ESTILO_POR_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'badge-estado--pendiente',
  en_preparacion: 'badge-estado--en-preparacion',
  listo: 'badge-estado--listo',
  entregado: 'badge-estado--entregado',
  cancelado: 'badge-estado--cancelado',
}

interface EstadoPedidoSelectorProps {
  estado: EstadoPedido
  disabled?: boolean
  onCambiar: (nuevoEstado: EstadoPedido) => unknown
}

export function EstadoPedidoSelector({ estado, disabled, onCambiar }: EstadoPedidoSelectorProps) {
  // Es un <select> controlado por completo por el prop `estado`: no guarda
  // ninguna copia propia, así que si la actualización falla y el padre no
  // cambia el estado, el control simplemente vuelve a mostrar el valor
    // anterior en el siguiente render (sin quedar "desincronizado").
  //
  // CC09: en un estado final (entregado o cancelado) el selector queda bloqueado, con la razón visible al pasar
  // el cursor y también para los lectores de pantalla.
  const motivo = motivoDeBloqueo(estado)
  return (
    <select
      className={`selector-estado badge-estado ${ESTILO_POR_ESTADO[estado]}`}
      value={estado}
      disabled={disabled || esEstadoFinal(estado)}
      title={motivo}
      onClick={(evento) => evento.stopPropagation()}
      onChange={(evento) => void onCambiar(evento.target.value as EstadoPedido)}
      aria-label={motivo ? `Estado del pedido. ${motivo}` : 'Estado del pedido'}
    >
      {ESTADOS_SELECCIONABLES.map((opcion) => (
        <option key={opcion} value={opcion}>
          {ETIQUETAS_ESTADO[opcion]}
        </option>
      ))}
      {/* Si el pedido ya está cancelado (HU07, aún no implementada), se
          muestra como opción de solo lectura para no perder la info. */}
      {estado === 'cancelado' && <option value="cancelado">{ETIQUETAS_ESTADO.cancelado}</option>}
    </select>
  )
}