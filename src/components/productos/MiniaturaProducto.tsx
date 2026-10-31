import { useState } from 'react'

interface MiniaturaProductoProps {
  url: string | null
  nombre: string
  // Lado del cuadrado, en píxeles.
  tamano?: number
  // En lugar de un cuadrado fijo, ocupa todo el ancho disponible (proporción 4:3).
  llenar?: boolean
}

// Imagen cuadrada del producto. Si no tiene imagen (o la URL no carga) se
// muestra un marcador con la inicial del nombre. Es decorativa: el nombre del
// producto siempre va escrito al lado, por eso alt vacío y aria-hidden.
export function MiniaturaProducto({ url, nombre, tamano = 48, llenar = false }: MiniaturaProductoProps) {
  // Se recuerda QUÉ URL falló (no solo "falló"), para que al cambiar la imagen
  // del producto se vuelva a intentar cargar la nueva.
  const [urlFallida, setUrlFallida] = useState<string | null>(null)

  if (url && url !== urlFallida) {
    return (
      <img
        className={`miniatura-producto${llenar ? ' miniatura-producto--llena' : ''}`}
        src={url}
        {...(llenar ? {} : { width: tamano, height: tamano })}
        loading="lazy"
        alt=""
        onError={() => setUrlFallida(url)}
      />
    )
  }

  // Sin nombre todavía (formulario de alta vacío) se muestra un "+" que invita a agregar la imagen.
  const inicial = nombre.trim().charAt(0).toUpperCase() || '+'
  return (
    <span
      className={`miniatura-producto miniatura-producto--marcador${llenar ? ' miniatura-producto--llena' : ''}`}
      style={llenar ? undefined : { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.42) }}
      aria-hidden="true"
    >
      {inicial}
    </span>
  )
}
