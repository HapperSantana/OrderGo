import type { ReactNode } from 'react'
import { LogoSombrero } from './LogoSombrero'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__panel" aria-hidden="true">
        <LogoSombrero className="auth-layout__logo" tamano={76} />
        {/* El panel es decorativo (aria-hidden): su nombre de marca no es un encabezado. El título principal de la página es el del formulario. */}
        <p className="auth-layout__titulo">OrderGo</p>
        <p className="auth-layout__eslogan">
          Un solo lugar para recibir, preparar y entregar cada pedido de tu negocio.
        </p>

        <ul className="auth-layout__lista">
          <li>Recibido → En preparación → Listo → Entregado</li>
          <li>Clientes y pedidos siempre a la mano</li>
          <li>Accesible desde cualquier dispositivo</li>
        </ul>
      </aside>

      <main className="auth-layout__formulario">{children}</main>
    </div>
  )
}
