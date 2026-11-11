// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEnvioUnico } from './useEnvioUnico'

describe('useEnvioUnico', () => {
  it('ejecuta la acción y devuelve su resultado', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    expect(await result.current(async () => 42)).toBe(42)
  })

  it('un segundo envío mientras el primero sigue en curso se ignora (no ejecuta la acción)', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    let terminar: () => void = () => {}
    const accion = vi.fn(() => new Promise<void>((resolver) => (terminar = resolver)))
    const primero = result.current(accion)
    const segundo = await result.current(accion)
    expect(segundo).toBeUndefined()
    expect(accion).toHaveBeenCalledTimes(1)
    terminar()
    await primero
  })

  it('cuando el primero termina se puede volver a enviar', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    const accion = vi.fn(async () => 'listo')
    await result.current(accion)
    await result.current(accion)
    expect(accion).toHaveBeenCalledTimes(2)
  })

  it('si la acción falla con una excepción, se libera igual y se puede reintentar', async () => {
    const { result } = renderHook(() => useEnvioUnico())
    await expect(result.current(async () => { throw new Error('boom') })).rejects.toThrow('boom')
    const reintento = vi.fn(async () => 'ok')
    expect(await result.current(reintento)).toBe('ok')
  })
})
