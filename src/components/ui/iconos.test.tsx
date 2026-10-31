import { renderToStaticMarkup } from 'react-dom/server'
import { Mail, Package } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { CampoConIcono } from './CampoConIcono'
import { EncabezadoPagina } from './EncabezadoPagina'
import { TituloSeccion } from './TituloSeccion'

// Quita las etiquetas HTML y deja solo el texto que leería un lector de pantalla.
const soloTexto = (html: string) => html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim()

describe('EncabezadoPagina', () => {
  const html = renderToStaticMarkup(<EncabezadoPagina icono={Package} titulo="Productos" descripcion="Administra el menú." />)

  it('el título sigue siendo un <h1> con su texto', () => {
    expect(html).toMatch(/<h1[^>]*>/)
    expect(soloTexto(html.match(/<h1[\s\S]*?<\/h1>/)![0])).toBe('Productos')
  })

  it('el ícono es decorativo: aria-hidden y no se puede enfocar', () => {
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
    expect(html).toMatch(/<svg[^>]*focusable="false"/)
  })

  it('conserva la descripción', () => {
    expect(html).toContain('<p>Administra el menú.</p>')
  })
})

describe('TituloSeccion', () => {
  const html = renderToStaticMarkup(<TituloSeccion icono={Package} id="t1" className="formulario__titulo">Nuevo producto</TituloSeccion>)

  it('es un <h2> con el id y la clase originales', () => {
    expect(html).toMatch(/<h2[^>]*id="t1"/)
    expect(html).toContain('formulario__titulo')
  })

  it('el ícono va en un círculo oculto a lectores de pantalla y el texto sigue legible', () => {
    expect(html).toMatch(/<span class="titulo-seccion__icono" aria-hidden="true">/)
    expect(soloTexto(html)).toBe('Nuevo producto')
  })
})

describe('CampoConIcono', () => {
  it('agrega un ícono decorativo sin quitar el campo', () => {
    const html = renderToStaticMarkup(<CampoConIcono icono={Mail}><input aria-label="Correo" /></CampoConIcono>)
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
    expect(html).toContain('<input aria-label="Correo"')
  })

  it('un símbolo de texto como "$" también queda oculto a lectores de pantalla', () => {
    const html = renderToStaticMarkup(<CampoConIcono simbolo="$"><input aria-label="Precio" /></CampoConIcono>)
    expect(html).toContain('<span class="campo-icono__simbolo" aria-hidden="true">$</span>')
  })
})

// Auditoría de TODO el código: ningún ícono de lucide-react se usa sin aria-hidden.
// Un ícono sin aria-hidden podría leerse como un elemento vacío o confuso. Los botones
// que solo tienen ícono llevan su propio aria-label (lo revisa la prueba de navegador).
describe('auditoría de íconos en el código fuente', () => {
  const archivos = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

  it('encuentra los archivos de la aplicación', () => {
    expect(Object.keys(archivos).length).toBeGreaterThan(20)
  })

  it('todo ícono usado como elemento JSX lleva aria-hidden="true"', () => {
    const sinOcultar: string[] = []
    for (const [ruta, texto] of Object.entries(archivos)) {
      if (ruta.endsWith('.test.tsx')) continue
      const importacion = texto.match(/import\s*\{([^}]*)\}\s*from\s*'lucide-react'/)
      if (!importacion) continue
      const nombres = importacion[1].split(',').map((n) => n.trim()).filter((n) => n && !n.startsWith('type '))
      for (const nombre of nombres) {
        for (const uso of texto.matchAll(new RegExp(`<${nombre}\\b[^>]*?/>`, 'gs'))) {
          if (!uso[0].includes('aria-hidden')) sinOcultar.push(`${ruta}: <${nombre} …/>`)
        }
      }
    }
    expect(sinOcultar).toEqual([])
  })
})
