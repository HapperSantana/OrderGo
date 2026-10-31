import { LADO_MAXIMO_PX, TAMANO_MAXIMO_GUARDADO, calcularTamanoReducido } from '../utils/imagenProducto'

// Convierte un canvas en Blob (versión con promesa de canvas.toBlob).
function canvasABlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, calidad))
}

// Reduce la imagen en el navegador antes de subirla: el lado mayor queda en
// 800 px y se guarda como WebP (conserva la transparencia de los PNG). Si el
// navegador no sabe codificar WebP, se usa JPEG sobre fondo blanco.
// Lanza un Error con un mensaje listo para mostrar al usuario.
export async function reducirImagen(archivo: File): Promise<{ blob: Blob; tipo: string }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(archivo)
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con otro archivo.')
  }

  try {
    const { ancho, alto } = calcularTamanoReducido(bitmap.width, bitmap.height, LADO_MAXIMO_PX)
    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('No se pudo procesar la imagen en este navegador.')

    contexto.imageSmoothingQuality = 'high'
    contexto.drawImage(bitmap, 0, 0, ancho, alto)

    for (const calidad of [0.85, 0.65]) {
      let tipo = 'image/webp'
      let blob = await canvasABlob(canvas, tipo, calidad)

      // Safari antiguo ignora "webp" y devuelve PNG: en ese caso se usa JPEG.
      if (!blob || blob.type !== 'image/webp') {
        const sobreBlanco = document.createElement('canvas')
        sobreBlanco.width = ancho
        sobreBlanco.height = alto
        const contextoBlanco = sobreBlanco.getContext('2d')
        if (!contextoBlanco) throw new Error('No se pudo procesar la imagen en este navegador.')
        contextoBlanco.fillStyle = '#ffffff'
        contextoBlanco.fillRect(0, 0, ancho, alto)
        contextoBlanco.drawImage(bitmap, 0, 0, ancho, alto)
        tipo = 'image/jpeg'
        blob = await canvasABlob(sobreBlanco, tipo, calidad)
      }

      if (blob && blob.size <= TAMANO_MAXIMO_GUARDADO) return { blob, tipo }
    }

    throw new Error('La imagen sigue siendo demasiado pesada. Prueba con otra.')
  } finally {
    bitmap.close()
  }
}
