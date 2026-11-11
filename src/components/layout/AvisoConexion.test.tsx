// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { violacionesDeAccesibilidad } from '../../pruebas/axe'
import { AvisoConexion } from './AvisoConexion'

// jsdom no cambia navigator.onLine por sí solo: se simula igual que el navegador, cambiando el valor y
// disparando el evento.
function ponerConexion(enLinea: boolean) {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(enLinea)
  act(() => {
    window.dispatchEvent(new Event(enLinea ? 'online' : 'offline'))
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AvisoConexion (HU10)', () => {
  it('con conexión no muestra nada', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    const { container } = render(<AvisoConexion />)
    expect(container).toBeEmptyDOMElement()
  })

  it('si la página se abre sin conexión, avisa desde el primer momento', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    render(<AvisoConexion />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión a internet')
  })

  it('al perder la conexión aparece una alerta (role="alert") que explica qué pasa', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    render(<AvisoConexion />)
    ponerConexion(false)
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Sin conexión a internet')
    expect(alerta).toHaveTextContent('los cambios no se guardarán')
  })

  it('al volver la conexión la alerta se reemplaza por un aviso amable con "Actualizar página"', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    render(<AvisoConexion />)
    ponerConexion(false)
    ponerConexion(true)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Conexión restablecida')
    expect(screen.getByRole('button', { name: 'Actualizar página' })).toBeInTheDocument()
  })

  it('el aviso de "restablecida" se puede cerrar', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    render(<AvisoConexion />)
    ponerConexion(false)
    ponerConexion(true)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso de conexión restablecida' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('un evento "online" sin haber perdido la conexión (cambio de una red a otra) NO anuncia nada', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    const { container } = render(<AvisoConexion />)
    ponerConexion(true)
    expect(container).toBeEmptyDOMElement()
  })

  it('perder la conexión otra vez retira el aviso de "restablecida"', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    render(<AvisoConexion />)
    ponerConexion(false)
    ponerConexion(true)
    ponerConexion(false)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('ninguno de los dos avisos tiene problemas de accesibilidad (axe) y sus íconos son decorativos', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    const { container } = render(<AvisoConexion />)
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    ponerConexion(true)
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
  })
})
