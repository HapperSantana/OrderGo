// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { violacionesDeAccesibilidad } from '../../pruebas/axe'
import { AuthLayout } from '../layout/AuthLayout'

const { signIn, navegar } = vi.hoisted(() => ({ signIn: vi.fn(), navegar: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ signIn }) }))
vi.mock('react-router-dom', async (importarOriginal) => ({ ...(await importarOriginal<typeof import('react-router-dom')>()), useNavigate: () => navegar }))
import { LoginForm } from './LoginForm'

const pintar = () =>
  render(
    <MemoryRouter>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </MemoryRouter>,
  )

beforeEach(() => {
  signIn.mockReset()
  navegar.mockReset()
  signIn.mockResolvedValue({ error: null })
})

describe('Inicio de sesión — estructura accesible (HU10)', () => {
  it('la página tiene UNA zona principal y UN título principal (h1) visibles para un lector de pantalla', () => {
    pintar()
    const principal = screen.getByRole('main')
    expect(within(principal).getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('el panel de marca es decorativo (aria-hidden) y no aporta ningún encabezado ni zona', () => {
    const { container } = pintar()
    const panel = container.querySelector('aside')
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(panel?.querySelector('h1, h2, h3, main')).toBeNull()
  })

  it('el formulario no tiene problemas de accesibilidad (axe)', async () => {
    const { container } = pintar()
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
  })
})

describe('Inicio de sesión — comportamiento', () => {
  it('con credenciales correctas entra a Pedidos y no deja un paso atrás en el historial (replace)', async () => {
    const u = userEvent.setup()
    pintar()
    await u.type(screen.getByLabelText('Correo electrónico'), '  ana@test.com ')
    await u.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await u.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(signIn).toHaveBeenCalledWith('ana@test.com', 'secreto123')
    expect(navegar).toHaveBeenCalledWith('/pedidos', { replace: true })
  })

  it('con credenciales incorrectas muestra el mensaje y no navega', async () => {
    const u = userEvent.setup()
    signIn.mockResolvedValue({ error: 'Correo o contraseña incorrectos.' })
    pintar()
    await u.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await u.type(screen.getByLabelText('Contraseña'), 'mala')
    await u.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(navegar).not.toHaveBeenCalled()
  })

  it('dos envíos seguidos inician sesión UNA sola vez', async () => {
    const u = userEvent.setup()
    let terminar: (valor: { error: null }) => void = () => {}
    signIn.mockImplementation(() => new Promise((resolver) => (terminar = resolver)))
    pintar()
    await u.type(screen.getByLabelText('Correo electrónico'), 'ana@test.com')
    await u.type(screen.getByLabelText('Contraseña'), 'secreto123')
    const formulario = screen.getByRole('button', { name: 'Iniciar sesión' }).closest('form') as HTMLFormElement
    act(() => {
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await act(async () => terminar({ error: null }))
    expect(signIn).toHaveBeenCalledTimes(1)
  })
})
