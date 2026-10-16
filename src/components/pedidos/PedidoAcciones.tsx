import { useState } from 'react'
import type { Pedido } from '../../types/pedido'

interface PedidoAccionesProps {
  pedido: Pedido
  onEditar: () => void
  // Debe devolver true si la cancelación se guardó correctamente.
  onCancelar: () => Promise<boolean>
}

// Botones de HU07 (editar / cancelar) que se muestran dentro del detalle de un
// pedido. La confirmación de cancelación es un aviso en la propia tarjeta (no
// un window.confirm) para que se vea igual que el resto de la aplicación.
export function PedidoAcciones({ pedido, onEditar, onCancelar }: PedidoAccionesProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  if (pedido.estado === 'cancelado') {
    return <p className="pedido-acciones__nota">Este pedido fue cancelado y ya no se puede modificar.</p>
  }

  if (pedido.estado === 'entregado') {
    return <p className="pedido-acciones__nota">Los pedidos entregados ya no se pueden editar ni cancelar.</p>
  }

  async function confirmarCancelacion() {
    setCancelando(true)
    const exito = await onCancelar()
    setCancelando(false)
    // Si salió bien, el pedido pasa a "cancelado" y este componente muestra
    // la nota de arriba; si falló, se cierra el aviso para poder reintentar.
    if (!exito) setConfirmando(false)
  }

  if (confirmando) {
    return (
      <div className="pedido-acciones pedido-acciones--confirmar" role="alertdialog" aria-label="Confirmar cancelación">
        <p>
          ¿Cancelar este pedido? Se conservará en el historial como <strong>Cancelado</strong> y ya no se podrá
          editar.
        </p>
        <div className="pedido-acciones__botones">
          <button
            type="button"
            className="boton boton--peligro-solido"
            disabled={cancelando}
            onClick={() => void confirmarCancelacion()}
          >
            {cancelando ? 'Cancelando…' : 'Sí, cancelar pedido'}
          </button>
          <button type="button" className="boton boton--enlace" disabled={cancelando} onClick={() => setConfirmando(false)}>
            No, conservar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pedido-acciones">
      <button type="button" className="boton boton--secundario" onClick={onEditar}>
        Editar pedido
      </button>
      <button type="button" className="boton boton--enlace boton--peligro" onClick={() => setConfirmando(true)}>
        Cancelar pedido
      </button>
    </div>
  )
}