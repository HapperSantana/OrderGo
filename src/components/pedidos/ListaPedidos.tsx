import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { EstadoPedido, Pedido } from '../../types/pedido'
import { cambiosDePago } from '../../utils/pago'
import type { ValorPago } from '../../utils/pago'
import { crearFiltrosIniciales, filtrarPedidos, sonFiltrosIniciales } from '../../utils/filtrosPedidos'
import type { FiltrosPedidos as Filtros } from '../../utils/filtrosPedidos'
import { FiltrosPedidos } from './FiltrosPedidos'
import { NuevoPedidoForm } from './NuevoPedidoForm'
import { PedidoCard } from './PedidoCard'

export function ListaPedidos() {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<Filtros>(crearFiltrosIniciales)

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
  // anterior. Por eso un selector cambia unas décimas de segundo después de
  // elegir una opción: cuando llega la confirmación del servidor.
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

  // CC07: el pago se cambia con un solo control. Elegir un método guarda
  // "pagado" + ese método en una misma actualización (un pedido pagado nunca
  // queda sin método); elegir "pendiente" limpia el método.
  function handleCambiarPago(id: string, nuevoValor: ValorPago) {
    return actualizarPedido(id, cambiosDePago(nuevoValor))
  }

  // HU07: cancelación lógica mediante la función cancelar_pedido (que además
  // valida en el servidor que el pedido no esté entregado ni ya cancelado).
  async function handleCancelarPedido(id: string): Promise<boolean> {
    setErrorAccion(null)
    const { data, error } = await supabase.rpc('cancelar_pedido', { p_pedido_id: id })

    if (error) {
      // P0001 = mensaje escrito a mano en la función SQL, ya pensado para el usuario.
      setErrorAccion(error.code === 'P0001' ? error.message : 'No se pudo cancelar el pedido. Intenta de nuevo.')
      return false
    }

    setPedidos((actuales) => actuales.map((p) => (p.id === id ? { ...p, ...(data as Partial<Pedido>) } : p)))
    return true
  }

  // HU08: arranca mostrando solo los pedidos de HOY (ver crearFiltrosIniciales)
  // y los demás días se consultan cambiando las fechas. Los filtros se aplican
  // sobre la lista ya cargada: responden al instante, siguen funcionando con
  // las actualizaciones en tiempo real (la lista se recarga completa y el
  // filtro se vuelve a aplicar solo) y el filtro de fechas usa la zona
  // horaria del usuario.
  const pedidosFiltrados = useMemo(() => filtrarPedidos(pedidos, filtros), [pedidos, filtros])

  return (
    <div className="pagina-pedidos">
      <NuevoPedidoForm onPedidoCreado={() => cargarPedidos(true)} />

      <section className="tarjeta lista-pedidos">
        <div className="lista-pedidos__encabezado">
          <h2>Pedidos registrados</h2>
        </div>

        {!isLoading && !errorCarga && pedidos.length > 0 && (
          <FiltrosPedidos
            filtros={filtros}
            onCambiar={setFiltros}
            totalMostrados={pedidosFiltrados.length}
            totalPedidos={pedidos.length}
          />
        )}

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

        {!isLoading && !errorCarga && pedidos.length > 0 && pedidosFiltrados.length === 0 && (
          <p className="lista-pedidos__estado">
            {sonFiltrosIniciales(filtros)
              ? 'Hoy todavía no hay pedidos. Para ver los de otros días, cambia las fechas de los filtros.'
              : 'Ningún pedido coincide con los filtros seleccionados.'}
          </p>
        )}

        {!isLoading && !errorCarga && pedidosFiltrados.length > 0 && (
          <div className="lista-pedidos__items">
            {pedidosFiltrados.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onCambiarEstado={handleCambiarEstado}
                onCambiarPago={handleCambiarPago}
                onCancelarPedido={handleCancelarPedido}
                onPedidoEditado={() => cargarPedidos(true)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}