import { describe, expect, it } from 'vitest'
import estilos from './global.css?raw'

// Corrección del panel de emojis: en Windows los emojis son más anchos que en otros
// sistemas y la séptima columna se salía del recuadro. Estas pruebas vigilan las reglas
// de CSS que lo evitan (el desborde real solo se ve en un navegador).
const regla = (selector: string) => {
  const coincidencia = estilos.match(new RegExp(`${selector.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`))
  if (!coincidencia) throw new Error(`No se encontró la regla ${selector} en global.css`)
  return coincidencia[1]
}

describe('panel de emojis', () => {
  it('las 7 columnas se reparten el ancho del panel y no crecen con el ancho del emoji', () => {
    // Con "1fr" a secas, una columna nunca baja del ancho de su contenido: un emoji ancho la ensancha.
    expect(regla('.selector-emoji__cuadricula')).toContain('grid-template-columns: repeat(7, minmax(0, 1fr))')
  })

  it('los botones de emoji no llevan el relleno por defecto del navegador', () => {
    expect(regla('.selector-emoji__opcion')).toMatch(/padding: 0;/)
  })

  it('un emoji que exceda su celda se recorta en lugar de salirse del recuadro', () => {
    expect(regla('.selector-emoji__opcion')).toMatch(/overflow: hidden;/)
    expect(regla('.selector-emoji__opcion')).toMatch(/min-width: 0;/)
  })

  it('el panel nunca es más ancho que la pantalla (el botón que lo abre está unos 60 px adentro)', () => {
    expect(regla('.selector-emoji__panel')).toMatch(/width: min\(17\.5rem, calc\(100vw - 5\.5rem\)\)/)
  })
})

// Misma familia de error en el resto de la hoja de estilos: una columna "1fr" a secas se ensancha
// hasta el ancho natural de sus campos y empuja la página fuera de la pantalla en el celular.
describe('rejillas que se reparten el ancho disponible', () => {
  it('ninguna rejilla usa columnas "1fr" a secas (deben ser minmax(0, 1fr))', () => {
    const lineas = estilos.split('\n').filter((linea) => /grid-template-columns:/.test(linea))
    const sueltas = lineas.filter((linea) => !/minmax\(/.test(linea))
    expect(sueltas, `columnas sin minmax: ${sueltas.join(' | ')}`).toEqual([])
  })

  it('la barra superior pasa a su modo compacto en tabletas (hasta 860 px), donde ya no caben el correo y los enlaces', () => {
    expect(estilos).toMatch(/@media \(max-width: 860px\) \{\s*\.navbar \{\s*flex-wrap: wrap;/)
  })
})

