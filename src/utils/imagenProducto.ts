// Reglas de las imágenes de producto (HU11). Lógica pura: no toca el navegador
// ni Supabase, por eso se puede probar con Vitest.

// Nombre del bucket de Supabase Storage (ver supabase/schema.sql, sección HU11).
export const BUCKET_IMAGENES = 'productos-imagenes'

export const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const

// Archivo que elige el usuario: puede pesar bastante (una foto de celular suele
// pasar de 2 MB) porque se reduce en el navegador antes de subirse.
export const TAMANO_MAXIMO_ORIGINAL = 10 * 1024 * 1024

// Archivo que se guarda: es el límite que hace cumplir el bucket en el servidor
// (file_size_limit en schema.sql). Tras reducirla, la imagen queda muy por debajo.
export const TAMANO_MAXIMO_GUARDADO = 2 * 1024 * 1024

// Lado mayor, en píxeles, al que se reduce la imagen antes de subirla.
export const LADO_MAXIMO_PX = 800

export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Devuelve un mensaje para el usuario si el archivo no se puede usar, o null si es válido.
export function validarArchivoImagen(archivo: { type: string; size: number }): string | null {
  if (!(TIPOS_IMAGEN_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return 'Formato no admitido. Usa una imagen JPG, PNG o WebP.'
  }
  if (archivo.size <= 0) {
    return 'El archivo está vacío.'
  }
  if (archivo.size > TAMANO_MAXIMO_ORIGINAL) {
    return `La imagen pesa ${formatearTamano(archivo.size)} y el máximo es ${formatearTamano(TAMANO_MAXIMO_ORIGINAL)}.`
  }
  return null
}

export function extensionDeTipo(tipo: string): 'jpg' | 'png' | 'webp' {
  if (tipo === 'image/png') return 'png'
  if (tipo === 'image/webp') return 'webp'
  return 'jpg'
}

// Ruta dentro del bucket: "<id del propietario>/<id del archivo>.<extensión>".
// La primera carpeta DEBE ser el id del propietario: las políticas de Storage y
// la restricción productos_imagen_path_propia de la base de datos dependen de eso.
// El id del archivo es único en cada subida, así que cambiar la imagen de un
// producto nunca reutiliza una URL (no hay caché vieja que invalidar).
export function rutaImagenProducto(ownerId: string, idArchivo: string, tipo: string): string {
  return `${ownerId}/${idArchivo}.${extensionDeTipo(tipo)}`
}

// Misma regla que la restricción SQL: la ruta empieza por la carpeta del propietario.
export function esRutaDelPropietario(ruta: string, ownerId: string): boolean {
  return ruta.startsWith(`${ownerId}/`) && ruta.length > ownerId.length + 1
}

// Tamaño al que se reduce una imagen: conserva la proporción, el lado mayor
// queda en `ladoMaximo` y nunca se amplía una imagen que ya es pequeña.
export function calcularTamanoReducido(
  ancho: number,
  alto: number,
  ladoMaximo: number = LADO_MAXIMO_PX,
): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto)
  if (!(mayor > 0)) return { ancho: 1, alto: 1 }
  if (mayor <= ladoMaximo) return { ancho: Math.round(ancho), alto: Math.round(alto) }
  const escala = ladoMaximo / mayor
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  }
}
