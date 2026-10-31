import { supabase } from './supabaseClient'
import { BUCKET_IMAGENES, rutaImagenProducto } from '../utils/imagenProducto'
import { reducirImagen } from './reducirImagen'

// URL pública de la imagen de un producto (el bucket es público), o null si no tiene.
export function urlImagenProducto(ruta: string | null | undefined): string | null {
  if (!ruta) return null
  return supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(ruta).data.publicUrl
}

// Reduce la imagen y la sube a la carpeta del propietario. Devuelve la ruta que
// se debe guardar en productos.imagen_path, o un mensaje de error para mostrar.
export async function subirImagenProducto(
  ownerId: string,
  archivo: File,
): Promise<{ ruta: string; error: null } | { ruta: null; error: string }> {
  let reducida: { blob: Blob; tipo: string }
  try {
    reducida = await reducirImagen(archivo)
  } catch (error) {
    return { ruta: null, error: error instanceof Error ? error.message : 'No se pudo procesar la imagen.' }
  }

  const ruta = rutaImagenProducto(ownerId, crypto.randomUUID(), reducida.tipo)
  const { error } = await supabase.storage.from(BUCKET_IMAGENES).upload(ruta, reducida.blob, {
    contentType: reducida.tipo,
    // El nombre es único en cada subida, así que la imagen nunca cambia bajo esa URL: caché de un año.
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) return { ruta: null, error: 'No se pudo subir la imagen. Intenta de nuevo.' }
  return { ruta, error: null }
}

// Borra un archivo del bucket. Es "mejor esfuerzo": si falla no se interrumpe
// lo que el usuario estaba haciendo (a lo sumo queda un archivo huérfano).
export async function borrarImagenProducto(ruta: string | null | undefined): Promise<void> {
  if (!ruta) return
  const { error } = await supabase.storage.from(BUCKET_IMAGENES).remove([ruta])
  if (error) console.warn('No se pudo borrar la imagen anterior del almacenamiento:', error.message)
}
