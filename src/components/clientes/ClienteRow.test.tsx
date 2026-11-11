import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Cliente } from '../../types/cliente'
import { ClienteRow } from './ClienteRow'

const cliente = (cambios: Partial<Cliente> = {}): Cliente => ({
  id: 'c1', owner_id: 'u1', nombre: 'María López', telefono: '33 1234 5678', direccion: null, notas: null,
  created_at: '2026-10-01T12:00:00Z', acepta_whatsapp: false, acepta_whatsapp_en: null, ...cambios,
})
const pintar = (c: Cliente, guardando = false) => renderToStaticMarkup(<table><tbody><ClienteRow cliente={c} guardando={guardando} onCambiarWhatsapp={() => {}} /></tbody></table>)

describe('ClienteRow — consentimiento de WhatsApp (CC14)', () => {
  it('un cliente sin consentimiento muestra la casilla SIN marcar', () => {
    const html = pintar(cliente())
    expect(html).toMatch(/<input type="checkbox"/)
    expect(html).not.toContain('checked=""')
    expect(html).toContain('title="Sin consentimiento registrado"')
  })

  it('un cliente con consentimiento muestra la casilla marcada y desde cuándo', () => {
    const html = pintar(cliente({ acepta_whatsapp: true, acepta_whatsapp_en: new Date(2026, 10, 7, 12).toISOString() }))
    expect(html).toContain('checked=""')
    expect(html).toContain('Consentimiento registrado el 7 de noviembre de 2026')
  })

  it('la casilla tiene nombre accesible propio (dice a qué cliente se refiere) que incluye su texto visible', () => {
    const html = pintar(cliente())
    expect(html).toContain('aria-label="Acepta avisos por WhatsApp: María López"')
    expect(html).toContain('<span>Si</span>') // texto visible contenido en el nombre accesible (WCAG 2.5.3)
  })

  it('mientras se guarda el cambio la casilla queda bloqueada', () => {
    expect(pintar(cliente(), true)).toContain('disabled=""')
    expect(pintar(cliente(), false)).not.toContain('disabled=""')
  })
})
