import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { urlImagenProducto } from '../../lib/imagenesProductos'
import type { Categoria } from '../../types/categoria'
import type { ItemNuevoPedido } from '../../types/pedido'
import type { Producto } from '../../types/producto'
import { FILTRO_SIN_CATEGORIA, FILTRO_TODAS, etiquetaCategoria } from '../../utils/categorias'
import { formatearMoneda } from '../../utils/dinero'
import {
  CANTIDAD_MAXIMA_SELECTOR,
  cambiarCantidadSeleccion,
  elegidosDeSeleccion,
  normalizarNombreProducto,
  pestanasDelSelector,
  productosParaSelector,
  totalSeleccion,
  unidadesSeleccionadas,
} from '../../utils/seleccionProductos'
import type { ProductoElegido } from '../../utils/seleccionProductos'
import { MiniaturaProducto } from '../productos/MiniaturaProducto'
import { Modal } from '../ui/Modal'
import { Check, Minus, Plus, Search } from 'lucide-react'
import { CampoConIcono } from '../ui/CampoConIcono'

interface SelectorProductosModalProps {
  abierto: boolean
  onCerrar: () => void
  productos: Producto[]
  categorias: Categoria[]
  cargando: boolean
  errorCarga: string | null
  // Renglones que el pedido ya tiene, para avisar "Ya en el pedido: N" en cada producto.
  renglones: ItemNuevoPedido[]
  // Recibe lo elegido; el padre decide cómo mezclarlo con los renglones del pedido.
  onAgregar: (elegidos: ProductoElegido[]) => void
}

