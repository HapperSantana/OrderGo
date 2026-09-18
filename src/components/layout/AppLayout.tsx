import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-layout__contenido">{children}</main>
    </div>
  )
}
