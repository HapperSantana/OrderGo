import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { urlImagenProducto } from '../../lib/imagenesProductos'
import type { Categoria } from '../../types/categoria'
import type { ItemNuevoPedido } from '../../types/pedido'
import type { Producto } from '../../types/producto'
import { ordenarCategorias } from '../../utils/categorias'
import { formatearMoneda } from '../../utils/dinero'
import { normalizarNombreProducto, totalRenglones, unirSeleccionConRenglones } from '../../utils/seleccionProductos'
import type { ProductoElegido } from '../../utils/seleccionProductos'
import { MiniaturaProducto } from '../productos/MiniaturaProducto'
import { SelectorProductosModal } from './SelectorProductosModal'
import { CampoConIcono } from '../ui/CampoConIcono'
import { X } from 'lucide-react'

interface FilaItem extends ItemNuevoPedido {
  // Identificador local (no existe en la base de datos) solo para el `key` de React.
  clave: string
}

interface ItemsPedidoEditorProps {
  items: ItemNuevoPedido[]
  onCambiar: (items: ItemNuevoPedido[]) => void
}

function tieneClave(fila: FilaItem | ItemNuevoPedido): fila is FilaItem {
  return 'clave' in fila && typeof fila.clave === 'string'
}

// Renglones del pedido. Los productos se eligen desde el catálogo en una ventana
// emergente (SelectorProductosModal); aquí solo se ajusta el precio, la cantidad y las
// instrucciones de cada renglón. Ya no se escriben productos a mano: si falta uno, primero
// se agrega en la sección Productos.
export function ItemsPedidoEditor({ items, onCambiar }: ItemsPedidoEditorProps) {
  // Copia interna de los renglones, inicializada UNA vez al montarse. Para reiniciarla
  // (después de guardar un pedido) el padre le cambia la `key`.
  const [filas, setFilas] = useState<FilaItem[]>(() => items.map((item) => ({ ...item, clave: crypto.randomUUID() })))
  const [catalogo, setCatalogo] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  // Catálogo completo (con imágenes y categorías) para el selector y las miniaturas de los renglones.
  useEffect(() => {
    let activo = true

    async function cargarCatalogo() {
      const [respuestaProductos, respuestaCategorias] = await Promise.all([
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('categorias').select('*'),
      ])

      if (!activo) return
      if (respuestaProductos.error) {
        setErrorCarga('No se pudo cargar el catálogo de productos. Intenta de nuevo más tarde.')
      } else {
        setCatalogo(respuestaProductos.data ?? [])
      }
      // Sin categorías el selector sigue funcionando: todo aparece como "Sin categoría".
      if (!respuestaCategorias.error) setCategorias(ordenarCategorias(respuestaCategorias.data ?? []))
      setCargando(false)
    }

    void cargarCatalogo()
    return () => {
      activo = false
    }
  }, [])

  // Para mostrar la miniatura de cada renglón (se busca por nombre, igual que la base de datos).
  const productoPorNombre = useMemo(
    () => new Map(catalogo.map((producto) => [normalizarNombreProducto(producto.nombre), producto])),
    [catalogo],
  )

  function emitirCambio(nuevasFilas: FilaItem[]) {
    setFilas(nuevasFilas)
    onCambiar(nuevasFilas.map(({ clave: _clave, ...item }) => item))
  }

  function actualizarFila(clave: string, cambios: Partial<ItemNuevoPedido>) {
    emitirCambio(filas.map((fila) => (fila.clave === clave ? { ...fila, ...cambios } : fila)))
  }

  function quitarFila(clave: string) {
    emitirCambio(filas.filter((fila) => fila.clave !== clave))
  }

  // Lo elegido en el selector se suma a los renglones: un producto que ya estaba en el
  // pedido aumenta su cantidad (sin duplicarse ni perder su precio ni sus instrucciones).
  function agregarElegidos(elegidos: ProductoElegido[]) {
    const mezcladas = unirSeleccionConRenglones(filas, elegidos)
    emitirCambio(mezcladas.map((fila) => (tieneClave(fila) ? fila : { ...fila, clave: crypto.randomUUID() })))
  }

  const total = totalRenglones(filas)

  return (
    <div className="items-pedido">
      {filas.length === 0 ? (
        <p className="items-pedido__vacio">Aún no agregaste productos al pedido.</p>
      ) : (
        <>
          <div className="items-pedido__cabecera">
            <span>Producto</span>
            <span>Precio</span>
            <span>Cant.</span>
            <span>Subtotal</span>
            <span />
          </div>

          {filas.map((fila) => (
            <div className="items-pedido__item" key={fila.clave}>
              <div className="items-pedido__fila">
                <div className="items-pedido__producto">
                  <MiniaturaProducto
                    url={urlImagenProducto(productoPorNombre.get(normalizarNombreProducto(fila.nombre))?.imagen_path)}
                    nombre={fila.nombre}
                    tamano={40}
                  />
                  <span className="items-pedido__nombre">{fila.nombre}</span>
                </div>
                <CampoConIcono simbolo="$" className="items-pedido__precio">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    aria-label={`Precio de ${fila.nombre}`}
                    value={fila.precio === 0 ? '' : fila.precio}
                    onChange={(evento) => actualizarFila(fila.clave, { precio: Number(evento.target.value) || 0 })}
                  />
                </CampoConIcono>
                <input
                  type="number"
                  className="items-pedido__cantidad"
                  min={1}
                  step={1}
                  aria-label={`Cantidad de ${fila.nombre}`}
                  value={fila.cantidad}
                  onChange={(evento) => actualizarFila(fila.clave, { cantidad: Math.max(1, Number(evento.target.value) || 1) })}
                />
                <span className="items-pedido__subtotal">{formatearMoneda(totalRenglones([fila]))}</span>
                <button
                  type="button"
                  className="boton boton--icono"
                  onClick={() => quitarFila(fila.clave)}
                  aria-label={`Quitar ${fila.nombre}`}
                  title="Quitar producto"
                >
                  <X size={16} aria-hidden="true" focusable="false" />
                </button>
              </div>

              <input
                type="text"
                className="items-pedido__instrucciones"
                placeholder="Instrucciones de preparación (opcional): sin cebolla, poco picante…"
                aria-label={`Instrucciones de ${fila.nombre}`}
                value={fila.instrucciones ?? ''}
                onChange={(evento) => actualizarFila(fila.clave, { instrucciones: evento.target.value })}
              />
            </div>
          ))}
        </>
      )}

      <button type="button" className="boton boton--secundario" aria-haspopup="dialog" onClick={() => setSelectorAbierto(true)}>
        + Agregar productos
      </button>

      <div className="items-pedido__total">
        <span>Total del pedido</span>
        <strong>{formatearMoneda(total)}</strong>
      </div>

      <SelectorProductosModal
        abierto={selectorAbierto}
        onCerrar={() => setSelectorAbierto(false)}
        productos={catalogo}
        categorias={categorias}
        cargando={cargando}
        errorCarga={errorCarga}
        renglones={filas}
        onAgregar={agregarElegidos}
      />
    </div>
  )
}
