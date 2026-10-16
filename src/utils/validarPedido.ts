import type { ClienteResumen, ItemNuevoPedido } from '../types/pedido'

// Validación compartida por el formulario de alta (NuevoPedidoForm) y el de
// edición (EditarPedidoForm), para que ambos apliquen exactamente las mismas
// reglas. Devuelve el mensaje de error, o null si todo está correcto.
export function validarPedido(cliente: ClienteResumen | null, items: ItemNuevoPedido[]): string | null {
  if (!cliente) return 'Selecciona el cliente para este pedido.'

  const itemsValidos = items.filter((item) => item.nombre.trim() !== '')
  if (itemsValidos.length === 0) return 'Agrega al menos un producto al pedido.'

  const itemInvalido = itemsValidos.find((item) => item.precio <= 0)
  if (itemInvalido) return `El producto "${itemInvalido.nombre}" necesita un precio mayor a cero.`

  return null
}

// Convierte los renglones capturados al formato que esperan las funciones
// crear_pedido y actualizar_pedido de la base de datos.
export function itemsParaRpc(items: ItemNuevoPedido[]) {
  return items
    .filter((item) => item.nombre.trim() !== '')
    .map((item) => ({
      nombre: item.nombre.trim(),
      precio: item.precio,
      cantidad: item.cantidad,
      instrucciones: item.instrucciones?.trim() || null,
    }))
}