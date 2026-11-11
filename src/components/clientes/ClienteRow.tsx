import type { Cliente } from '../../types/cliente'

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface ClienteRowProps {
  cliente: Cliente
  // CC14: true mientras se guarda el cambio de consentimiento de ESTE cliente.
  guardando?: boolean
  onCambiarWhatsapp: (id: string, acepta: boolean) => void
}

export function ClienteRow({ cliente, guardando = false, onCambiarWhatsapp }: ClienteRowProps) {
  const fechaConsentimiento = cliente.acepta_whatsapp_en
    ? new Date(cliente.acepta_whatsapp_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <tr className="tabla-clientes__fila">
      <td>
        <span className="tabla-clientes__nombre">{cliente.nombre}</span>
      </td>
      <td>{cliente.telefono}</td>
      <td>{cliente.direccion || <span className="tabla-clientes__vacio">—</span>}</td>
      <td>{cliente.notas || <span className="tabla-clientes__vacio">—</span>}</td>
      <td>{formatearFecha(cliente.created_at)}</td>
      <td>
        <label className="casilla-whatsapp" title={fechaConsentimiento ? `Consentimiento registrado el ${fechaConsentimiento}` : 'Sin consentimiento registrado'}>
          <input
            type="checkbox"
            checked={cliente.acepta_whatsapp}
            disabled={guardando}
            onChange={(evento) => onCambiarWhatsapp(cliente.id, evento.target.checked)}
            aria-label={`Acepta avisos por WhatsApp: ${cliente.nombre}`}
          />
          <span>Si</span>
        </label>
      </td>
    </tr>
  )
}