import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { formatearMoneda } from '../../utils/dinero'
import type { ItemNuevoPedido } from '../../types/pedido'

interface FilaItem extends ItemNuevoPedido {
  // Identificador local (no existe en la base de datos) solo para el `key` de React.
  clave: string
}

interface ItemsPedidoEditorProps {
  items: ItemNuevoPedido[]
  onCambiar: (items: ItemNuevoPedido[]) => void
}

const ID_DATALIST = 'ordergo-catalogo-productos'

function nuevaFilaVacia(): FilaItem {
  return { clave: crypto.randomUUID(), nombre: '', precio: 0, cantidad: 1 }
}

export function ItemsPedidoEditor({ items, onCambiar }: ItemsPedidoEditorProps) {
  const [filas, setFilas] = useState<FilaItem[]>(() =>
    items.length > 0 ? items.map((item) => ({ ...item, clave: crypto.randomUUID() })) : [nuevaFilaVacia()],
  )
  const [catalogo, setCatalogo] = useState<{ nombre: string; precio: number }[]>([])

  // Catálogo de productos ya registrados, para sugerir nombre y autocompletar precio.
  useEffect(() => {
    let activo = true

    async function cargarCatalogo() {
      const { data, error } = await supabase
        .from('productos')
        .select('nombre, precio')
        .eq('disponible', true)
        .order('nombre')
      if (activo && !error) setCatalogo(data ?? [])
    }

    void cargarCatalogo()
    return () => {
      activo = false
    }
  }, [])

  function emitirCambio(nuevasFilas: FilaItem[]) {
    setFilas(nuevasFilas)
    onCambiar(nuevasFilas.map(({ clave: _clave, ...item }) => item))
  }

  function actualizarFila(clave: string, cambios: Partial<ItemNuevoPedido>) {
    emitirCambio(filas.map((fila) => (fila.clave === clave ? { ...fila, ...cambios } : fila)))
  }

  function manejarCambioNombre(clave: string, nombre: string) {
    const productoConocido = catalogo.find((p) => p.nombre.toLowerCase() === nombre.trim().toLowerCase())
    const fila = filas.find((f) => f.clave === clave)

    // Si el nombre coincide con un producto ya conocido y el precio de la
    // fila sigue en 0 (el usuario no lo ha tocado), autocompletamos el precio.
    if (productoConocido && fila && fila.precio === 0) {
      actualizarFila(clave, { nombre, precio: productoConocido.precio })
    } else {
      actualizarFila(clave, { nombre })
    }
  }

  function agregarFila() {
    emitirCambio([...filas, nuevaFilaVacia()])
  }

  function quitarFila(clave: string) {
    const restantes = filas.filter((fila) => fila.clave !== clave)
    emitirCambio(restantes.length > 0 ? restantes : [nuevaFilaVacia()])
  }

  const total = filas.reduce((acc, fila) => acc + fila.precio * fila.cantidad, 0)

  return (
    <div className="items-pedido">
      <datalist id={ID_DATALIST}>
        {catalogo.map((producto) => (
          <option key={producto.nombre} value={producto.nombre} />
        ))}
      </datalist>

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
            <input
              type="text"
              list={ID_DATALIST}
              placeholder="Ej. Tacos al pastor"
              value={fila.nombre}
              onChange={(evento) => manejarCambioNombre(fila.clave, evento.target.value)}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={fila.precio === 0 ? '' : fila.precio}
              onChange={(evento) => actualizarFila(fila.clave, { precio: Number(evento.target.value) || 0 })}
            />
            <input
              type="number"
              min={1}
              step={1}
              value={fila.cantidad}
              onChange={(evento) =>
                actualizarFila(fila.clave, { cantidad: Math.max(1, Number(evento.target.value) || 1) })
              }
            />
            <span className="items-pedido__subtotal">{formatearMoneda(fila.precio * fila.cantidad)}</span>
            <button
              type="button"
              className="boton boton--icono"
              onClick={() => quitarFila(fila.clave)}
              aria-label={`Quitar ${fila.nombre || 'producto'}`}
              title="Quitar producto"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            className="items-pedido__instrucciones"
            placeholder="Instrucciones de preparación (opcional): sin cebolla, poco picante…"
            value={fila.instrucciones ?? ''}
            onChange={(evento) => actualizarFila(fila.clave, { instrucciones: evento.target.value })}
          />
        </div>
      ))}

      <button type="button" className="boton boton--secundario" onClick={agregarFila}>
        + Agregar producto
      </button>

      <div className="items-pedido__total">
        <span>Total del pedido</span>
        <strong>{formatearMoneda(total)}</strong>
      </div>
    </div>
  )
}