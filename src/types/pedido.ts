// Estados posibles de un pedido. Todo pedido nace en "pendiente" (ver
// crear_pedido) y HU05 permite moverlo entre los siguientes cuatro.
export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'

export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// HU05 solo cambia entre estos cuatro; "cancelado" se maneja en HU07
// (Editar y cancelar pedidos), que todavía no se implementa.
export const ESTADOS_SELECCIONABLES: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo', 'entregado']

// Estado del pago de un pedido (HU06).
export type EstadoPago = 'pendiente' | 'pagado'

export const ETIQUETAS_PAGO: Record<EstadoPago, string> = {
  pendiente: 'Pago pendiente',
  pagado: 'Pagado',
}

// Método con el que se saldó un pedido. Solo tiene sentido cuando
// estado_pago es "pagado"; en "pendiente" suele ser null.
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

// Representa un registro de la tabla `detalle_pedido` (un renglón del pedido).
export interface DetallePedido {
  id: string
  pedido_id: string
  producto_id: string
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  subtotal: number
  // Instrucciones de preparación de este renglón (ej. "sin cebolla"). Distinto
  // de Pedido.notas, que es una nota general para todo el pedido.
  instrucciones: string | null
}

// Datos mínimos del cliente que se muestran junto al pedido (join con `clientes`).
export interface ClienteResumen {
  id: string
  nombre: string
  telefono: string
}

// Representa un registro de la tabla `pedidos`, con sus relaciones opcionales
// (se incluyen cuando la consulta hace `select` con join).
export interface Pedido {
  id: string
  owner_id: string
  cliente_id: string
  estado: EstadoPedido
  estado_pago: EstadoPago
  metodo_pago: MetodoPago | null
  notas: string | null
  total: number
  created_at: string
  cliente?: ClienteResumen | null
  detalle_pedido?: DetallePedido[]
}

// Un renglón que el usuario está armando en el formulario, antes de guardarse.
export interface ItemNuevoPedido {
  nombre: string
  precio: number
  cantidad: number
  // Instrucciones de preparación de este producto (ej. "sin cebolla, poco picante").
  instrucciones?: string
}

// Payload que espera la función RPC `crear_pedido` de Supabase.
export interface NuevoPedido {
  cliente_id: string
  notas?: string
  items: ItemNuevoPedido[]
}