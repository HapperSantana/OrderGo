import type { EstadoPago, EstadoPedido, MetodoPago, Pedido } from '../types/pedido'

// Filtros de la lista de pedidos (HU08 + ajustes posteriores).
export interface FiltrosPedidos {
  estado: EstadoPedido | 'todos'
  pago: EstadoPago | 'todos'
  // "sin_metodo" = pedidos ya pagados a los que no se les registró el método.
  metodo: MetodoPago | 'todos'
  // Fechas en formato "AAAA-MM-DD" (lo que entrega <input type="date">). Vacío = sin límite.
  desde: string
  hasta: string
  // Texto a buscar en el nombre o teléfono del cliente.
  cliente: string
}

// Fecha de hoy en la zona horaria LOCAL del usuario, como "AAAA-MM-DD".
// (toISOString() daría la fecha en UTC, que de noche ya puede ser "mañana".)
export function fechaHoy(): string {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

// Filtros con los que arranca la lista: solo los pedidos de HOY. Es una
// función (y no una constante) para que "hoy" se calcule en el momento de
// usarla: al cargar o refrescar la página, y al pulsar "Volver a hoy".
export function crearFiltrosIniciales(): FiltrosPedidos {
  const hoy = fechaHoy()
  return { estado: 'todos', pago: 'todos', metodo: 'todos', desde: hoy, hasta: hoy, cliente: '' }
}

// ¿Los filtros son exactamente los de arranque (solo hoy, sin nada más)?
export function sonFiltrosIniciales(filtros: FiltrosPedidos): boolean {
  const iniciales = crearFiltrosIniciales()
  return (
    filtros.estado === iniciales.estado &&
    filtros.pago === iniciales.pago &&
    filtros.metodo === iniciales.metodo &&
    filtros.desde === iniciales.desde &&
    filtros.hasta === iniciales.hasta &&
    filtros.cliente.trim() === ''
  )
}

// "AAAA-MM-DD" -> Date en la zona horaria LOCAL del usuario. Se evita
// new Date("AAAA-MM-DD") a propósito: ese formato se interpreta como UTC y
// puede correr la fecha un día hacia atrás según la zona horaria.
function fechaLocal(texto: string, finDelDia: boolean): Date | null {
  const partes = texto.split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null
  const [anio, mes, dia] = partes
  return finDelDia ? new Date(anio, mes - 1, dia, 23, 59, 59, 999) : new Date(anio, mes - 1, dia, 0, 0, 0, 0)
}

// Aplica todos los filtros a la vez (se combinan con "y"). Los límites de fecha
// son inclusivos: "hasta" incluye todo el día indicado.
export function filtrarPedidos(pedidos: Pedido[], filtros: FiltrosPedidos): Pedido[] {
  const desde = filtros.desde ? fechaLocal(filtros.desde, false) : null
  const hasta = filtros.hasta ? fechaLocal(filtros.hasta, true) : null
  const termino = filtros.cliente.trim().toLowerCase()

  return pedidos.filter((pedido) => {
    if (filtros.estado !== 'todos' && pedido.estado !== filtros.estado) return false
    if (filtros.pago !== 'todos' && pedido.estado_pago !== filtros.pago) return false

      if (filtros.metodo !== 'todos') {
         if (pedido.estado_pago !== 'pagado' || pedido.metodo_pago !== filtros.metodo) return false
       }

    const creado = new Date(pedido.created_at)
    if (desde && creado < desde) return false
    if (hasta && creado > hasta) return false

    if (termino) {
      const nombre = pedido.cliente?.nombre.toLowerCase() ?? ''
      const telefono = pedido.cliente?.telefono.toLowerCase() ?? ''
      if (!nombre.includes(termino) && !telefono.includes(termino)) return false
    }

    return true
  })
}