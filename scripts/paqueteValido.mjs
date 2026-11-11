// Revisión del paquete que genera "vite build". Es una función pura (sin tocar archivos) para poder probarla.
//
// Por qué existe: si al compilar faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, el módulo
// del cliente de Supabase lanza un error al cargarse y el compilador descarta como "inalcanzable" TODO el
// código que depende de él, o sea toda la aplicación. El comando termina "bien", pero el paquete sale casi
// vacío. Esto pasó durante varios sprints sin que nadie lo notara (ver la retrospectiva del Sprint 6).

// Textos que solo existen en el código de la aplicación (nombres de funciones SQL, del canal de tiempo real
// y del espacio de imágenes). Si falta alguno, la aplicación no quedó dentro del paquete.
export const MARCAS_DE_LA_APLICACION = ['crear_pedido', 'cancelar_pedido', 'pedidos-cambios', 'productos-imagenes']

// Mensaje del error que lanza el cliente de Supabase cuando faltan las variables (src/lib/supabaseClient.ts).
export const MENSAJE_SIN_VARIABLES = 'Faltan las variables de entorno'

export function revisarPaquete(textoJs) {
  if (!textoJs) return ['No se encontró el JavaScript del paquete (¿falló la compilación?).']

  const problemas = []

  if (textoJs.includes(MENSAJE_SIN_VARIABLES)) {
    problemas.push(`El paquete contiene el error "${MENSAJE_SIN_VARIABLES}": la aplicación fallaría al arrancar.`)
  }

  for (const marca of MARCAS_DE_LA_APLICACION) {
    if (!textoJs.includes(marca)) {
      problemas.push(`Al paquete le falta "${marca}": el código de la aplicación no quedó incluido (¿faltan las variables de entorno al compilar?).`)
    }
  }

  return problemas
}
