import { formatearMoneda } from '../../utils/dinero'
import type { Pedido } from '../../types/pedido'

export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  const items = pedido.detalle_pedido ?? []

  return (
    <div className="pedido-detalle">
      <table className="pedido-detalle__tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.nombre_producto}
                {item.instrucciones && (
                  <span className="pedido-detalle__instrucciones">↳ {item.instrucciones}</span>
                )}
              </td>
              <td>{item.cantidad}</td>
              <td>{formatearMoneda(item.precio_unitario)}</td>
              <td>{formatearMoneda(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {pedido.notas && (
        <p className="pedido-detalle__notas">
          <strong>Notas:</strong> {pedido.notas}
        </p>
      )}

      <div className="pedido-detalle__total">
        <span>Total</span>
        <strong>{formatearMoneda(pedido.total)}</strong>
      </div>
    </div>
  )
}
