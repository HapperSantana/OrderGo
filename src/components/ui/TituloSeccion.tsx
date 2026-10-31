import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface TituloSeccionProps {
  icono: LucideIcon
  id?: string
  // Clase del título original (se conserva para no perder sus márgenes y tamaño).
  className?: string
  children: ReactNode
}

// Título de una tarjeta con su ícono dentro de un círculo. El ícono es decorativo:
// el texto del título es lo que leen los lectores de pantalla.
export function TituloSeccion({ icono: Icono, id, className = '', children }: TituloSeccionProps) {
  return (
    <h2 id={id} className={`titulo-seccion ${className}`.trim()}>
      <span className="titulo-seccion__icono" aria-hidden="true">
        <Icono size={18} strokeWidth={2} focusable="false" />
      </span>
      {children}
    </h2>
  )
}
