// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { EstadoPedido } from '../../types/pedido'
import { EstadoPedidoSelector } from './EstadoPedidoSelector'

// CC09: un pedido entregado (o cancelado) ya no cambia de estado; el selector se bloquea y lo explica.
const pintar = (estado: EstadoPedido, onCambiar = vi.fn()) => {
  render(<EstadoPedidoSelector estado={estado} onCambiar={onCambiar} />)
  return { onCambiar, selector: screen.getByRole('combobox') }
}

describe('EstadoPedidoSelector (CC09)', () => {
  it.each(['pendiente', 'en_preparacion', 'listo'] as EstadoPedido[])('en "%s" el selector está activo, sin texto extra', (estado) => {
    const { selector } = pintar(estado)
    expect(selector).toBeEnabled()
    expect(selector).not.toHaveAttribute('title')
    expect(selector).toHaveAccessibleName('Estado del pedido')
  })

  it.each([
    ['entregado', 'Un pedido entregado ya no puede cambiar de estado'],
    ['cancelado', 'Un pedido cancelado ya no puede cambiar de estado'],
  ] as [EstadoPedido, string][])('en "%s" está BLOQUEADO y explica por qué (cursor y lector de pantalla)', (estado, motivo) => {
    const { selector } = pintar(estado)
    expect(selector).toBeDisabled()
    expect(selector).toHaveAttribute('title', motivo)
    expect(selector).toHaveAccessibleName(`Estado del pedido. ${motivo}`)
  })

  it('al elegir otro estado avisa con ese valor', async () => {
    const { onCambiar, selector } = pintar('pendiente')
    await userEvent.selectOptions(selector, 'listo')
    expect(onCambiar).toHaveBeenCalledWith('listo')
  })

  it('un selector bloqueado no deja cambiar el estado ni siquiera si se intenta', async () => {
    const { onCambiar, selector } = pintar('entregado')
    await userEvent.selectOptions(selector, 'pendiente')
    expect(onCambiar).not.toHaveBeenCalled()
  })

  it('un clic en el selector no expande la tarjeta que lo contiene (detiene la propagación)', async () => {
    const alClicTarjeta = vi.fn()
    render(
      <div onClick={alClicTarjeta}>
        <EstadoPedidoSelector estado="pendiente" onCambiar={() => {}} />
      </div>,
    )
    await userEvent.click(screen.getByRole('combobox'))
    expect(alClicTarjeta).not.toHaveBeenCalled()
  })
})
