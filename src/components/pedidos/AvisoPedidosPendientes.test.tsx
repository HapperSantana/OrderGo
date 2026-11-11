import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AvisoPedidosPendientes } from './AvisoPedidosPendientes'

const pintar = (elemento: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{elemento}</MemoryRouter>)

describe('AvisoPedidosPendientes', () => {
  it('en la lista de pedidos la acción es un BOTÓN (solo cambia los filtros)', () => {
    const html = pintar(<AvisoPedidosPendientes cantidad={2} masAntiguo="2026-11-07" onVer={() => {}} />)
    expect(html).toMatch(/<button type="button" class="boton boton--secundario aviso-pendientes__boton">Ver pedidos sin entregar<\/button>/)
    expect(html).not.toContain('<a ')
  })

  it('en el panel la acción es un ENLACE a la vista "Sin entregar" (cambia de pantalla)', () => {
    const html = pintar(<AvisoPedidosPendientes cantidad={2} masAntiguo="2026-11-07" destino="/pedidos?vista=sin-entregar" />)
    expect(html).toMatch(/<a class="boton boton--secundario aviso-pendientes__boton" href="\/pedidos\?vista=sin-entregar"[^>]*>Ver pedidos sin entregar<\/a>/)
    expect(html).not.toContain('<button')
  })

  it('se anuncia como estado (role="status") y su ícono es decorativo', () => {
    const html = pintar(<AvisoPedidosPendientes cantidad={2} masAntiguo="2026-11-07" onVer={() => {}} />)
    expect(html).toContain('role="status"')
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it('el texto va en plural, con la fecha del más antiguo en español', () => {
    const html = pintar(<AvisoPedidosPendientes cantidad={2} masAntiguo="2026-11-07" onVer={() => {}} />)
    expect(html).toContain('Tienes 2 pedidos de días anteriores sin entregar.')
    expect(html).toContain('El más antiguo es del 7 de noviembre.')
  })

  it('en singular, y sin la frase del más antiguo si no se conoce la fecha', () => {
    const html = pintar(<AvisoPedidosPendientes cantidad={1} masAntiguo={null} onVer={() => {}} />)
    expect(html).toContain('Tienes 1 pedido de un día anterior sin entregar.')
    expect(html).not.toContain('El más antiguo')
  })
})
