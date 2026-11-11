import { BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'
import { describirDia, tituloAvisoPendientes } from '../../utils/pedidosPendientes'

// El aviso puede llevar a la vista "Sin entregar" de dos maneras: como BOTÓN (dentro de la lista de pedidos, que
// solo cambia sus filtros) o como ENLACE (en el panel, que cambia de pantalla). Un enlace es lo correcto cuando
// la acción navega: se puede abrir en otra pestaña y un lector de pantalla lo anuncia como enlace.
type Accion = { onVer: () => void; destino?: never } | { destino: string; onVer?: never }

type AvisoPedidosPendientesProps = Accion & {
  cantidad: number
  // Fecha ("AAAA-MM-DD") del pedido sin entregar más antiguo.
  masAntiguo: string | null
}

// CC08: aviso de que hay pedidos de días anteriores sin entregar (la vista de hoy no los muestra).
// role="status": cuando aparece de pronto (por ejemplo, al pasar la medianoche), un lector de pantalla lo anuncia.
export function AvisoPedidosPendientes({ cantidad, masAntiguo, onVer, destino }: AvisoPedidosPendientesProps) {
  const clases = 'boton boton--secundario aviso-pendientes__boton'
  return (
    <div className="aviso-pendientes" role="status">
      <BellRing className="aviso-pendientes__icono" size={22} strokeWidth={1.75} aria-hidden="true" focusable="false" />
      <p className="aviso-pendientes__texto">
        <strong>{tituloAvisoPendientes(cantidad)}.</strong>
        {masAntiguo && <> El más antiguo es del {describirDia(masAntiguo)}.</>}
      </p>
      {destino ? (
        <Link className={clases} to={destino}>
          Ver pedidos sin entregar
        </Link>
      ) : (
        <button type="button" className={clases} onClick={onVer}>
          Ver pedidos sin entregar
        </button>
      )}
    </div>
  )
}