import { AppLayout } from '../components/layout/AppLayout'
import { PanelPrincipal } from '../components/panel/PanelPrincipal'

export function PanelPage() {
  return (
    <AppLayout>
      <div className="encabezado-pagina">
        <h1>Panel</h1>
        <p>Resumen de pedidos e ingresos de tu negocio.</p>
      </div>
      <PanelPrincipal />
    </AppLayout>
  )
}