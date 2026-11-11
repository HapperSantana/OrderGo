import { describe, expect, it } from 'vitest'
import estilos from './global.css?raw'

// HU10: el texto "solo-lectores" (visible solo para lectores de pantalla) se coloca con position: absolute. Si su
// contenedor no es el que lo "contiene", queda posicionado respecto a la pantalla: en una tabla con scroll, un
// encabezado oculto en la última columna ensanchaba toda la página en el celular (pasó con la columna "Acciones").
const regla = (selector: string) => {
  const coincidencia = estilos.match(new RegExp(`${selector.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`))
  if (!coincidencia) throw new Error(`No se encontró la regla ${selector} en global.css`)
  return coincidencia[1]
}

describe('contenedor de las tablas', () => {
  it('se desplaza en horizontal y CONTIENE a los elementos posicionados de su interior', () => {
    const cuerpo = regla('.tabla-desplazable')
    expect(cuerpo).toMatch(/overflow-x: auto;/)
    expect(cuerpo).toMatch(/position: relative;/)
  })

  it('el texto solo para lectores de pantalla sigue siendo absoluto (si cambia, hay que revisar la regla de arriba)', () => {
    expect(regla('.solo-lectores')).toMatch(/position: absolute;/)
  })
})
