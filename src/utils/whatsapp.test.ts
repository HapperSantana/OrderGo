import { describe, expect, it } from 'vitest'
import { enlaceAvisoListo, enlaceWhatsApp, mensajeAvisoListo, telefonoParaWhatsApp } from './whatsapp'

describe('telefonoParaWhatsApp — teléfonos de México', () => {
  it.each([
    ['3312345678', '523312345678'],
    ['33 1234 5678', '523312345678'],
    ['33-1234-5678', '523312345678'],
    ['(33) 1234 5678', '523312345678'],
    ['  33.1234.5678  ', '523312345678'],
    ['55 9876 5432', '525598765432'],
  ])('10 dígitos, escritos como sea: "%s" -> %s', (entrada, esperado) => {
    expect(telefonoParaWhatsApp(entrada)).toBe(esperado)
  })

  it.each([
    ['+52 33 1234 5678', '523312345678'],
    ['+523312345678', '523312345678'],
    ['+52 (33) 1234-5678', '523312345678'],
    ['52 33 1234 5678', '523312345678'],
    ['523312345678', '523312345678'],
    ['0052 33 1234 5678', '523312345678'],
  ])('ya con código de país: "%s" -> %s', (entrada, esperado) => {
    expect(telefonoParaWhatsApp(entrada)).toBe(esperado)
  })

  it.each([
    ['+52 1 33 1234 5678', '523312345678'],
    ['5213312345678', '523312345678'],
    ['+5213312345678', '523312345678'],
  ])('formato antiguo de celular con "1" (+52 1…): "%s" -> %s (se quita el 1)', (entrada, esperado) => {
    expect(telefonoParaWhatsApp(entrada)).toBe(esperado)
  })

  it.each([
    ['044 33 1234 5678', '523312345678'],
    ['045 33 1234 5678', '523312345678'],
    ['01 33 1234 5678', '523312345678'],
    ['01-33-1234-5678', '523312345678'],
  ])('prefijos de marcación viejos (044, 045, 01): "%s" -> %s', (entrada, esperado) => {
    expect(telefonoParaWhatsApp(entrada)).toBe(esperado)
  })
})

describe('telefonoParaWhatsApp — otros países', () => {
  it.each([
    ['+1 415 555 2671', '14155552671'],
    ['+34 612 34 56 78', '34612345678'],
    ['+57 300 123 4567', '573001234567'],
    ['001 415 555 2671', '14155552671'],
  ])('con "+" o "00" se respeta el código de país: "%s" -> %s', (entrada, esperado) => {
    expect(telefonoParaWhatsApp(entrada)).toBe(esperado)
  })

  it('un número extranjero demasiado largo o corto no se acepta', () => {
    expect(telefonoParaWhatsApp('+1 234')).toBeNull()
    expect(telefonoParaWhatsApp('+1 234 567 890 123 456 789')).toBeNull()
  })
})

describe('telefonoParaWhatsApp — lo que NO se puede convertir (mejor ningún aviso que uno a otra persona)', () => {
  it.each([
    [''],
    ['   '],
    ['sin teléfono'],
    ['123'],
    ['1234567'], // 7 dígitos: teléfono local sin lada
    ['331234567'], // 9 dígitos
    ['33123456789'], // 11 dígitos sin explicación
    ['+52 33 1234 567'], // México con un dígito de menos
    ['+52 33 1234 56789'], // México con un dígito de más
    ['+52'],
  ])('"%s" -> null', (entrada) => {
    expect(telefonoParaWhatsApp(entrada)).toBeNull()
  })

  it('un teléfono con una etiqueta de texto se interpreta por sus dígitos', () => {
    expect(telefonoParaWhatsApp('Cel: 33 1234 5678')).toBe('523312345678')
    expect(telefonoParaWhatsApp('33 1234 5678 (casa)')).toBe('523312345678')
  })

  it('con dígitos de más (por ejemplo, una extensión) se rechaza en lugar de adivinar', () => {
    expect(telefonoParaWhatsApp('33 1234 5678 ext 12')).toBeNull()
    expect(telefonoParaWhatsApp('33 1234 5678 / 33 8765 4321')).toBeNull()
  })
})

describe('telefonoParaWhatsApp — el resultado siempre es válido', () => {
  it('cuando devuelve algo, son solo dígitos y sin ceros ni "+" al inicio', () => {
    const entradas = ['33 1234 5678', '+52 1 33 1234 5678', '044 33 1234 5678', '+1 415 555 2671', '0052 33 1234 5678', '01 33 1234 5678']
    for (const entrada of entradas) {
      const numero = telefonoParaWhatsApp(entrada)
      expect(numero, entrada).toMatch(/^[1-9]\d{7,14}$/)
    }
  })

  it('un número mexicano siempre sale con exactamente 12 dígitos (52 + 10)', () => {
    for (const entrada of ['33 1234 5678', '+52 1 33 1234 5678', '044 33 1234 5678', '52 33 1234 5678']) {
      expect(telefonoParaWhatsApp(entrada)).toHaveLength(12)
    }
  })
})

describe('mensajeAvisoListo', () => {
  it('usa el texto aprobado por el Product Owner', () => {
    expect(mensajeAvisoListo('María López')).toBe('Hola María López, tu pedido ya está listo. Gracias por tu preferencia.')
  })

  it('recorta espacios del nombre y, sin nombre, saluda sin él', () => {
    expect(mensajeAvisoListo('  Juan  ')).toBe('Hola Juan, tu pedido ya está listo. Gracias por tu preferencia.')
    expect(mensajeAvisoListo('   ')).toBe('Hola, tu pedido ya está listo. Gracias por tu preferencia.')
  })

  it('no lleva signos de exclamación (preferencia del cliente)', () => {
    expect(mensajeAvisoListo('Ana')).not.toMatch(/[!¡]/)
  })
})

describe('enlaces de WhatsApp', () => {
  it('arma https://wa.me/<número>?text=<mensaje codificado>', () => {
    expect(enlaceWhatsApp('523312345678', 'Hola ñ, listo & más')).toBe('https://wa.me/523312345678?text=Hola%20%C3%B1%2C%20listo%20%26%20m%C3%A1s')
  })

  it('el mensaje codificado se puede decodificar sin perder nada (tildes, comas, "&")', () => {
    const mensaje = mensajeAvisoListo('Ñandú & Hijos')
    const url = new URL(enlaceWhatsApp('523312345678', mensaje))
    expect(url.searchParams.get('text')).toBe(mensaje)
    expect(url.pathname).toBe('/523312345678')
    expect(url.host).toBe('wa.me')
  })

  it('enlaceAvisoListo junta teléfono y mensaje', () => {
    const url = new URL(enlaceAvisoListo('33 1234 5678', 'María López') as string)
    expect(url.pathname).toBe('/523312345678')
    expect(url.searchParams.get('text')).toBe('Hola María López, tu pedido ya está listo. Gracias por tu preferencia.')
  })

  it('si el teléfono no sirve, no hay enlace', () => {
    expect(enlaceAvisoListo('123', 'María')).toBeNull()
  })
})
