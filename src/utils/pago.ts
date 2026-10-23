import type { MetodoPago, Pedido } from '../types/pedido'

// Valor del control único de pago (CC07): o el pedido está pendiente de pago,
// o se eligió el método con el que se pagó. Elegir un método implica "Pagado",
// de modo que un pedido pagado nunca puede quedar sin método.
export type ValorPago = 'pendiente' | MetodoPago

type CamposDePago = Pick<Pedido, 'estado_pago' | 'metodo_pago'>

// Qué se guarda en la base de datos al elegir un valor en el control de pago.
export function cambiosDePago(valor: ValorPago): CamposDePago {
  if (valor === 'pendiente') return { estado_pago: 'pendiente', metodo_pago: null }
  return { estado_pago: 'pagado', metodo_pago: valor }
}

// Qué valor mostrar en el control para un pedido. "sin_metodo" solo puede
// aparecer en pedidos antiguos (pagados antes de que el método fuera
// obligatorio) que todavía no se han corregido.
export function valorDePago(pedido: CamposDePago): ValorPago | 'sin_metodo' {
  if (pedido.estado_pago === 'pendiente') return 'pendiente'
  return pedido.metodo_pago ?? 'sin_metodo'
}