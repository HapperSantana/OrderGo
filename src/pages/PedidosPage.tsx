import { AppLayout } from '../components/layout/AppLayout'
import { ListaPedidos } from '../components/pedidos/ListaPedidos'

export function PedidosPage() {
  return (
    <AppLayout>
      <div className="encabezado-pagina">
        <h1>Pedidos</h1>
        <p>Registra nuevos pedidos y consulta los que ya están en curso.</p>
      </div>
      <ListaPedidos />
    </AppLayout>
  )
}
