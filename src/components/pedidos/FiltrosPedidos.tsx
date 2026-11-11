import { ETIQUETAS_ESTADO, ETIQUETAS_METODO_PAGO, ETIQUETAS_PAGO } from '../../types/pedido'
import type { EstadoPago, EstadoPedido, MetodoPago } from '../../types/pedido'
import { crearFiltrosIniciales, sonFiltrosIniciales } from '../../utils/filtrosPedidos'
import type { FiltrosPedidos as Filtros } from '../../utils/filtrosPedidos'
import { Search } from 'lucide-react'
import type { Ref } from 'react'
import { CampoConIcono } from '../ui/CampoConIcono'

const ESTADOS = Object.keys(ETIQUETAS_ESTADO) as EstadoPedido[]
const ESTADOS_PAGO = Object.keys(ETIQUETAS_PAGO) as EstadoPago[]
const METODOS = Object.keys(ETIQUETAS_METODO_PAGO) as MetodoPago[]

interface FiltrosPedidosProps {
  filtros: Filtros
  onCambiar: (filtros: Filtros) => void
  totalMostrados: number
  totalPedidos: number
    // Hoy ("AAAA-MM-DD"): lo entrega quien usa este componente para que, al cambiar el día (CC10), todo avance junto.
  hoy: string
  // Para llevar el foco al resumen cuando los filtros cambian desde fuera (por ejemplo, desde el aviso de CC08).
  refConteo?: Ref<HTMLSpanElement>
}

export function FiltrosPedidos({ filtros, onCambiar, totalMostrados, totalPedidos, hoy, refConteo }: FiltrosPedidosProps) {
  function actualizar<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    const nuevos = { ...filtros, [campo]: valor }
    // El método de pago solo existe en pedidos pagados: si se filtran los
    // pedidos con pago pendiente, el filtro de método ya no tiene sentido.
    if (campo === 'pago' && valor === 'pendiente') nuevos.metodo = 'todos'
    onCambiar(nuevos)
  }

  const esVistaInicial = sonFiltrosIniciales(filtros, hoy)

  const conteo = esVistaInicial
    ? `${totalMostrados} ${totalMostrados === 1 ? 'pedido' : 'pedidos'} de hoy`
    : `Mostrando ${totalMostrados} de ${totalPedidos} pedidos`

  return (
    <div className="filtros-pedidos">
      <label className="campo filtros-pedidos__cliente">
        <span className="campo__etiqueta">Cliente</span>
        <CampoConIcono icono={Search}>
          <input
            type="search"
            placeholder="Nombre o teléfono…"
            value={filtros.cliente}
            onChange={(evento) => actualizar('cliente', evento.target.value)}
          />
        </CampoConIcono>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Estado</span>
        <select value={filtros.estado} onChange={(evento) => actualizar('estado', evento.target.value as Filtros['estado'])}>
          <option value="todos">Todos</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETAS_ESTADO[estado]}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Pago</span>
        <select value={filtros.pago} onChange={(evento) => actualizar('pago', evento.target.value as Filtros['pago'])}>
          <option value="todos">Todos</option>
          {ESTADOS_PAGO.map((pago) => (
            <option key={pago} value={pago}>
              {ETIQUETAS_PAGO[pago]}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Método de pago</span>
        <select
          value={filtros.metodo}
          disabled={filtros.pago === 'pendiente'}
          title={filtros.pago === 'pendiente' ? 'Solo aplica a pedidos pagados' : undefined}
          onChange={(evento) => actualizar('metodo', evento.target.value as Filtros['metodo'])}
        >
          <option value="todos">Todos</option>
          <option value="sin_entregar">Sin entregar</option>
          {METODOS.map((metodo) => (
            <option key={metodo} value={metodo}>
              {ETIQUETAS_METODO_PAGO[metodo]}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Desde</span>
        <input
          type="date"
          value={filtros.desde}
          max={filtros.hasta || undefined}
          onChange={(evento) => actualizar('desde', evento.target.value)}
        />
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Hasta</span>
        <input
          type="date"
          value={filtros.hasta}
          min={filtros.desde || undefined}
          onChange={(evento) => actualizar('hasta', evento.target.value)}
        />
      </label>

      <div className="filtros-pedidos__pie">
          <span className="filtros-pedidos__conteo" aria-live="polite" ref={refConteo} tabIndex={-1}>
          {conteo}
        </span>
        {!esVistaInicial && (
          <button type="button" className="boton boton--enlace" onClick={() => onCambiar(crearFiltrosIniciales(hoy))}>
            Volver a hoy
          </button>
        )}
      </div>
    </div>
  )
}
