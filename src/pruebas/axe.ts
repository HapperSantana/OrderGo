import axe from 'axe-core'

// Revisión automática de accesibilidad (axe-core) sobre lo que una prueba de componentes pintó.
// jsdom no calcula colores ni posiciones, así que se apagan las reglas que dependen de eso (contraste y
// "todo el contenido dentro de una zona"): el contraste lo vigila contrasteEstilos.test.ts y la estructura
// de la página completa se revisa en el navegador.
export async function violacionesDeAccesibilidad(contenedor: Element): Promise<string[]> {
  const resultado = await axe.run(contenedor, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return resultado.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} elemento(s)) -> ${v.nodes[0]?.html.slice(0, 120)}`)
}
