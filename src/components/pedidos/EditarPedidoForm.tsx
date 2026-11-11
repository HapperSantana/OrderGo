import { useState } from 'react'
import { useEnvioUnico } from '../../hooks/useEnvioUnico'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { ClienteResumen, ItemNuevoPedido, Pedido } from '../../types/pedido'
import { itemsParaRpc, validarPedido } from '../../utils/validarPedido'
import { SelectorCliente } from './SelectorCliente'
import { ItemsPedidoEditor } from './ItemsPedidoEditor'
import { NotebookPen, Save } from 'lucide-react'

// Código de error de Postgres para "raise exception" escrito a mano en las
// funciones de supabase/schema.sql. Esos mensajes ya están en español y pensados
// para el usuario (por ejemplo "No se puede editar un pedido que ya está
// entregado."), así que se muestran tal cual; cualquier otro error (red, etc.)
// se reemplaza por un mensaje genérico.
const CODIGO_REGLA_DE_NEGOCIO = 'P0001'

interface EditarPedidoFormProps {
  pedido: Pedido
  onGuardado: () => void | Promise<void>
  onCancelarEdicion: () => void
}

export function EditarPedidoForm({ pedido, onGuardado, onCancelarEdicion }: EditarPedidoFormProps) {
  // Todo el estado se inicializa UNA vez a partir del pedido: el formulario se
  // monta al pulsar "Editar" y se desmonta al guardar o cancelar, así que no
  // hay riesgo de que quede con datos de una edición anterior.
  const [cliente, setCliente] = useState<ClienteResumen | null>(pedido.cliente ?? null)
  const [items, setItems] = useState<ItemNuevoPedido[]>(() =>
    (pedido.detalle_pedido ?? []).map((detalle) => ({
      nombre: detalle.nombre_producto,
      precio: Number(detalle.precio_unitario),
      cantidad: detalle.cantidad,
      instrucciones: detalle.instrucciones ?? '',
    })),
  )
  const [notas, setNotas] = useState(pedido.notas ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const enviarUnaVez = useEnvioUnico()

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    // Un segundo envío mientras el primero sigue en curso se ignora (ver useEnvioUnico).
    await enviarUnaVez(async () => {
      setError(null)

      const mensajeValidacion = validarPedido(cliente, items)
      if (mensajeValidacion) {
        setError(mensajeValidacion)
        return
      }

      setIsSubmitting(true)
      const { error: errorRpc } = await supabase.rpc('actualizar_pedido', {
        p_pedido_id: pedido.id,
        p_cliente_id: cliente!.id,
        p_notas: notas.trim() || null,
        p_items: itemsParaRpc(items),
      })
      setIsSubmitting(false)

      if (errorRpc) {
        setError(
          errorRpc.code === CODIGO_REGLA_DE_NEGOCIO
            ? errorRpc.message
            : 'No se pudieron guardar los cambios. Verifica los datos e intenta de nuevo.',
        )
        return
      }

      await onGuardado()
    })
  }

  return (
    <form className="editar-pedido" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <h3 className="editar-pedido__titulo">Editar pedido</h3>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      <div className="campo">
        <span className="campo__etiqueta">Cliente *</span>
        <SelectorCliente clienteId={cliente?.id ?? null} onSeleccionar={setCliente} />
      </div>

      <div className="campo">
        <span className="campo__etiqueta">Productos *</span>
        <ItemsPedidoEditor items={items} onCambiar={setItems} />
      </div>

      <label className="campo">
        <span className="campo__etiqueta etiqueta-con-icono">
          <NotebookPen size={16} aria-hidden="true" focusable="false" />
          Notas (opcional)
        </span>
        <input
          type="text"
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
          placeholder="Ej. para llevar, referencia de entrega…"
        />
      </label>

      <div className="editar-pedido__botones">
        <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
          <Save size={18} aria-hidden="true" focusable="false" />
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="boton boton--enlace" disabled={isSubmitting} onClick={onCancelarEdicion}>
          Descartar cambios
        </button>
      </div>
    </form>
  )
}
