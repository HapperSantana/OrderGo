import { LayoutDashboard } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { PanelPrincipal } from '../components/panel/PanelPrincipal'

export function PanelPage() {
  return (
    <AppLayout>
      <EncabezadoPagina icono={LayoutDashboard} titulo="Panel" descripcion="Resumen de pedidos e ingresos de tu negocio." />
      <PanelPrincipal />
    </AppLayout>
  )
}
