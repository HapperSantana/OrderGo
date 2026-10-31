import { UtensilsCrossed } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { ListaPedidos } from '../components/pedidos/ListaPedidos'

export function PedidosPage() {
  return (
    <AppLayout>
      <EncabezadoPagina icono={UtensilsCrossed} titulo="Pedidos" descripcion="Registra nuevos pedidos y consulta los que ya están en curso." />
      <ListaPedidos />
    </AppLayout>
  )
}
