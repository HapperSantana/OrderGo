import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import type { ClienteResumen } from '../../types/pedido'

interface SelectorClienteProps {
  clienteId: string | null
  onSeleccionar: (cliente: ClienteResumen | null) => void
}

export function SelectorCliente({ clienteId, onSeleccionar }: SelectorClienteProps) {
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)

  useEffect(() => {
    let activo = true

    async function cargarClientes() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono')
        .order('nombre', { ascending: true })

      if (!activo) return
      if (!error) setClientes(data ?? [])
      setIsLoading(false)
    }

    void cargarClientes()
    return () => {
      activo = false
    }
  }, [])

  const clienteSeleccionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId],
  )

  const sugerencias = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return clientes.slice(0, 8)
    return clientes
      .filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(termino) || cliente.telefono.toLowerCase().includes(termino),
      )
      .slice(0, 8)
  }, [clientes, busqueda])

  if (!isLoading && clientes.length === 0) {
    return (
      <p className="selector-cliente__vacio">
        Aún no tienes clientes registrados.{' '}
        <Link to="/clientes">Registra uno primero</Link> para poder crear un pedido.
      </p>
    )
  }

  if (clienteSeleccionado && !mostrarLista) {
    return (
      <div className="selector-cliente__elegido">
        <div>
          <span className="selector-cliente__nombre">{clienteSeleccionado.nombre}</span>
          <span className="selector-cliente__telefono">{clienteSeleccionado.telefono}</span>
        </div>
        <button
          type="button"
          className="boton boton--enlace"
          onClick={() => {
            setBusqueda('')
            setMostrarLista(true)
          }}
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="selector-cliente">
      <input
        type="text"
        placeholder={isLoading ? 'Cargando clientes…' : 'Buscar cliente por nombre o teléfono…'}
        value={busqueda}
        disabled={isLoading}
        onChange={(evento) => setBusqueda(evento.target.value)}
        onFocus={() => setMostrarLista(true)}
      />

      {mostrarLista && !isLoading && (
        <ul className="selector-cliente__opciones">
          {sugerencias.length === 0 && <li className="selector-cliente__sin-resultados">Sin coincidencias.</li>}
          {sugerencias.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(cliente)
                  setMostrarLista(false)
                }}
              >
                <span className="selector-cliente__nombre">{cliente.nombre}</span>
                <span className="selector-cliente__telefono">{cliente.telefono}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
