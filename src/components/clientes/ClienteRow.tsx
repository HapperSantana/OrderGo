import type { Cliente } from '../../types/cliente'

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ClienteRow({ cliente }: { cliente: Cliente }) {
  return (
    <tr className="tabla-clientes__fila">
      <td>
        <span className="tabla-clientes__nombre">{cliente.nombre}</span>
      </td>
      <td>{cliente.telefono}</td>
      <td>{cliente.direccion || <span className="tabla-clientes__vacio">—</span>}</td>
      <td>{cliente.notas || <span className="tabla-clientes__vacio">—</span>}</td>
      <td>{formatearFecha(cliente.created_at)}</td>
    </tr>
  )
}
