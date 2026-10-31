import { Users } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { ListaClientes } from '../components/clientes/ListaClientes'

export function ClientesPage() {
  return (
    <AppLayout>
      <EncabezadoPagina icono={Users} titulo="Clientes" descripcion="Registra y consulta a las personas que hacen pedidos en tu negocio." />
      <ListaClientes />
    </AppLayout>
  )
}
