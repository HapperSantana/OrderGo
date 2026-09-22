import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Pedido } from '../../types/pedido'
import { NuevoPedidoForm } from './NuevoPedidoForm'
import { PedidoCard } from './PedidoCard'

export function ListaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const cargarPedidos = useCallback(async () => {
    setIsLoading(true)
    setErrorCarga(null)

    // Trae cada pedido junto con los datos del cliente y sus renglones de
    // producto en una sola consulta, aprovechando las relaciones detectadas
    // automáticamente por Supabase (foreign keys cliente_id y pedido_id).
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:clientes(id, nombre, telefono), detalle_pedido(*)')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorCarga('No se pudieron cargar los pedidos. Intenta de nuevo más tarde.')
    } else {
      setPedidos((data ?? []) as unknown as Pedido[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void cargarPedidos()
  }, [cargarPedidos])

  return (
    <div className="pagina-pedidos">
      <NuevoPedidoForm onPedidoCreado={cargarPedidos} />

      <section className="tarjeta lista-pedidos">
        <div className="lista-pedidos__encabezado">
          <h2>Pedidos registrados</h2>
        </div>

        {isLoading && <p className="lista-pedidos__estado">Cargando pedidos…</p>}

        {errorCarga && (
          <p className="mensaje-error" role="alert">
            {errorCarga}
          </p>
        )}

        {!isLoading && !errorCarga && pedidos.length === 0 && (
          <p className="lista-pedidos__estado">
            Aún no has registrado ningún pedido. Usa el formulario de arriba para crear el primero.
          </p>
        )}

        {!isLoading && !errorCarga && pedidos.length > 0 && (
          <div className="lista-pedidos__items">
            {pedidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
