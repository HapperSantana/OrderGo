import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { EstadoPedido } from '../../types/pedido'
import { AvisoWhatsApp } from './AvisoWhatsApp'

const pedido = (estado: EstadoPedido, cliente: { telefono?: string; acepta_whatsapp?: boolean } | null = {}) => ({
  estado,
  cliente: cliente ? { id: 'c1', nombre: 'María López', telefono: '33 1234 5678', acepta_whatsapp: true, ...cliente } : null,
})
const pintar = (p: ReturnType<typeof pedido>) => renderToStaticMarkup(<AvisoWhatsApp pedido={p} />)

describe('AvisoWhatsApp (CC14)', () => {
  it('con el pedido Listo y el consentimiento del cliente, ofrece un ENLACE que abre WhatsApp con el mensaje', () => {
    const html = pintar(pedido('listo'))
    expect(html).toMatch(/<a [^>]*href="https:\/\/wa\.me\/523312345678\?text=/)
    expect(decodeURIComponent(html.match(/text=([^"]+)"/)![1])).toBe('Hola María López, tu pedido ya está listo. Gracias por tu preferencia.')
  })

  it('el enlace se abre en una pestaña nueva y de forma segura', () => {
    const html = pintar(pedido('listo'))
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('un lector de pantalla oye a quién se avisa y que se abre una pestaña nueva; el ícono es decorativo', () => {
    const html = pintar(pedido('listo'))
    expect(html).toContain('Avisar por WhatsApp')
    expect(html).toContain('a María López (se abre en una pestaña nueva)')
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it.each(['pendiente', 'en_preparacion', 'entregado', 'cancelado'] as EstadoPedido[])('con el pedido en "%s" no aparece nada', (estado) => {
    expect(pintar(pedido(estado))).toBe('')
  })

  it('SIN consentimiento del cliente no aparece nada (decisión del Product Owner)', () => {
    expect(pintar(pedido('listo', { acepta_whatsapp: false }))).toBe('')
    expect(pintar(pedido('listo', { acepta_whatsapp: undefined }))).toBe('')
  })

  it('si el cliente fue eliminado, no aparece nada', () => {
    expect(pintar(pedido('listo', null))).toBe('')
  })

  it('con consentimiento pero con un teléfono que no sirve, no hay enlace y se explica por qué', () => {
    const html = pintar(pedido('listo', { telefono: '123' }))
    expect(html).not.toContain('<a ')
    expect(html).toContain('No se puede avisar por WhatsApp')
    expect(html).toContain('María López')
  })

  it('un cliente de otro país usa su propio código', () => {
    expect(pintar(pedido('listo', { telefono: '+1 415 555 2671' }))).toContain('https://wa.me/14155552671?text=')
  })
})
