import type { ReactNode } from 'react'
import { Decoracion } from '../ui/Decoracion'
import { Navbar } from './Navbar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Decoracion />
      <Navbar />
      <main className="app-layout__contenido">{children}</main>
    </div>
  )
}
