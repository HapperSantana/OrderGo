import type { ReactNode } from 'react'
import { Decoracion } from '../ui/Decoracion'
import { AvisoConexion } from './AvisoConexion'
import { Navbar } from './Navbar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Decoracion />
      <Navbar />
      <AvisoConexion />
      <main className="app-layout__contenido">{children}</main>
    </div>
  )
}