export function SelectorProductosModal({
  abierto,
  onCerrar,
  productos,
  categorias,
  cargando,
  errorCarga,
  renglones,
  onAgregar,
}: SelectorProductosModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(FILTRO_TODAS)
  const [seleccion, setSeleccion] = useState<ReadonlyMap<string, number>>(new Map())

  // La ventana arranca limpia en cada apertura: todo se reinicia al cerrarla o confirmar.
  function reiniciar() {
    setBusqueda('')
    setCategoria(FILTRO_TODAS)
    setSeleccion(new Map())
  }

  function cerrar() {
    reiniciar()
    onCerrar()
  }

  function confirmar() {
    onAgregar(elegidosDeSeleccion(seleccion, productos))
    reiniciar()
    onCerrar()
  }

  const grupos = useMemo(
    () => productosParaSelector(productos, categorias, { busqueda, categoria }),
    [productos, categorias, busqueda, categoria],
  )
  const pestanas = useMemo(() => pestanasDelSelector(productos, categorias), [productos, categorias])
  const hayDisponibles = useMemo(() => productos.some((p) => p.disponible), [productos])

  const enPedido = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const renglon of renglones) {
      const clave = normalizarNombreProducto(renglon.nombre)
      mapa.set(clave, (mapa.get(clave) ?? 0) + renglon.cantidad)
    }
    return mapa
  }, [renglones])

  const unidades = unidadesSeleccionadas(seleccion)
  const total = totalSeleccion(seleccion, productos)

  const pie = (
    <div className="selector-productos__pie">
      <span className="selector-productos__resumen">
        {unidades === 0 ? 'Aún no elegiste productos' : `${unidades} ${unidades === 1 ? 'producto' : 'productos'} · ${formatearMoneda(total)}`}
      </span>
      <div className="selector-productos__botones">
        <button type="button" className="boton boton--enlace" onClick={cerrar}>
          Cancelar
        </button>
        <button type="button" className="boton boton--primario" disabled={unidades === 0} onClick={confirmar}>
          <Check size={18} aria-hidden="true" focusable="false" />
          Agregar al pedido
        </button>
      </div>
    </div>
  )

  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo="Agregar productos" pie={pie} className="modal--selector-productos">
      <div className="selector-productos">
        {cargando && <p className="selector-productos__estado">Cargando productos…</p>}

        {!cargando && errorCarga && (
          <p className="mensaje-error" role="alert">
            {errorCarga}
          </p>
        )}

        {!cargando && !errorCarga && !hayDisponibles && (
          <p className="selector-productos__estado">
            Tu catálogo no tiene productos disponibles. Agrégalos en la sección <Link to="/productos">Productos</Link>.
          </p>
        )}

        {!cargando && !errorCarga && hayDisponibles && (
          <>
            {/* Buscador y pestañas se quedan fijos arriba mientras se recorre un catálogo largo. */}
            <div className="selector-productos__controles">
              <CampoConIcono icono={Search}>
                <input
                  type="search"
                  className="selector-productos__buscador"
                  placeholder="Buscar producto…"
                  aria-label="Buscar producto"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                />
              </CampoConIcono>

              <div className="selector-productos__categorias" role="group" aria-label="Categorías">
                <BotonCategoria activo={categoria === FILTRO_TODAS} onClick={() => setCategoria(FILTRO_TODAS)}>
                  Todos
                </BotonCategoria>
                {pestanas.categorias.map((c) => (
                  <BotonCategoria key={c.id} activo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                    {etiquetaCategoria(c)}
                  </BotonCategoria>
                ))}
                {pestanas.haySinCategoria && (
                  <BotonCategoria activo={categoria === FILTRO_SIN_CATEGORIA} onClick={() => setCategoria(FILTRO_SIN_CATEGORIA)}>
                    Sin categoría
                  </BotonCategoria>
                )}
              </div>
            </div>

            {/* Avisa a los lectores de pantalla cómo va la selección sin mover el foco. */}
            <p className="solo-lectores" role="status">
              {unidades === 0 ? '' : `${unidades} ${unidades === 1 ? 'producto seleccionado' : 'productos seleccionados'}`}
            </p>

            {grupos.length === 0 && <p className="selector-productos__estado">No hay productos que coincidan.</p>}

            {grupos.map((grupo) => (
              <section key={grupo.categoria?.id ?? 'sin-categoria'} className="selector-productos__grupo">
                <h3 className="selector-productos__titulo-grupo">{etiquetaCategoria(grupo.categoria)}</h3>
                <div className="selector-productos__cuadricula">
                  {grupo.productos.map((producto) => (
                    <TarjetaProducto
                      key={producto.id}
                      producto={producto}
                      cantidad={seleccion.get(producto.id) ?? 0}
                      enPedido={enPedido.get(normalizarNombreProducto(producto.nombre)) ?? 0}
                      onCambiar={(delta) => setSeleccion((actual) => cambiarCantidadSeleccion(actual, producto.id, delta))}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
}

function BotonCategoria({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" className={`selector-productos__categoria${activo ? ' selector-productos__categoria--activa' : ''}`} aria-pressed={activo} onClick={onClick}>
      {children}
    </button>
  )
}

interface TarjetaProductoProps {
  producto: Producto
  cantidad: number
  enPedido: number
  onCambiar: (delta: number) => void
}

function TarjetaProducto({ producto, cantidad, enPedido, onCambiar }: TarjetaProductoProps) {
  return (
    <article className={`producto-tarjeta${cantidad > 0 ? ' producto-tarjeta--elegido' : ''}`}>
      <MiniaturaProducto url={urlImagenProducto(producto.imagen_path)} nombre={producto.nombre} llenar />
      <div className="producto-tarjeta__info">
        <p className="producto-tarjeta__nombre">{producto.nombre}</p>
        <p className="producto-tarjeta__precio">{formatearMoneda(producto.precio)}</p>
        {enPedido > 0 && <p className="producto-tarjeta__en-pedido">Ya en el pedido: {enPedido}</p>}
      </div>

      {cantidad === 0 ? (
        <button type="button" className="boton boton--secundario producto-tarjeta__agregar" aria-label={`Agregar ${producto.nombre}`} onClick={() => onCambiar(1)}>
          + Agregar
        </button>
      ) : (
        <div className="producto-tarjeta__cantidad" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
          <button type="button" aria-label={`Quitar una unidad de ${producto.nombre}`} onClick={() => onCambiar(-1)}>
            <Minus size={16} aria-hidden="true" focusable="false" />
          </button>
          <span className="producto-tarjeta__numero">{cantidad}</span>
          <button type="button" aria-label={`Agregar una unidad de ${producto.nombre}`} disabled={cantidad >= CANTIDAD_MAXIMA_SELECTOR} onClick={() => onCambiar(1)}>
            <Plus size={16} aria-hidden="true" focusable="false" />
          </button>
        </div>
      )}
    </article>
  )
}
