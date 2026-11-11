// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { violacionesDeAccesibilidad } from '../../pruebas/axe'

// Pruebas de componente del formulario de pedido nuevo (HU10). Cubre lo acordado desde el Sprint 5: que el formulario
// se limpia después de guardar (error histórico del Sprint 2), que un segundo pedido seguido no arrastra los
// productos del anterior, y que el envío no se puede duplicar.

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('../../lib/supabaseClient', () => ({ supabase: { rpc } }))

// Sustitutos mínimos de los dos hijos que consultan Supabase. Se comportan como los reales en lo que importa aquí:
// el selector de cliente avisa cuál se eligió, y el editor de renglones guarda su PROPIA copia, inicializada una
// sola vez al montarse (por eso el formulario cambia su "key" para limpiarla).
vi.mock('./SelectorCliente', () => ({
  SelectorCliente: ({ clienteId, onSeleccionar }: { clienteId: string | null; onSeleccionar: (c: unknown) => void }) => (
    <div>
      <span data-testid="cliente">{clienteId ?? 'ninguno'}</span>
      <button type="button" onClick={() => onSeleccionar({ id: 'c1', nombre: 'María López', telefono: '33 1234 5678' })}>
        Elegir a María
      </button>
    </div>
  ),
}))
vi.mock('./ItemsPedidoEditor', async () => {
  const { useState } = await import('react')
  return {
    ItemsPedidoEditor: ({ items, onCambiar }: { items: unknown[]; onCambiar: (items: unknown[]) => void }) => {
      const [copia, setCopia] = useState(items)
      return (
        <div>
          <span data-testid="renglones">{copia.length}</span>
          <button
            type="button"
            onClick={() => {
              const nuevos = [...copia, { nombre: 'Tacos', precio: 18, cantidad: 2 }]
              setCopia(nuevos)
              onCambiar(nuevos)
            }}
          >
            Agregar tacos
          </button>
        </div>
      )
    },
  }
})

import { NuevoPedidoForm } from './NuevoPedidoForm'

const usuario = () => userEvent.setup()
const enviar = () => screen.getByRole('button', { name: /Registrar pedido|Guardando pedido/ })

async function llenarPedido(u: ReturnType<typeof usuario>, notas = '') {
  await u.click(screen.getByRole('button', { name: 'Elegir a María' }))
  await u.click(screen.getByRole('button', { name: 'Agregar tacos' }))
  await u.click(screen.getByRole('button', { name: 'Agregar tacos' }))
  if (notas) await u.type(screen.getByLabelText(/Notas/), notas)
}

beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue({ error: null })
})

