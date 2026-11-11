import { MessageCircle } from 'lucide-react'
import type { Pedido } from '../../types/pedido'
import { enlaceAvisoListo } from '../../utils/whatsapp'

// CC14: cuando un pedido está LISTO y su cliente aceptó recibir avisos, ofrece avisarle por WhatsApp. Es un enlace
// (no un botón): abre WhatsApp en una pestaña nueva, en el chat del cliente y con el mensaje ya escrito; la persona
// del negocio solo pulsa Enviar. No se envía nada solo.
//
// Sin consentimiento no se muestra nada. Con consentimiento pero con un teléfono que no sirve para WhatsApp,
// se explica por qué no hay botón.
export function AvisoWhatsApp({ pedido }: { pedido: Pick<Pedido, 'estado' | 'cliente'> }) {
  const cliente = pedido.cliente
  if (pedido.estado !== 'listo' || !cliente?.acepta_whatsapp) return null

  const enlace = enlaceAvisoListo(cliente.telefono, cliente.nombre)

  return (
    <div className="pedido-card__whatsapp">
      {enlace ? (
        <a className="boton boton--secundario pedido-card__whatsapp-boton" href={enlace} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={18} aria-hidden="true" focusable="false" />
          Avisar por WhatsApp
          <span className="solo-lectores"> a {cliente.nombre} (se abre en una pestaña nueva)</span>
        </a>
      ) : (
        <p className="pedido-card__whatsapp-nota">
          No se puede avisar por WhatsApp: el teléfono de {cliente.nombre} no tiene un formato válido (en México son 10 dígitos).
        </p>
      )}
    </div>
  )
}
