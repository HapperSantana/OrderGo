// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { violacionesDeAccesibilidad } from '../../pruebas/axe'
import { ClienteForm } from './ClienteForm'

const casilla = () => screen.getByRole('checkbox', { name: /El cliente aceptó recibir avisos/ })
async function llenar(u: ReturnType<typeof userEvent.setup>, nombre = 'Laura Díaz', telefono = '33 5555 6666') {
  await u.type(screen.getByPlaceholderText('Nombre del cliente'), nombre)
  await u.type(screen.getByPlaceholderText('Ej. 33 1234 5678'), telefono)
}

describe('ClienteForm (alta de clientes y consentimiento de WhatsApp, CC14)', () => {
  it('la casilla del consentimiento empieza SIN marcar (el permiso nunca se da por supuesto)', () => {
    render(<ClienteForm onGuardar={vi.fn()} />)
    expect(casilla()).not.toBeChecked()
  })

  it('el nombre y el teléfono son obligatorios', async () => {
    const u = userEvent.setup()
    const alGuardar = vi.fn()
    render(<ClienteForm onGuardar={alGuardar} />)
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre y el teléfono son obligatorios.')
    expect(alGuardar).not.toHaveBeenCalled()
  })

  it('sin marcar la casilla, guarda acepta_whatsapp = false', async () => {
    const u = userEvent.setup()
    const alGuardar = vi.fn().mockResolvedValue({ error: null })
    render(<ClienteForm onGuardar={alGuardar} />)
    await llenar(u)
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(alGuardar).toHaveBeenCalledWith({ nombre: 'Laura Díaz', telefono: '33 5555 6666', direccion: undefined, notas: undefined, acepta_whatsapp: false })
  })

  it('con la casilla marcada, guarda acepta_whatsapp = true', async () => {
    const u = userEvent.setup()
    const alGuardar = vi.fn().mockResolvedValue({ error: null })
    render(<ClienteForm onGuardar={alGuardar} />)
    await llenar(u)
    await u.click(casilla())
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(alGuardar.mock.calls[0][0].acepta_whatsapp).toBe(true)
  })

  it('recorta espacios y manda dirección y notas solo si se escribieron', async () => {
    const u = userEvent.setup()
    const alGuardar = vi.fn().mockResolvedValue({ error: null })
    render(<ClienteForm onGuardar={alGuardar} />)
    await llenar(u, '  Laura Díaz  ', '  33 5555 6666 ')
    await u.type(screen.getByPlaceholderText('Opcional'), ' Calle 1 ')
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(alGuardar.mock.calls[0][0]).toMatchObject({ nombre: 'Laura Díaz', telefono: '33 5555 6666', direccion: 'Calle 1', notas: undefined })
  })

  it('tras guardar, el formulario queda limpio y la casilla SIN marcar (el siguiente cliente no hereda el permiso)', async () => {
    const u = userEvent.setup()
    render(<ClienteForm onGuardar={vi.fn().mockResolvedValue({ error: null })} />)
    await llenar(u)
    await u.click(casilla())
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    await waitFor(() => expect(screen.getByPlaceholderText('Nombre del cliente')).toHaveValue(''))
    expect(screen.getByPlaceholderText('Ej. 33 1234 5678')).toHaveValue('')
    expect(casilla()).not.toBeChecked()
  })

  it('si falla el guardado, muestra el mensaje y CONSERVA lo escrito (incluida la casilla)', async () => {
    const u = userEvent.setup()
    render(<ClienteForm onGuardar={vi.fn().mockResolvedValue({ error: 'Ya existe un cliente registrado con este teléfono: "Ana".' })} />)
    await llenar(u)
    await u.click(casilla())
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un cliente registrado')
    expect(screen.getByPlaceholderText('Nombre del cliente')).toHaveValue('Laura Díaz')
    expect(casilla()).toBeChecked()
  })

  it('dos envíos seguidos guardan UN solo cliente (sin el error confuso de "ya existe" después de un éxito)', async () => {
    const u = userEvent.setup()
    let terminar: (valor: { error: null }) => void = () => {}
    const alGuardar = vi.fn(() => new Promise<{ error: null }>((resolver) => (terminar = resolver)))
    render(<ClienteForm onGuardar={alGuardar} />)
    await llenar(u)
    const formulario = screen.getByRole('button', { name: 'Guardar cliente' }).closest('form') as HTMLFormElement
    act(() => {
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await act(async () => terminar({ error: null }))
    expect(alGuardar).toHaveBeenCalledTimes(1)
  })

  it('no tiene problemas de accesibilidad (axe), ni con el error visible', async () => {
    const u = userEvent.setup()
    const { container } = render(<ClienteForm onGuardar={vi.fn()} />)
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
    await u.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
  })
})
