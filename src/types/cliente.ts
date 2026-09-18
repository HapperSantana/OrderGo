// Representa un registro de la tabla `clientes` en Supabase.
export interface Cliente {
  id: string
  owner_id: string
  nombre: string
  telefono: string
  direccion: string | null
  notas: string | null
  created_at: string
}

// Datos necesarios para crear un cliente nuevo (el resto lo asigna la base de datos).
export interface NuevoCliente {
  nombre: string
  telefono: string
  direccion?: string
  notas?: string
}
