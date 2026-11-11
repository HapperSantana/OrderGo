import { useState } from 'react'
import { useEnvioUnico } from '../../hooks/useEnvioUnico'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { ClienteResumen, ItemNuevoPedido } from '../../types/pedido'
import { itemsParaRpc, validarPedido } from '../../utils/validarPedido'
import { SelectorCliente } from './SelectorCliente'
import { ItemsPedidoEditor } from './ItemsPedidoEditor'
import { ClipboardCheck, ClipboardList, NotebookPen } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'

interface NuevoPedidoFormProps {
  onPedidoCreado: () => void | Promise<void>
}

// El pedido empieza sin productos: se eligen desde el catálogo con "Agregar productos".
const SIN_PRODUCTOS: ItemNuevoPedido[] = []

export function NuevoPedidoForm({ onPedidoCreado }: NuevoPedidoFormProps) {
  const [cliente, setCliente] = useState<ClienteResumen | null>(null)
  const [items, setItems] = useState<ItemNuevoPedido[]>(SIN_PRODUCTOS)
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const enviarUnaVez = useEnvioUnico()

  // ItemsPedidoEditor guarda su propia copia interna de los renglones (para
  // poder editarlos con libertad) y solo la inicializa una vez al montarse.
  // Cambiar esta key después de guardar obliga a React a desmontar y volver
  // a montar el editor desde cero, así sí se limpian los productos capturados.
  const [claveReinicio, setClaveReinicio] = useState(0)

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

      const { error: errorRpc } = await supabase.rpc('crear_pedido', {
        p_cliente_id: cliente!.id,
        p_notas: notas.trim() || null,
        p_items: itemsParaRpc(items),
      })

      setIsSubmitting(false)

      if (errorRpc) {
        setError('No se pudo registrar el pedido. Verifica los datos e intenta de nuevo.')
        return
      }

      // Limpiar el formulario y avisar al listado para que se recargue.
      setCliente(null)
      setItems(SIN_PRODUCTOS)
      setNotas('')
      setClaveReinicio((clave) => clave + 1)
      await onPedidoCreado()
    })
  }

  return (
    <form className="tarjeta formulario-pedido" onSubmit={(evento) => void handleSubmit(evento)} noValidate>
      <TituloSeccion className="formulario-pedido__titulo" icono={ClipboardList}>
        Nuevo pedido
      </TituloSeccion>

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
        <span className="campo__etiqueta etiqueta-con-icono">
          <NotebookPen size={16} aria-hidden="true" focusable="false" />
          Notas (opcional)
        </span>
        <input
          type="text"
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
          placeholder="Ej. sin cebolla, para llevar, referencia de entrega…"
        />
      </label>

      <button type="submit" className="boton boton--primario" disabled={isSubmitting}>
        <ClipboardCheck size={18} aria-hidden="true" focusable="false" />
        {isSubmitting ? 'Guardando pedido…' : 'Registrar pedido'}
      </button>
    </form>
  )
}
