import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { ETIQUETAS_ESTADO, ETIQUETAS_METODO_PAGO } from '../../types/pedido'
import type { EstadoPedido, MetodoPago } from '../../types/pedido'
import { formatearMoneda } from '../../utils/dinero'
import { calcularResumen, porcentaje, rangoDelPeriodo } from '../../utils/resumenPanel'
import type { PedidoParaResumen, Periodo } from '../../utils/resumenPanel'
import { BarrasDistribucion } from './BarrasDistribucion'
import type { ItemBarra } from './BarrasDistribucion'
import { ResumenCard } from './ResumenCard'
import { SelectorPeriodo } from './SelectorPeriodo'
import { Banknote, ChartColumn, CircleCheck, ClipboardList, Clock, Wallet } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'

const ESTADOS: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado']
const METODOS: MetodoPago[] = ['efectivo', 'tarjeta', 'transferencia', 'otro']

// Texto que aclara qué fechas abarca el periodo elegido.
function describirRango(periodo: Periodo, desde: Date, hasta: Date): string {
  const formato = (fecha: Date, opciones: Intl.DateTimeFormatOptions) => fecha.toLocaleDateString('es-MX', opciones)
  if (periodo === 'hoy') return formato(desde, { weekday: 'long', day: 'numeric', month: 'long' })
  if (periodo === 'semana') {
    const corto: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
    return `Del ${formato(desde, corto)} al ${formato(hasta, corto)}`
  }
  return formato(desde, { month: 'long', year: 'numeric' })
}

export function PanelPrincipal() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [pedidos, setPedidos] = useState<PedidoParaResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cada petición lleva un número: si el usuario cambia de periodo rápido, la
  // respuesta de una petición vieja se descarta para no pintar datos de otro periodo.
  const ultimaPeticion = useRef(0)

  const cargar = useCallback(
    async (silencioso = false) => {
      const numero = ++ultimaPeticion.current
      if (!silencioso) setIsLoading(true)
      setError(null)

      // El filtro por fechas se hace en el servidor (solo se descargan los pedidos
      // del periodo). Los límites son las medianoches locales del usuario.
      const { desde, hasta } = rangoDelPeriodo(periodo)
      const { data, error: errorConsulta } = await supabase
        .from('pedidos')
        .select('estado, estado_pago, metodo_pago, total')
        .gte('created_at', desde.toISOString())
        .lte('created_at', hasta.toISOString())

      if (numero !== ultimaPeticion.current) return

      if (errorConsulta) {
        setError('No se pudo cargar el resumen. Intenta de nuevo más tarde.')
      } else {
        setPedidos((data ?? []) as PedidoParaResumen[])
      }
      setIsLoading(false)
    },
    [periodo],
  )

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Tiempo real: ante cualquier cambio en los pedidos del propietario, el panel
  // se recalcula solo y sin mostrar "Cargando…" (igual que la lista de pedidos).
  useEffect(() => {
    if (!user) return

    const canal = supabase
      .channel('panel-cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `owner_id=eq.${user.id}` },
        () => {
          void cargar(true)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [user, cargar])

  const resumen = useMemo(() => calcularResumen(pedidos), [pedidos])
  const rango = rangoDelPeriodo(periodo)
  const totalPedidosConCancelados = resumen.pedidos + resumen.cancelados

  const barrasEstado: ItemBarra[] = ESTADOS.map((estado) => ({
    clave: estado,
    etiqueta: ETIQUETAS_ESTADO[estado],
    valor: resumen.porEstado[estado],
    texto: String(resumen.porEstado[estado]),
    claseColor: `barra--${estado}`,
  }))

  const barrasMetodo: ItemBarra[] = METODOS.map((metodo) => ({
    clave: metodo,
    etiqueta: ETIQUETAS_METODO_PAGO[metodo],
    valor: resumen.ingresosPorMetodo[metodo],
    texto: `${formatearMoneda(resumen.ingresosPorMetodo[metodo])} · ${porcentaje(resumen.ingresosPorMetodo[metodo], resumen.ingresos)}%`,
    claseColor: `barra--${metodo}`,
  }))
  // Solo aparece si todavía quedan pedidos antiguos pagados sin método.
  if (resumen.ingresosSinMetodo > 0) {
    barrasMetodo.push({
      clave: 'sin_metodo',
      etiqueta: 'Sin método',
      valor: resumen.ingresosSinMetodo,
      texto: `${formatearMoneda(resumen.ingresosSinMetodo)} · ${porcentaje(resumen.ingresosSinMetodo, resumen.ingresos)}%`,
      claseColor: 'barra--sin_metodo',
    })
  }

  const { cantidad: cantCancelPagados, monto: montoCancelPagados } = resumen.canceladosPagados

  return (
    <div className="panel">
      <div className="panel__encabezado">
        <SelectorPeriodo periodo={periodo} onCambiar={setPeriodo} />
        <p className="panel__rango">{describirRango(periodo, rango.desde, rango.hasta)}</p>
      </div>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {isLoading && <p className="panel__estado">Cargando resumen…</p>}

      {!isLoading && !error && (
        <>
          <div className="panel__tarjetas">
            <ResumenCard
              icono={ClipboardList}
              titulo="Pedidos"
              valor={String(resumen.pedidos)}
              detalle={
                resumen.cancelados > 0
                  ? `No incluye ${resumen.cancelados} ${resumen.cancelados === 1 ? 'cancelado' : 'cancelados'}`
                  : undefined
              }
            />
            <ResumenCard icono={Clock} titulo="Sin entregar" valor={String(resumen.sinEntregar)} detalle="Pendientes, en preparación o listos" />
            <ResumenCard icono={CircleCheck} titulo="Entregados" valor={String(resumen.entregados)} />
            <ResumenCard
              icono={Banknote}
              titulo="Ingresos"
              valor={formatearMoneda(resumen.ingresos)}
              detalle="Pedidos pagados, sin contar cancelados"
              destacada
            />
          </div>

          {cantCancelPagados > 0 && (
            <p className="panel__aviso" role="note">
              <strong>
                {cantCancelPagados} {cantCancelPagados === 1 ? 'pedido cancelado ya estaba pagado' : 'pedidos cancelados ya estaban pagados'}
              </strong>{' '}
              por {formatearMoneda(montoCancelPagados)}. No suma{cantCancelPagados === 1 ? '' : 'n'} a los ingresos; revisa si
              hay que devolver el dinero.
            </p>
          )}

          {totalPedidosConCancelados === 0 ? (
            <p className="panel__estado">No hay pedidos en este periodo.</p>
          ) : (
            <div className="panel__secciones">
              <section className="tarjeta">
                <TituloSeccion className="panel__subtitulo" icono={ChartColumn}>
                  Pedidos por estado
                </TituloSeccion>
                <BarrasDistribucion items={barrasEstado} ariaLabel="Pedidos por estado" />
              </section>

              <section className="tarjeta">
                <TituloSeccion className="panel__subtitulo" icono={Wallet}>
                  Ingresos por método de pago
                </TituloSeccion>
                {resumen.ingresos === 0 ? (
                  <p className="panel__estado panel__estado--compacto">Todavía no hay pedidos pagados en este periodo.</p>
                ) : (
                  <BarrasDistribucion items={barrasMetodo} ariaLabel="Ingresos por método de pago" />
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
