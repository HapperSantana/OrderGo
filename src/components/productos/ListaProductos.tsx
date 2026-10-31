import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { Categoria, DatosCategoria } from '../../types/categoria'
import type { NuevoProducto, Producto, SeleccionImagen } from '../../types/producto'
import {
  FILTRO_SIN_CATEGORIA,
  FILTRO_TODAS,
  buscarCategoriaDuplicada,
  contarProductosPorCategoria,
  esEmojiCategoriaValido,
  etiquetaCategoria,
  filtrarProductos,
  ordenarCategorias,
  validarNombreCategoria,
} from '../../utils/categorias'
import { borrarImagenProducto, subirImagenProducto } from '../../lib/imagenesProductos'
import { CategoriasProductos } from './CategoriasProductos'
import { ProductoForm } from './ProductoForm'
import { ProductoRow } from './ProductoRow'
import { BookOpen, Search } from 'lucide-react'
import { TituloSeccion } from '../ui/TituloSeccion'
import { CampoConIcono } from '../ui/CampoConIcono'

// Códigos de error de Postgres que traducimos a mensajes amigables.
const CODIGO_NOMBRE_DUPLICADO = '23505' // unique_violation (productos_owner_nombre_unico)
const CODIGO_REFERENCIA_EN_USO = '23503' // foreign_key_violation (detalle_pedido -> productos)

