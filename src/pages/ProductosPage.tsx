import { Package } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { ListaProductos } from '../components/productos/ListaProductos'

export function ProductosPage() {
  return (
    <AppLayout>
      <EncabezadoPagina icono={Package} titulo="Productos" descripcion="Administra el menú de tu negocio: precios y disponibilidad." />
      <ListaProductos />
    </AppLayout>
  )
}
