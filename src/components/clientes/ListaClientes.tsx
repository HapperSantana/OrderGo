import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { Cliente, NuevoCliente } from '../../types/cliente'
import { normalizarTelefono } from '../../utils/telefono'
import { ClienteForm } from './ClienteForm'
import { ClienteRow } from './ClienteRow'


const CODIGO_TELEFONO_DUPLICADO = '23505'

export function ListaClientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarClientes() {
      setIsLoading(true)
      setErrorCarga(null)

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!activo) return

      if (error) {
        setErrorCarga('No se pudieron cargar los clientes. Intenta de nuevo más tarde.')
      } else {
        setClientes(data ?? [])
      }
      setIsLoading(false)
    }

    void cargarClientes()

    return () => {
      activo = false
    }
  }, [])

  async function handleGuardarCliente(nuevoCliente: NuevoCliente): Promise<{ error: string | null }> {
    if (!user) {
      return { error: 'Debes iniciar sesión para registrar clientes.' }
    }

    // 1) Validación amigable en el cliente: evita una petición innecesaria
    //    y le dice al usuario exactamente con quién choca el teléfono.
    const telefonoNormalizado = normalizarTelefono(nuevoCliente.telefono)
    const clienteExistente = clientes.find(
      (cliente) => normalizarTelefono(cliente.telefono) === telefonoNormalizado,
    )

    if (clienteExistente) {
      return {
        error: `Ya existe un cliente registrado con este teléfono: "${clienteExistente.nombre}". Verifica si es la misma persona.`,
      }
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...nuevoCliente, owner_id: user.id })
      .select()
      .single()

    if (error) {
      // 2) Respaldo a nivel de base de datos: si dos pestañas/dispositivos
      //    intentan registrar el mismo teléfono al mismo tiempo, Postgres
      //    rechaza el segundo insert por el índice único y lo traducimos
      //    a un mensaje amigable en vez de mostrar el error técnico.
      if (error.code === CODIGO_TELEFONO_DUPLICADO) {
        return { error: 'Ya existe un cliente registrado con este número de teléfono.' }
      }
      return { error: 'No se pudo guardar el cliente. Verifica los datos e intenta de nuevo.' }
    }

    setClientes((actuales) => [data, ...actuales])
    return { error: null }
  }

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return clientes

    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(termino) || cliente.telefono.toLowerCase().includes(termino),
    )
  }, [clientes, busqueda])

  return (
    <div className="pagina-clientes">
      <ClienteForm onGuardar={handleGuardarCliente} />

      <section className="tarjeta lista-clientes">
        <div className="lista-clientes__encabezado">
          <h2>Clientes registrados</h2>
          <input
            type="search"
            className="lista-clientes__buscador"
            placeholder="Buscar por nombre o teléfono…"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar cliente"
          />
        </div>

        {isLoading && <p className="lista-clientes__estado">Cargando clientes…</p>}

        {errorCarga && (
          <p className="mensaje-error" role="alert">
            {errorCarga}
          </p>
        )}

        {!isLoading && !errorCarga && clientesFiltrados.length === 0 && (
          <p className="lista-clientes__estado">
            {clientes.length === 0
              ? 'Aún no has registrado ningún cliente. Usa el formulario de arriba para agregar el primero.'
              : 'No hay clientes que coincidan con tu búsqueda.'}
          </p>
        )}

        {!isLoading && !errorCarga && clientesFiltrados.length > 0 && (
          <div className="tabla-clientes__contenedor">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Notas</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <ClienteRow key={cliente.id} cliente={cliente} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}