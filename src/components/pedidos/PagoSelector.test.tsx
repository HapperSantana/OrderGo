// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { violacionesDeAccesibilidad } from '../../pruebas/axe'
import type { EstadoPago, MetodoPago } from '../../types/pedido'
import { PagoSelector } from './PagoSelector'

// Control único de pago (CC07): marcar un pedido como pagado exige elegir el método en el mismo paso.
const pintar = (estadoPago: EstadoPago, metodoPago: MetodoPago | null, onCambiar = vi.fn()) => {
  render(<PagoSelector estadoPago={estadoPago} metodoPago={metodoPago} onCambiar={onCambiar} />)
  return { onCambiar, selector: screen.getByRole('combobox', { name: 'Pago del pedido' }) }
}

describe('PagoSelector (CC07)', () => {
  it('un pedido con pago pendiente muestra "Pago pendiente"', () => {
    const { selector } = pintar('pendiente', null)
    expect(selector).toHaveValue('pendiente')
    expect(selector).toHaveDisplayValue('Pago pendiente')
  })

  it('un pedido pagado muestra "Pagado · método"', () => {
    const { selector } = pintar('pagado', 'tarjeta')
    expect(selector).toHaveValue('tarjeta')
    expect(selector).toHaveDisplayValue('Pagado · Tarjeta')
  })

  it('NO existe una opción de "Pagado" sin método: cada forma de pagar es una opción propia', () => {
    const { selector } = pintar('pendiente', null)
    const opciones = Array.from(selector.querySelectorAll('option')).map((o) => o.textContent)
    expect(opciones).toEqual(['Pago pendiente', 'Pagado · Efectivo', 'Pagado · Tarjeta', 'Pagado · Transferencia', 'Pagado · Otro'])
  })

  it('al elegir un método avisa con ESE valor (el padre guarda estado y método juntos)', async () => {
    const { onCambiar, selector } = pintar('pendiente', null)
    await userEvent.selectOptions(selector, 'efectivo')
    expect(onCambiar).toHaveBeenCalledTimes(1)
    expect(onCambiar).toHaveBeenCalledWith('efectivo')
  })

  it('al volver a "Pago pendiente" avisa con "pendiente"', async () => {
    const { onCambiar, selector } = pintar('pagado', 'efectivo')
    await userEvent.selectOptions(selector, 'pendiente')
    expect(onCambiar).toHaveBeenCalledWith('pendiente')
  })

  it('no tiene estado propio: siempre muestra lo que dice el servidor, aunque el padre no cambie nada', async () => {
    const { selector } = pintar('pendiente', null) // el padre ignora el cambio (por ejemplo, falló al guardar)
    await userEvent.selectOptions(selector, 'tarjeta')
    expect(selector).toHaveValue('pendiente')
  })

  it('un pedido antiguo pagado SIN método obliga a elegir uno (opción deshabilitada que lo indica)', () => {
    const { selector } = pintar('pagado', null)
    expect(selector).toHaveDisplayValue('Pagado · elegir método…')
    expect(screen.getByRole('option', { name: 'Pagado · elegir método…' })).toBeDisabled()
  })

  it('no tiene problemas de accesibilidad (axe)', async () => {
    const { container } = render(<PagoSelector estadoPago="pagado" metodoPago="efectivo" onCambiar={() => {}} />)
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
  })
})
