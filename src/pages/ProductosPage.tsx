import { AppLayout } from '../components/layout/AppLayout'
import { ListaProductos } from '../components/productos/ListaProductos'

export function ProductosPage() {
  return (
    <AppLayout>
      <div className="encabezado-pagina">
        <h1>Productos</h1>
        <p>Administra el menú de tu negocio: precios y disponibilidad.</p>
      </div>
      <ListaProductos />
    </AppLayout>
  )
}
