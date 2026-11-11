import { normalizarTelefono } from './telefono'

// CC14: aviso al cliente por WhatsApp cuando su pedido está Listo (opción "enlace de chat": la persona del negocio
// pulsa un botón, se abre WhatsApp con el chat del cliente y el mensaje ya escrito, y solo falta pulsar Enviar).

// País que se asume cuando el teléfono guardado no trae código de país (decisión del Product Owner: México).
const CODIGO_PAIS_POR_DEFECTO = '52'

// Un número internacional (E.164) tiene entre 8 y 15 dígitos contando el código de país.
const MINIMO_DIGITOS = 8
const MAXIMO_DIGITOS = 15

// Convierte el teléfono tal como se capturó ("33 1234 5678", "+52 (33) 1234-5678", "044 33 1234 5678"…) al
// formato que pide el enlace de WhatsApp: solo dígitos, con código de país y sin "+" ni ceros de marcación
// ("523312345678"). Devuelve null si no se puede estar razonablemente seguro de cuál es el número, para no
// mandar el aviso a una persona equivocada.
export function telefonoParaWhatsApp(telefono: string): string | null {
  const original = telefono.trim()
  let digitos = normalizarTelefono(original)
  if (!digitos) return null

  // ¿Ya trae código de país? Con "+" o con el prefijo internacional "00".
  let traeCodigoDePais = original.startsWith('+')
  if (!traeCodigoDePais && digitos.startsWith('00')) {
    digitos = digitos.slice(2)
    traeCodigoDePais = true
  }

  if (traeCodigoDePais) {
    if (!digitos.startsWith(CODIGO_PAIS_POR_DEFECTO)) {
      // Otro país: se respeta tal cual si tiene una longitud posible.
      return digitos.length >= MINIMO_DIGITOS && digitos.length <= MAXIMO_DIGITOS ? digitos : null
    }
    return mexicano(digitos.slice(CODIGO_PAIS_POR_DEFECTO.length), true)
  }

  // Sin "+" ni "00": es un número mexicano, con o sin el 52 delante.
  return mexicano(digitos, false)
}

// Normaliza un número de México: 52 + 10 dígitos. `restoDeUnNumeroConPais` indica que ya se quitó el 52.
function mexicano(digitos: string, restoDeUnNumeroConPais: boolean): string | null {
  let resto = digitos

  if (!restoDeUnNumeroConPais) {
    // Prefijos de marcación que se quedaron en agendas viejas: 044/045 (celular) y 01 (larga distancia).
    if (/^04[45]\d{10}$/.test(resto)) resto = resto.slice(3)
    else if (/^01\d{10}$/.test(resto)) resto = resto.slice(2)

    // Con el 52 delante: 52 + 10 dígitos (12), o el formato antiguo 521 + 10 dígitos (13).
    if (resto.length === 12 && resto.startsWith(CODIGO_PAIS_POR_DEFECTO)) resto = resto.slice(2)
    else if (resto.length === 13 && resto.startsWith(`${CODIGO_PAIS_POR_DEFECTO}1`)) resto = resto.slice(3)
  } else if (resto.length === 11 && resto.startsWith('1')) {
    // "+52 1 …": formato antiguo de los celulares mexicanos; el 1 ya no se usa.
    resto = resto.slice(1)
  }

  return resto.length === 10 ? `${CODIGO_PAIS_POR_DEFECTO}${resto}` : null
}

// Texto del aviso (aprobado por el Product Owner).
export function mensajeAvisoListo(nombre: string): string {
  const quien = nombre.trim()
  return `${quien ? `Hola ${quien}` : 'Hola'}, tu pedido ya está listo. Gracias por tu preferencia.`
}

// Enlace de chat de WhatsApp (https://wa.me/<número>?text=<mensaje>) con el mensaje ya escrito.
export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

// Enlace para avisarle a un cliente que su pedido está listo; null si su teléfono no sirve para WhatsApp.
export function enlaceAvisoListo(telefono: string, nombre: string): string | null {
  const numero = telefonoParaWhatsApp(telefono)
  return numero ? enlaceWhatsApp(numero, mensajeAvisoListo(nombre)) : null
}
