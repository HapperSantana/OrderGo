import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { NuevoProducto, Producto } from '../../types/producto'
import { ProductoForm } from './ProductoForm'
import { ProductoRow } from './ProductoRow'

// Códigos de error de Postgres que traducimos a mensajes amigables.
const CODIGO_NOMBRE_DUPLICADO = '23505' // unique_violation (productos_owner_nombre_unico)
const CODIGO_REFERENCIA_EN_USO = '23503' // foreign_key_violation (detalle_pedido -> productos)

export function ListaProductos() {
  const { user } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarProductos() {
      setIsLoading(true)
      setErrorCarga(null)

      const { data, error } = await supabase.from('productos').select('*').order('nombre', { ascending: true })

      if (!activo) return
      if (error) {
        setErrorCarga('No se pudo cargar el catálogo. Intenta de nuevo más tarde.')
      } else {
        setProductos(data ?? [])
      }
      setIsLoading(false)
    }

    void cargarProductos()
    return () => {
      activo = false
    }
  }, [])

  async function handleCrearProducto(nuevoProducto: NuevoProducto): Promise<{ error: string | null }> {
    if (!user) return { error: 'Debes iniciar sesión para administrar el catálogo.' }

    // Validación amigable, igual que con clientes: evita una petición
    // innecesaria y dice exactamente con qué producto choca.
    const yaExiste = productos.find(
      (p) => p.nombre.trim().toLowerCase() === nuevoProducto.nombre.trim().toLowerCase(),
    )
    if (yaExiste) {
      return { error: `Ya existe un producto llamado "${yaExiste.nombre}" en tu catálogo.` }
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({ ...nuevoProducto, owner_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === CODIGO_NOMBRE_DUPLICADO) {
        return { error: 'Ya existe un producto con ese nombre en tu catálogo.' }
      }
      return { error: 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.' }
    }

    setProductos((actuales) => [...actuales, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return { error: null }
  }

  async function handleActualizarProducto(
    id: string,
    cambios: { nombre: string; precio: number; disponible: boolean },
  ): Promise<{ error: string | null }> {
    const yaExiste = productos.find(
      (p) => p.id !== id && p.nombre.trim().toLowerCase() === cambios.nombre.trim().toLowerCase(),
    )
    if (yaExiste) {
      return { error: `Ya existe otro producto llamado "${yaExiste.nombre}" en tu catálogo.` }
    }

    const { data, error } = await supabase.from('productos').update(cambios).eq('id', id).select().single()

    if (error) {
      if (error.code === CODIGO_NOMBRE_DUPLICADO) {
        return { error: 'Ya existe otro producto con ese nombre en tu catálogo.' }
      }
      return { error: 'No se pudo actualizar el producto. Intenta de nuevo.' }
    }

    setProductos((actuales) =>
      actuales.map((p) => (p.id === id ? data : p)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    )
    return { error: null }
  }

  async function handleEliminarProducto(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('productos').delete().eq('id', id)

    if (error) {
      if (error.code === CODIGO_REFERENCIA_EN_USO) {
        return {
          error: 'No se puede eliminar: ya tiene pedidos asociados. Márcalo como "no disponible" en su lugar.',
        }
      }
      return { error: 'No se pudo eliminar el producto. Intenta de nuevo.' }
    }

    setProductos((actuales) => actuales.filter((p) => p.id !== id))
    return { error: null }
  }

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(termino))
  }, [productos, busqueda])

  return (
    <div className="pagina-productos">
      <ProductoForm onGuardar={handleCrearProducto} />

      <section className="tarjeta lista-productos">
        <div className="lista-productos__encabezado">
          <h2>Catálogo de productos</h2>
          <input
            type="search"
            className="lista-productos__buscador"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar producto"
          />
        </div>

        {isLoading && <p className="lista-productos__estado">Cargando catálogo…</p>}

        {errorCarga && (
          <p className="mensaje-error" role="alert">
            {errorCarga}
          </p>
        )}

        {!isLoading && !errorCarga && productosFiltrados.length === 0 && (
          <p className="lista-productos__estado">
            {productos.length === 0
              ? 'Aún no tienes productos en tu catálogo. Se agregan aquí o automáticamente al crear un pedido con un producto nuevo.'
              : 'No hay productos que coincidan con tu búsqueda.'}
          </p>
        )}

        {!isLoading && !errorCarga && productosFiltrados.length > 0 && (
          <div className="tabla-productos__contenedor">
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <ProductoRow
                    key={producto.id}
                    producto={producto}
                    onActualizar={handleActualizarProducto}
                    onEliminar={handleEliminarProducto}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
