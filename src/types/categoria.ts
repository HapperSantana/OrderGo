// Representa un registro de la tabla `categorias` (HU12).
export interface Categoria {
  id: string
  owner_id: string
  nombre: string
  // Un emoji del catálogo de EMOJIS_CATEGORIA, o null si no tiene.
  emoji: string | null
  created_at: string
}

// Datos que se capturan para crear o editar una categoría.
export interface DatosCategoria {
  nombre: string
  emoji: string | null
}
