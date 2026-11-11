import { describe, expect, it } from 'vitest'
import css from './global.css?raw'

// Protege la accesibilidad de la paleta (CC11): si alguien cambia un color de
// :root y el texto deja de leerse bien, esta prueba falla. Los mínimos son los
// de WCAG AA: 4.5:1 para texto normal y 3:1 para elementos gráficos.

function tokensDeRoot(texto: string): Record<string, string> {
  const bloque = texto.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!bloque) throw new Error('No se encontró el bloque :root en global.css')
  const tokens: Record<string, string> = {}
  for (const [, nombre, valor] of bloque[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[nombre] = valor.toLowerCase()
  }
  return tokens
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lineal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b)
}

function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const t = tokensDeRoot(css)

describe('paleta de colores (CC11)', () => {
  it('define todos los tokens que usa la interfaz', () => {
    for (const nombre of [
      'color-bg', 'color-surface', 'color-surface-alt', 'color-ink', 'color-ink-soft', 'color-border',
      'color-placeholder', 'color-primary', 'color-primary-dark', 'color-primary-contraste', 'color-accent',
      'color-accent-dark', 'color-accent-contraste', 'color-acento-texto', 'color-acento-brillante', 'color-acento-icono', 'color-salvia', 'color-salvia-oscuro','color-exito', 'color-exito-bg', 'color-error', 'color-error-bg',
    ]) {
      expect(t[nombre], `falta --${nombre}`).toBeDefined()
    }
  })

  // [texto, fondo, mínimo, descripción]
  const combinaciones: [string, string, number, string][] = [
    ['color-ink', 'color-bg', 7, 'texto principal sobre el fondo'],
    ['color-ink', 'color-surface', 7, 'texto principal sobre las tarjetas'],
    ['color-ink-soft', 'color-bg', 4.5, 'texto secundario sobre el fondo'],
    ['color-ink-soft', 'color-surface', 4.5, 'texto secundario sobre las tarjetas'],
    ['color-placeholder', 'color-surface', 4.5, 'texto de ejemplo de los campos'],
    ['color-primary', 'color-surface', 4.5, 'títulos verdes sobre las tarjetas'],
    ['color-primary', 'color-bg', 4.5, 'títulos verdes sobre el fondo'],
    ['color-primary-contraste', 'color-primary', 4.5, 'texto de la barra superior'],
    ['color-primary-contraste', 'color-primary-dark', 4.5, 'texto del panel de inicio de sesión'],
    ['color-accent-contraste', 'color-accent', 4.5, 'texto blanco del botón principal'],
    ['color-accent-contraste', 'color-accent-dark', 4.5, 'texto blanco del botón principal al pasar el cursor'],
    ['color-acento-texto', 'color-surface', 4.5, 'enlaces y montos naranjas sobre las tarjetas'],
    ['color-acento-texto', 'color-bg', 4.5, 'enlaces naranjas sobre el fondo'],
    ['color-primary', 'color-salvia', 4.5, 'texto del botón secundario'],
    ['color-primary', 'color-salvia-oscuro', 4.5, 'texto del botón secundario al pasar el cursor'],
    ['color-acento-brillante', 'color-primary', 3, 'subrayado naranja del enlace activo sobre la barra (elemento gráfico)'],
    ['color-acento-icono', 'color-bg', 3, 'ícono naranja del título de página sobre el fondo (elemento gráfico)'],
    ['color-acento-icono', 'color-surface', 3, 'ícono naranja sobre las tarjetas (elemento gráfico)'],
    ['color-primary', 'color-surface-alt', 4.5, 'ícono verde dentro del círculo de los títulos de sección'],
    ['color-ink-soft', 'color-surface', 3, 'íconos grises de los campos sobre la tarjeta (elemento gráfico)'],
    ['color-exito', 'color-exito-bg', 4.5, 'texto de la insignia "Entregado"'],
    ['color-error', 'color-error-bg', 4.5, 'texto de la insignia "Cancelado" y de los avisos de error'],
    ['color-exito', 'color-surface', 4.5, 'texto verde de éxito sobre las tarjetas'],
  ]

  it.each(combinaciones)('%s sobre %s cumple %s:1 (%s)', (texto, fondo, minimo) => {
    expect(contraste(t[texto], t[fondo])).toBeGreaterThanOrEqual(minimo)
  })

  it('ningún texto usa directamente el naranja del botón (no llega a 4.5:1 sobre las tarjetas)', () => {
    // "color: var(--color-accent)" como texto está prohibido; para texto se usa --color-acento-texto.
    // Los bordes (border-bottom-color) y los fondos sí pueden usar --color-accent.
    expect(css).not.toMatch(/(^|[^-])color:\s*var\(--color-accent\)/m)
  })
})