describe('NuevoPedidoForm — validación', () => {
  it('sin cliente no envía y lo explica', async () => {
    const u = usuario()
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await u.click(screen.getByRole('button', { name: 'Agregar tacos' }))
    await u.click(enviar())
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona el cliente para este pedido.')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sin productos no envía y lo explica', async () => {
    const u = usuario()
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await u.click(screen.getByRole('button', { name: 'Elegir a María' }))
    await u.click(enviar())
    expect(screen.getByRole('alert')).toHaveTextContent('Agrega al menos un producto al pedido.')
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('NuevoPedidoForm — guardar', () => {
  it('envía el cliente, las notas y los renglones con el formato que espera crear_pedido', async () => {
    const u = usuario()
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u, '  sin cebolla  ')
    await u.click(enviar())
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('crear_pedido', {
      p_cliente_id: 'c1',
      p_notas: 'sin cebolla',
      p_items: [
        { nombre: 'Tacos', precio: 18, cantidad: 2, instrucciones: null },
        { nombre: 'Tacos', precio: 18, cantidad: 2, instrucciones: null },
      ],
    })
  })

  it('sin notas envía p_notas = null', async () => {
    const u = usuario()
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u)
    await u.click(enviar())
    expect(rpc.mock.calls[0][1].p_notas).toBeNull()
  })

  it('DESPUÉS DE GUARDAR el formulario queda limpio (cliente, renglones y notas) y avisa a la lista', async () => {
    const u = usuario()
    const alCrear = vi.fn()
    render(<NuevoPedidoForm onPedidoCreado={alCrear} />)
    await llenarPedido(u, 'para llevar')
    expect(screen.getByTestId('renglones')).toHaveTextContent('2')
    await u.click(enviar())
    await waitFor(() => expect(alCrear).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('cliente')).toHaveTextContent('ninguno')
    expect(screen.getByTestId('renglones')).toHaveTextContent('0')
    expect(screen.getByLabelText(/Notas/)).toHaveValue('')
  })

  it('un SEGUNDO pedido seguido no arrastra los productos del anterior (flujo doble)', async () => {
    const u = usuario()
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u)
    await u.click(enviar())
    await waitFor(() => expect(screen.getByTestId('renglones')).toHaveTextContent('0'))
    await u.click(screen.getByRole('button', { name: 'Elegir a María' }))
    await u.click(screen.getByRole('button', { name: 'Agregar tacos' }))
    await u.click(enviar())
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[1][1].p_items).toHaveLength(1)
  })

  it('mientras guarda, el botón dice "Guardando pedido…" y está bloqueado', async () => {
    const u = usuario()
    let terminar: (valor: { error: null }) => void = () => {}
    rpc.mockImplementation(() => new Promise((resolver) => (terminar = resolver)))
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u)
    await u.click(enviar())
    expect(screen.getByRole('button', { name: 'Guardando pedido…' })).toBeDisabled()
    await act(async () => terminar({ error: null }))
    expect(screen.getByRole('button', { name: 'Registrar pedido' })).toBeEnabled()
  })
})

describe('NuevoPedidoForm — cuando el servidor falla', () => {
  it('avisa con un mensaje amable y NO pierde lo capturado', async () => {
    const u = usuario()
    rpc.mockResolvedValue({ error: { message: 'boom: detalle interno', code: 'XX000' } })
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u, 'sin cebolla')
    await u.click(enviar())
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo registrar el pedido')
    expect(screen.getByRole('alert')).not.toHaveTextContent('boom')
    expect(screen.getByTestId('cliente')).toHaveTextContent('c1')
    expect(screen.getByTestId('renglones')).toHaveTextContent('2')
    expect(screen.getByLabelText(/Notas/)).toHaveValue('sin cebolla')
    expect(enviar()).toBeEnabled()
  })

  it('al reintentar con éxito se guarda, se limpia el formulario y desaparece el error', async () => {
    const u = usuario()
    rpc.mockResolvedValueOnce({ error: { message: 'boom' } })
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u)
    await u.click(enviar())
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await u.click(enviar())
    await waitFor(() => expect(screen.getByTestId('renglones')).toHaveTextContent('0'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(rpc).toHaveBeenCalledTimes(2)
  })
})

describe('NuevoPedidoForm — envío duplicado', () => {
  it('dos envíos seguidos (doble clic, Enter repetido) crean UN solo pedido', async () => {
    const u = usuario()
    let terminar: (valor: { error: null }) => void = () => {}
    rpc.mockImplementation(() => new Promise((resolver) => (terminar = resolver)))
    render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    await llenarPedido(u)

    // Los dos eventos llegan ANTES de que React termine de redibujar (por eso el botón aún no se ha bloqueado).
    const formulario = enviar().closest('form') as HTMLFormElement
    act(() => {
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await act(async () => terminar({ error: null }))
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})

describe('NuevoPedidoForm — accesibilidad', () => {
  it('no tiene problemas de accesibilidad (axe), ni con el error visible', async () => {
    const u = usuario()
    const { container } = render(<NuevoPedidoForm onPedidoCreado={vi.fn()} />)
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
    await u.click(enviar())
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(await violacionesDeAccesibilidad(container)).toEqual([])
  })
})
