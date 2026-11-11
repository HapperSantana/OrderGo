import { describe, expect, it } from 'vitest'
import css from './global.css?raw'

// Auditoría de TODA la hoja de estilos: cualquier regla que fije a la vez un color de texto y un color de fondo
// (con un color directo como #8a6d1d o con un token como var(--color-exito)) debe cumplir el contraste mínimo de
// 4.5:1 para texto. Así, un color nuevo con poco contraste se detecta solo, sin tener que acordarse de agregarlo
// a la lista de combinaciones de paleta.test.ts. (Dos insignias ámbar con 4.43:1 pasaron desapercibidas hasta el
// Sprint 7 precisamente porque estaban escritas con colores directos.)

const tokens = new Map<string, string>(Array.from(css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b/g), (m) => [m[1], m[2]]))

function resolver(valor: string): string | null {
  const texto = valor.trim()
  const variable = texto.match(/^var\(--([\w-]+)\)$/)
  if (variable) return tokens.get(variable[1]) ?? null
  return /^#[0-9a-fA-F]{3,6}$/.test(texto) ? texto : null
}

function luminancia(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (oscuro + 0.05)
}

const parejas = Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).flatMap((m) => {
  const selector = m[1].trim().split('\n').pop()!.trim()
  const fondo = m[2].match(/(?<![\w-])background(?:-color)?:\s*([^;]+);/)
  const texto = m[2].match(/(?<![\w-])color:\s*([^;]+);/)
  if (!fondo || !texto) return []
  const [colorFondo, colorTexto] = [resolver(fondo[1]), resolver(texto[1])]
  return colorFondo && colorTexto ? [{ selector, colorTexto, colorFondo, razon: contraste(colorTexto, colorFondo) }] : []
})

describe('contraste de toda la hoja de estilos', () => {
  it('encuentra las reglas con color y fondo fijos (la auditoría no está vacía)', () => {
    expect(parejas.length).toBeGreaterThan(30)
  })

  it('ninguna regla con texto y fondo fijos baja de 4.5:1', () => {
    const insuficientes = parejas.filter((p) => p.razon < 4.5).map((p) => `${p.selector}: ${p.colorTexto} sobre ${p.colorFondo} = ${p.razon.toFixed(2)}:1`)
    expect(insuficientes).toEqual([])
  })

  it('el aviso de pedidos sin entregar y las insignias "pendiente" usan el ámbar con contraste suficiente', () => {
    const aviso = parejas.find((p) => p.selector === '.aviso-pendientes')
    expect(aviso, 'falta la regla .aviso-pendientes').toBeDefined()
    expect(aviso!.razon).toBeGreaterThanOrEqual(4.5)
    expect(parejas.find((p) => p.selector === '.badge-estado--pendiente')!.razon).toBeGreaterThanOrEqual(4.5)
    expect(parejas.find((p) => p.selector === '.badge-pago--pendiente')!.razon).toBeGreaterThanOrEqual(4.5)
  })
})
