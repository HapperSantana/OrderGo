import { AppLayout } from '../components/layout/AppLayout'
import { ListaClientes } from '../components/clientes/ListaClientes'

export function ClientesPage() {
  return (
    <AppLayout>
      <div className="encabezado-pagina">
        <h1>Clientes</h1>
        <p>Registra y consulta a las personas que hacen pedidos en tu negocio.</p>
      </div>
      <ListaClientes />
    </AppLayout>
  )
}
