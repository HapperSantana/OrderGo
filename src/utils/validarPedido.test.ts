import { describe, expect, it } from 'vitest'
import type { ClienteResumen, ItemNuevoPedido } from '../types/pedido'
import { itemsParaRpc, validarPedido } from './validarPedido'

const cliente: ClienteResumen = { id: 'c1', nombre: 'María', telefono: '33 1234 5678' }
const item = (cambios: Partial<ItemNuevoPedido> = {}): ItemNuevoPedido => ({
  nombre: 'Tacos',
  precio: 18.5,
  cantidad: 2,
  ...cambios,
})

describe('validarPedido', () => {
  it('acepta un pedido con cliente y un producto válido', () => {
    expect(validarPedido(cliente, [item()])).toBeNull()
  })

  it('exige elegir un cliente', () => {
    expect(validarPedido(null, [item()])).toBe('Selecciona el cliente para este pedido.')
  })

  it('exige al menos un producto con nombre', () => {
    expect(validarPedido(cliente, [])).toBe('Agrega al menos un producto al pedido.')
    expect(validarPedido(cliente, [item({ nombre: '   ' })])).toBe('Agrega al menos un producto al pedido.')
  })

  it('exige un precio mayor a cero e indica el producto', () => {
    expect(validarPedido(cliente, [item({ precio: 0 })])).toBe('El producto "Tacos" necesita un precio mayor a cero.')
  })

  it('ignora los renglones vacíos si hay otros válidos', () => {
    expect(validarPedido(cliente, [item({ nombre: '', precio: 0 }), item()])).toBeNull()
  })
})

describe('itemsParaRpc', () => {
  it('descarta renglones sin nombre y limpia espacios', () => {
    const resultado = itemsParaRpc([item({ nombre: '  Tacos  ', instrucciones: '  sin cebolla ' }), item({ nombre: ' ' })])
    expect(resultado).toEqual([{ nombre: 'Tacos', precio: 18.5, cantidad: 2, instrucciones: 'sin cebolla' }])
  })

  it('las instrucciones vacías se envían como null', () => {
    expect(itemsParaRpc([item({ instrucciones: '   ' })])[0].instrucciones).toBeNull()
    expect(itemsParaRpc([item()])[0].instrucciones).toBeNull()
  })
})