import { renderToStaticMarkup } from 'react-dom/server'
import { Package } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import estilos from '../../styles/global.css?raw'
import { Decoracion } from './Decoracion'
import { EncabezadoPagina } from './EncabezadoPagina'
import { LEMA, Lema } from './Lema'

const svgs = import.meta.glob('/src/assets/decoracion/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const documentos = import.meta.glob('/src/assets/decoracion/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const nombreDe = (ruta: string) => ruta.split('/').pop() as string

// Máximo permitido por imagen y para todas juntas (la decoración no debe volver pesada la aplicación).
const MAXIMO_POR_IMAGEN = 150 * 1024
const MAXIMO_TOTAL = 120 * 1024

describe('imágenes decorativas (CC13)', () => {
  it('están las 7 imágenes: las 5 del cliente y la hoja y la mancha propias', () => {
    expect(Object.keys(svgs).map(nombreDe).sort()).toEqual([
      'caja-jugo.svg', 'ensalada.svg', 'hoja.svg', 'mancha.svg', 'plato-vegetales.svg', 'plato-verduras.svg', 'vaso-cola.svg',
    ])
  })

  it.each(Object.entries(svgs))('%s es un SVG limpio: con viewBox, sin fotos incrustadas, scripts ni referencias externas', (ruta, texto) => {
    expect(texto, 'falta el viewBox (sin él la imagen no se puede escalar)').toMatch(/viewBox="/)
    expect(texto.toLowerCase()).not.toContain('<image')
    expect(texto.toLowerCase()).not.toContain('<script')
    expect(texto.toLowerCase()).not.toContain('foreignobject')
    expect(texto).not.toMatch(/\son[a-z]+\s*=/i)
    expect(texto).not.toMatch(/(?:href|src)\s*=\s*["']https?:/i)
    expect(texto).not.toMatch(/url\(\s*["']?https?:/i)
    expect(new Blob([texto]).size, `${nombreDe(ruta)} pesa demasiado`).toBeLessThan(MAXIMO_POR_IMAGEN)
  })

  it('el peso total de las imágenes está dentro del presupuesto', () => {
    const total = Object.values(svgs).reduce((suma, texto) => suma + new Blob([texto]).size, 0)
    expect(total).toBeLessThan(MAXIMO_TOTAL)
  })

  it('CREDITOS.md documenta cada imagen (origen y licencia)', () => {
    const creditos = Object.values(documentos)[0] ?? ''
    for (const ruta of Object.keys(svgs)) {
      expect(creditos, `falta ${nombreDe(ruta)} en CREDITOS.md`).toContain(nombreDe(ruta))
    }
  })
})

describe('Decoracion', () => {
  // React 19 antepone etiquetas <link rel="preload"> para las imágenes al renderizar a texto: se descartan.
  const html = renderToStaticMarkup(<Decoracion />).replace(/<link[^>]*>/g, '')

  it('está oculta a los lectores de pantalla', () => {
    expect(html).toMatch(/^<div class="decoracion" aria-hidden="true">/)
  })

  it('todas sus imágenes son decorativas (alt vacío) y no se pueden arrastrar', () => {
    const imagenes = html.match(/<img[^>]*>/g) ?? []
    expect(imagenes.length).toBe(10)
    for (const imagen of imagenes) {
      expect(imagen).toContain('alt=""')
      expect(imagen).toContain('draggable="false"')
      expect(imagen, 'deben ser perezosas para no descargarse en el celular').toContain('loading="lazy"')
    }
  })

  it('reparte las piezas en los dos lados', () => {
    expect((html.match(/decoracion__pieza--izq/g) ?? []).length).toBe(5)
    expect((html.match(/decoracion__pieza--der/g) ?? []).length).toBe(5)
  })
})

describe('Lema', () => {
  const html = renderToStaticMarkup(<Lema />)

  it('dice exactamente lo acordado con el cliente', () => {
    expect(LEMA).toBe('El mejor gestor de pedidos para tu negocio')
    expect(html).toContain(LEMA)
  })

  it('es decorativo: está oculto a los lectores de pantalla (se repite en todas las pantallas)', () => {
    expect(html).toMatch(/^<p class="lema" aria-hidden="true">/)
  })

  it('se muestra en el encabezado de la página sin alterar su título ni su descripción', () => {
    const encabezado = renderToStaticMarkup(<EncabezadoPagina icono={Package} titulo="Productos" descripcion="Administra el menú." />)
    expect(encabezado).toContain(LEMA)
    expect(encabezado).toMatch(/<h1[^>]*>[\s\S]*Productos<\/h1>/)
    expect(encabezado).toContain('<p>Administra el menú.</p>')
  })
})

describe('estilos de la decoración y del lema', () => {
  it('la decoración está oculta por defecto y solo se muestra en pantallas anchas', () => {
    expect(estilos).toMatch(/\.decoracion \{\s*display: none;\s*\}/)
    const bloque = estilos.match(/@media \(min-width: 1280px\) \{\s*\.decoracion \{([\s\S]*?)\}/)
    expect(bloque, 'falta el bloque de pantallas anchas').not.toBeNull()
    expect(bloque![1]).toContain('display: block')
  })

  it('la decoración no recibe clics y queda detrás del contenido', () => {
    const bloque = estilos.match(/@media \(min-width: 1280px\) \{\s*\.decoracion \{([\s\S]*?)\}[\s\S]*?\.app-layout \{([\s\S]*?)\}/)!
    expect(bloque[1]).toContain('pointer-events: none')
    expect(bloque[1]).toMatch(/z-index: 0/)
    expect(bloque[2]).toMatch(/z-index: 1/)
  })

  it('no se imprime', () => {
    expect(estilos).toMatch(/@media print \{\s*\.decoracion \{\s*display: none;/)
  })

  it('el lema está oculto por defecto y solo aparece en pantallas anchas', () => {
    expect(estilos).toMatch(/\.lema \{\s*display: none;/)
    expect(estilos).toMatch(/@media \(min-width: 900px\) \{\s*\.lema \{\s*display: flex;/)
  })
})
