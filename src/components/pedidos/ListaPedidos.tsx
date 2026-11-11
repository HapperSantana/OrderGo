import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useCambioDeDia } from '../../hooks/useCambioDeDia'
import type { EstadoPedido, Pedido } from '../../types/pedido'
import { cambiosDePago } from '../../utils/pago'
import type { ValorPago } from '../../utils/pago'
import { crearFiltrosIniciales, filtrarPedidos, filtrosDeVista, filtrosParaVerSinEntregar, sonFiltrosIniciales } from '../../utils/filtrosPedidos'
import type { FiltrosPedidos as Filtros } from '../../utils/filtrosPedidos'
import { resumirPendientesAnteriores } from '../../utils/pedidosPendientes'
import { AvisoPedidosPendientes } from './AvisoPedidosPendientes'
import { FiltrosPedidos } from './FiltrosPedidos'
import { NuevoPedidoForm } from './NuevoPedidoForm'
import { PedidoCard } from './PedidoCard'
import { ListChecks } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'

export function ListaPedidos() {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
    // CC08: si se llega desde el aviso del panel (/pedidos?vista=sin-entregar), la lista abre ya en esa vista.
  const [parametros] = useSearchParams()
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosDeVista(parametros.get('vista')))

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
      .select('*, cliente:clientes(id, nombre, telefono, acepta_whatsapp), detalle_pedido(*)')
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

    // CC10: si la aplicación sigue abierta cuando pasa la medianoche, la vista de hoy avanza sola al día nuevo.
  // Solo se mueven los filtros si la persona los había dejado como "hoy" (sin tocar nada): si puso sus propios
  // filtros (otras fechas, un cliente, un estado), se respetan. También se vuelve a pedir la lista.
  const hoy = useCambioDeDia((nuevaFecha, fechaAnterior) => {
    setFiltros((actuales) => (sonFiltrosIniciales(actuales, fechaAnterior) ? crearFiltrosIniciales(nuevaFecha) : actuales))
    void cargarPedidos(true)
  })

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
      // P0001 = mensaje escrito a mano en el servidor, ya pensado para el usuario (por ejemplo, CC09: un pedido
      // entregado no cambia de estado). Si pasó, esta pantalla estaba desactualizada (el pedido se entregó desde
      // otra pestaña o dispositivo), así que se vuelve a pedir la lista para mostrar el estado real.
      if (error.code === 'P0001') {
        setErrorAccion(error.message)
        void cargarPedidos(true)
      } else {
        setErrorAccion('No se pudo guardar el cambio. Intenta de nuevo.')
      }
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

    // CC08: aviso de pedidos de días anteriores que siguen sin entregar. Solo se muestra en la vista de hoy (que
  // es donde se olvidan); si la persona ya puso sus propios filtros, está explorando por su cuenta.
  const pendientesAnteriores = useMemo(() => resumirPendientesAnteriores(pedidos, hoy), [pedidos, hoy])
  const enVistaDeHoy = sonFiltrosIniciales(filtros, hoy)
  const mostrarAviso = !isLoading && !errorCarga && enVistaDeHoy && pendientesAnteriores.cantidad > 0

  // Al pulsar "Ver pedidos sin entregar" el aviso desaparece (los filtros dejan de ser los de hoy): el foco se
  // lleva al resumen de resultados para que no se pierda y un lector de pantalla anuncie lo que se muestra.
  const conteoRef = useRef<HTMLSpanElement>(null)
  const enfocarResumen = useRef(false)
  useEffect(() => {
    if (enfocarResumen.current && !enVistaDeHoy) {
      enfocarResumen.current = false
      conteoRef.current?.focus()
    }
  }, [enVistaDeHoy, filtros])

  function verPedidosSinEntregar() {
    enfocarResumen.current = true
    // Sin límite de fechas: todos los pedidos en proceso, de hoy y de días anteriores.
    setFiltros(filtrosParaVerSinEntregar(hoy))
  }

  return (
    <div className="pagina-pedidos">
      <NuevoPedidoForm onPedidoCreado={() => cargarPedidos(true)} />

      <section className="tarjeta lista-pedidos">
        <div className="lista-pedidos__encabezado">
          <TituloSeccion icono={ListChecks}>Pedidos registrados</TituloSeccion>
        </div>

        {mostrarAviso && (
          <AvisoPedidosPendientes cantidad={pendientesAnteriores.cantidad} masAntiguo={pendientesAnteriores.masAntiguo} onVer={verPedidosSinEntregar} />
        )}

        {!isLoading && !errorCarga && pedidos.length > 0 && (
          <FiltrosPedidos
            hoy={hoy}
            refConteo={conteoRef}
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
            {enVistaDeHoy
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
