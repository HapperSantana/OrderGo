// Representa un registro de la tabla `productos`.
export interface Producto {
  id: string
  owner_id: string
  nombre: string
  precio: number
  disponible: boolean
  created_at: string
}

// Datos necesarios para dar de alta un producto manualmente desde el catálogo.
export interface NuevoProducto {
  nombre: string
  precio: number
  disponible?: boolean
}