export function ListaProductos() {
  const { user } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState(FILTRO_TODAS)
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarProductos() {
      setIsLoading(true)
      setErrorCarga(null)

      // Si las categorías no cargan, el catálogo sigue funcionando (sin filtro ni etiquetas de categoría).
      const [respuestaProductos, respuestaCategorias] = await Promise.all([
        supabase.from('productos').select('*').order('nombre', { ascending: true }),
        supabase.from('categorias').select('*'),
      ])

      if (!activo) return
      if (respuestaProductos.error) {
        setErrorCarga('No se pudo cargar el catálogo. Intenta de nuevo más tarde.')
      } else {
        setProductos(respuestaProductos.data ?? [])
      }
      if (respuestaCategorias.error) {
        setErrorCategorias('No se pudieron cargar las categorías. Intenta de nuevo más tarde.')
      } else {
        setCategorias(ordenarCategorias(respuestaCategorias.data ?? []))
      }
      setIsLoading(false)
    }

    void cargarProductos()
    return () => {
      activo = false
    }
  }, [])

  async function handleCrearProducto(
    nuevoProducto: NuevoProducto,
    imagen: File | null,
  ): Promise<{ error: string | null }> {
    if (!user) return { error: 'Debes iniciar sesión para administrar el catálogo.' }

    // Validación amigable, igual que con clientes: evita una petición
    // innecesaria y dice exactamente con qué producto choca.
    const yaExiste = productos.find(
      (p) => p.nombre.trim().toLowerCase() === nuevoProducto.nombre.trim().toLowerCase(),
    )
    if (yaExiste) {
      return { error: `Ya existe un producto llamado "${yaExiste.nombre}" en tu catálogo.` }
    }

    // Primero se sube la imagen (si hay) y después se guarda el producto con su
    // ruta. Si el guardado falla, se borra la imagen recién subida para no dejar
    // archivos huérfanos. El nombre ya se validó arriba: no se sube nada en vano.
    let imagenPath: string | null = null
    if (imagen) {
      const subida = await subirImagenProducto(user.id, imagen)
      if (subida.error !== null) return { error: `${subida.error} El producto no se guardó.` }
      imagenPath = subida.ruta
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({ ...nuevoProducto, owner_id: user.id, imagen_path: imagenPath })
      .select()
      .single()

    if (error) {
      await borrarImagenProducto(imagenPath)
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
    cambios: { nombre: string; precio: number; disponible: boolean; categoria_id: string | null },
    imagen: SeleccionImagen,
  ): Promise<{ error: string | null }> {
    const yaExiste = productos.find(
      (p) => p.id !== id && p.nombre.trim().toLowerCase() === cambios.nombre.trim().toLowerCase(),
    )
    if (yaExiste) {
      return { error: `Ya existe otro producto llamado "${yaExiste.nombre}" en tu catálogo.` }
    }

    const anterior = productos.find((p) => p.id === id)?.imagen_path ?? null
    let imagenPath = anterior
    let subidaNueva: string | null = null

    if (imagen.archivo) {
      if (!user) return { error: 'Debes iniciar sesión para administrar el catálogo.' }
      const subida = await subirImagenProducto(user.id, imagen.archivo)
      if (subida.error !== null) return { error: `${subida.error} No se guardaron los cambios.` }
      imagenPath = subida.ruta
      subidaNueva = subida.ruta
    } else if (imagen.quitar) {
      imagenPath = null
    }

    const { data, error } = await supabase
      .from('productos')
      .update({ ...cambios, imagen_path: imagenPath })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Si se alcanzó a subir una imagen nueva, se borra: el producto no cambió.
      await borrarImagenProducto(subidaNueva)
      if (error.code === CODIGO_NOMBRE_DUPLICADO) {
        return { error: 'Ya existe otro producto con ese nombre en tu catálogo.' }
      }
      return { error: 'No se pudo actualizar el producto. Intenta de nuevo.' }
    }

    // Guardado correcto: ya se puede borrar la imagen anterior si fue reemplazada o quitada.
    if (anterior && anterior !== imagenPath) await borrarImagenProducto(anterior)

    setProductos((actuales) =>
      actuales.map((p) => (p.id === id ? data : p)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    )
    return { error: null }
  }

  async function handleEliminarProducto(id: string): Promise<{ error: string | null }> {
    const imagenDelProducto = productos.find((p) => p.id === id)?.imagen_path ?? null
    const { error } = await supabase.from('productos').delete().eq('id', id)

    if (error) {
      if (error.code === CODIGO_REFERENCIA_EN_USO) {
        return {
          error: 'No se puede eliminar: ya tiene pedidos asociados. Márcalo como "no disponible" en su lugar.',
        }
      }
      return { error: 'No se pudo eliminar el producto. Intenta de nuevo.' }
    }

    // El producto ya no existe: su imagen tampoco hace falta.
    await borrarImagenProducto(imagenDelProducto)
    setProductos((actuales) => actuales.filter((p) => p.id !== id))
    return { error: null }
  }

  // ---------------- Categorías (HU12)

  function validarCategoria(datos: DatosCategoria, idExcluido?: string): string | null {
    const problema = validarNombreCategoria(datos.nombre)
    if (problema) return problema
    if (!esEmojiCategoriaValido(datos.emoji)) return 'Elige un emoji de la lista.'
    // Misma regla que la base de datos (nombre sin distinguir mayúsculas ni espacios en los extremos).
    const duplicada = buscarCategoriaDuplicada(categorias, datos.nombre, idExcluido)
    if (duplicada) return `Ya existe una categoría llamada "${duplicada.nombre}".`
    return null
  }

  async function handleCrearCategoria(datos: DatosCategoria): Promise<{ error: string | null }> {
    if (!user) return { error: 'Debes iniciar sesión para administrar las categorías.' }
    const problema = validarCategoria(datos)
    if (problema) return { error: problema }

    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre: datos.nombre.trim(), emoji: datos.emoji, owner_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === CODIGO_NOMBRE_DUPLICADO) return { error: 'Ya existe una categoría con ese nombre.' }
      return { error: 'No se pudo guardar la categoría. Intenta de nuevo.' }
    }

    setCategorias((actuales) => ordenarCategorias([...actuales, data]))
    return { error: null }
  }

  async function handleActualizarCategoria(id: string, datos: DatosCategoria): Promise<{ error: string | null }> {
    const problema = validarCategoria(datos, id)
    if (problema) return { error: problema }

    const { data, error } = await supabase
      .from('categorias')
      .update({ nombre: datos.nombre.trim(), emoji: datos.emoji })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === CODIGO_NOMBRE_DUPLICADO) return { error: 'Ya existe otra categoría con ese nombre.' }
      return { error: 'No se pudo actualizar la categoría. Intenta de nuevo.' }
    }

    setCategorias((actuales) => ordenarCategorias(actuales.map((c) => (c.id === id ? data : c))))
    return { error: null }
  }

  async function handleEliminarCategoria(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) return { error: 'No se pudo eliminar la categoría. Intenta de nuevo.' }

    // La base de datos deja sus productos "Sin categoría" (on delete set null); se refleja igual aquí.
    setCategorias((actuales) => actuales.filter((c) => c.id !== id))
    setProductos((actuales) => actuales.map((p) => (p.categoria_id === id ? { ...p, categoria_id: null } : p)))
    setFiltroCategoria((actual) => (actual === id ? FILTRO_TODAS : actual))
    return { error: null }
  }

  const conteoPorCategoria = useMemo(() => contarProductosPorCategoria(productos), [productos])

  const productosFiltrados = useMemo(
    () => filtrarProductos(productos, { busqueda, categoria: filtroCategoria }),
    [productos, busqueda, filtroCategoria],
  )

  return (
    <div className="pagina-productos">
      <ProductoForm categorias={categorias} onGuardar={handleCrearProducto} />

      <CategoriasProductos
        categorias={categorias}
        conteoProductos={conteoPorCategoria}
        onCrear={handleCrearCategoria}
        onActualizar={handleActualizarCategoria}
        onEliminar={handleEliminarCategoria}
      />

      {errorCategorias && (
        <p className="mensaje-error" role="alert">
          {errorCategorias}
        </p>
      )}

      <section className="tarjeta lista-productos">
        <div className="lista-productos__encabezado">
          <TituloSeccion icono={BookOpen}>Catálogo de productos</TituloSeccion>
          <div className="lista-productos__filtros">
            <select
              className="lista-productos__filtro-categoria"
              aria-label="Filtrar por categoría"
              value={filtroCategoria}
              onChange={(evento) => setFiltroCategoria(evento.target.value)}
            >
              <option value={FILTRO_TODAS}>Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {etiquetaCategoria(categoria)} ({conteoPorCategoria.get(categoria.id) ?? 0})
                </option>
              ))}
              <option value={FILTRO_SIN_CATEGORIA}>Sin categoría ({conteoPorCategoria.get(null) ?? 0})</option>
            </select>
            <CampoConIcono icono={Search}>
              <input
                type="search"
                className="lista-productos__buscador"
                placeholder="Buscar producto…"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                aria-label="Buscar producto"
              />
            </CampoConIcono>
          </div>
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
              : filtroCategoria !== FILTRO_TODAS && !busqueda.trim()
                ? 'No hay productos en esta categoría.'
                : 'No hay productos que coincidan con tu búsqueda.'}
          </p>
        )}

        {!isLoading && !errorCarga && productosFiltrados.length > 0 && (
          <div className="tabla-productos__contenedor">
            <div className="tabla-desplazable">
              <table className="tabla-productos">
                <thead>
                  <tr>
                    <th className="tabla-productos__col-imagen">
                      <span className="solo-lectores">Imagen</span>
                    </th>
                    <th>Producto</th>
                    <th>Categoría</th>
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
                      categorias={categorias}
                      onActualizar={handleActualizarProducto}
                      onEliminar={handleEliminarProducto}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
