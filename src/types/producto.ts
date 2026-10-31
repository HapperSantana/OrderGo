// Representa un registro de la tabla `productos`.
export interface Producto {
  id: string
  owner_id: string
  nombre: string
  precio: number
  disponible: boolean
  // Ruta de la imagen en el bucket productos-imagenes (HU11). null = sin imagen.
  imagen_path: string | null
  // Categoría del producto (HU12). null = Sin categoría.
  categoria_id: string | null
  created_at: string
}

// Datos necesarios para dar de alta un producto manualmente desde el catálogo.
export interface NuevoProducto {
  nombre: string
  precio: number
  disponible?: boolean
  imagen_path?: string | null
  categoria_id?: string | null
}

// Lo que el usuario decidió hacer con la imagen de un producto en un formulario.
//  - archivo: una imagen nueva elegida (se reduce y se sube al guardar).
//  - quitar: quitar la imagen que ya tiene el producto.
export interface SeleccionImagen {
  archivo: File | null
  quitar: boolean
}

export const SIN_CAMBIO_DE_IMAGEN: SeleccionImagen = { archivo: null, quitar: false }
