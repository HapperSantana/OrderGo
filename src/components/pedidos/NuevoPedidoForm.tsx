import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { ClienteResumen, ItemNuevoPedido } from '../../types/pedido'
import { SelectorCliente } from './SelectorCliente'
import { ItemsPedidoEditor } from './ItemsPedidoEditor'

interface NuevoPedidoFormProps {
  onPedidoCreado: () => void | Promise<void>
}

const ITEM_INICIAL: ItemNuevoPedido = { nombre: '', precio: 0, cantidad: 1 }

export function NuevoPedidoForm({ onPedidoCreado }: NuevoPedidoFormProps) {
  const [cliente, setCliente] = useState<ClienteResumen | null>(null)
  const [items, setItems] = useState<ItemNuevoPedido[]>([ITEM_INICIAL])
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ItemsPedidoEditor guarda su propia copia interna de los renglones (para
  // poder editarlos con libertad) y solo la inicializa una vez al montarse.
  // Cambiar esta key después de guardar obliga a React a desmontar y volver
  // a montar el editor desde cero, así sí se limpian los productos capturados.
  const [claveReinicio, setClaveReinicio] = useState(0)

  function validar(): string | null {
    if (!cliente) return 'Selecciona el cliente para este pedido.'

    const itemsValidos = items.filter((item) => item.nombre.trim() !== '')
    if (itemsValidos.length === 0) return 'Agrega al menos un producto al pedido.'

    const itemInvalido = itemsValidos.find((item) => item.precio <= 0)
    if (itemInvalido) return `El producto "${itemInvalido.nombre}" necesita un precio mayor a cero.`

    return null
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const mensajeValidacion = validar()
    if (mensajeValidacion) {
      setError(mensajeValidacion)
      return
    }

    setIsSubmitting(true)

    const { error: errorRpc } = await supabase.rpc('crear_pedido', {
      p_cliente_id: cliente!.id,
      p_notas: notas.trim() || null,
      p_items: items
        .filter((item) => item.nombre.trim() !== '')
        .map((item) => ({
          nombre: item.nombre.trim(),
          precio: item.precio,
          cantidad: item.cantidad,
          instrucciones: item.instrucciones?.trim() || null,
        })),
    })

    setIsSubmitting(false)

    if (errorRpc) {
      setError('No se pudo registrar el pedido. Verifica los datos e intenta de nuevo.')
      return
    }

    // Limpiar el formulario y avisar al listado para que se recargue.
    setCliente(null)
    setItems([ITEM_INICIAL])
    setNotas('')
    setClaveReinicio((clave) => clave + 1)
    await onPedidoCreado()
  }

  return (
    <form className="tarjeta formulario-pedido" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <h2 className="formulario-pedido__titulo">Nuevo pedido</h2>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      <div className="campo">
        <span className="campo__etiqueta">Cliente *</span>
        <SelectorCliente key={claveReinicio} clienteId={cliente?.id ?? null} onSeleccionar={setCliente} />
      </div>

      <div className="campo">
        <span className="campo__etiqueta">Productos *</span>
        <ItemsPedidoEditor key={claveReinicio} items={items} onCambiar={setItems} />
      </div>

      <label className="campo">
        <span className="campo__etiqueta">Notas (opcional)</span>
        <input
          type="text"
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
          placeholder="Ej. sin cebolla, para llevar, referencia de entrega…"
        />
      </label>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando pedido…' : 'Registrar pedido'}
      </button>
    </form>
  )
}