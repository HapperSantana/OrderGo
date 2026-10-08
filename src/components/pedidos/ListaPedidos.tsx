import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { EstadoPago, EstadoPedido, MetodoPago, Pedido } from '../../types/pedido'
import { NuevoPedidoForm } from './NuevoPedidoForm'
import { PedidoCard } from './PedidoCard'

export function ListaPedidos() {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // `silencioso` = recargar sin mostrar "Cargando pedidos…". Se usa cuando la
  // recarga la dispara Realtime (incluso por un cambio hecho por uno mismo):
  // si se mostrara el estado de carga, las tarjetas se desmontarían, la lista
  // parpadearía y los detalles expandidos se cerrarían solos.
  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setIsLoading(true)
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

  // HU05/HU06: se suscribe a cambios en tiempo real de la tabla `pedidos`
  // (ver supabase/schema.sql, sección Sprint 3) para que un cambio de estado
  // o de pago hecho desde otra pestaña o dispositivo se refleje aquí sin
  // recargar la página. Ante cualquier cambio simplemente se vuelve a pedir
  // la lista completa: es más simple y seguro que tratar de reconstruir a
  // mano las relaciones (cliente, detalle_pedido) a partir del evento.
  useEffect(() => {
    if (!user) return

    const canal = supabase
      .channel('pedidos-cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `owner_id=eq.${user.id}` },
        () => {
          void cargarPedidos(true)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [user, cargarPedidos])

  // Actualiza un pedido SOLO después de que Supabase confirma el cambio (no
  // es una actualización optimista): si el servidor responde bien, se
  // refleja en la lista local; si falla, no se toca el estado local y el
  // control (que es 100% controlado por props) sigue mostrando el valor
  // anterior. Por eso, al marcar "Pagado", el selector de método aparece
  // una fracción de segundo después, cuando llega la confirmación.
  async function actualizarPedido(id: string, cambios: Partial<Pedido>): Promise<boolean> {
    setErrorAccion(null)
    const { data, error } = await supabase.from('pedidos').update(cambios).eq('id', id).select().single()

    if (error) {
      setErrorAccion('No se pudo guardar el cambio. Intenta de nuevo.')
      return false
    }

    setPedidos((actuales) => actuales.map((p) => (p.id === id ? { ...p, ...data } : p)))
    return true
  }

  function handleCambiarEstado(id: string, nuevoEstado: EstadoPedido) {
    return actualizarPedido(id, { estado: nuevoEstado })
  }

  function handleCambiarEstadoPago(id: string, nuevoEstado: EstadoPago) {
    // Si se marca como "pendiente", se limpia el método de pago capturado
    // anteriormente (ya no aplica); si se marca "pagado" sin método
    // explícito todavía, se deja como está hasta que el usuario lo elija.
    const cambios: Partial<Pedido> = { estado_pago: nuevoEstado }
    if (nuevoEstado === 'pendiente') cambios.metodo_pago = null
    return actualizarPedido(id, cambios)
  }

  function handleCambiarMetodoPago(id: string, nuevoMetodo: MetodoPago) {
    return actualizarPedido(id, { estado_pago: 'pagado', metodo_pago: nuevoMetodo })
  }

  return (
    <div className="pagina-pedidos">
      <NuevoPedidoForm onPedidoCreado={() => cargarPedidos(true)} />

      <section className="tarjeta lista-pedidos">
        <div className="lista-pedidos__encabezado">
          <h2>Pedidos registrados</h2>
        </div>

        {errorAccion && (
          <p className="mensaje-error" role="alert">
            {errorAccion}
          </p>
        )}

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
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onCambiarEstado={handleCambiarEstado}
                onCambiarEstadoPago={handleCambiarEstadoPago}
                onCambiarMetodoPago={handleCambiarMetodoPago}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}