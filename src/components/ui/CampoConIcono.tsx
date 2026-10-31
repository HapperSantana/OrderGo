import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface CampoConIconoProps {
  // Un ícono (por ejemplo, una lupa) o un símbolo de texto (por ejemplo, "$"), dentro del campo, a la izquierda.
  icono?: LucideIcon
  simbolo?: string
  // Clase extra para ubicar el campo en una rejilla (por ejemplo, la fila de un renglón).
  className?: string
  children: ReactNode
}

// Envuelve un <input> y le agrega un ícono o símbolo decorativo a la izquierda.
// El campo conserva su etiqueta o aria-label: el adorno no se anuncia.
export function CampoConIcono({ icono: Icono, simbolo, className = '', children }: CampoConIconoProps) {
  return (
    <div className={`campo-icono ${className}`.trim()}>
      {Icono && <Icono className="campo-icono__icono" size={18} aria-hidden="true" focusable="false" />}
      {simbolo && (
        <span className="campo-icono__simbolo" aria-hidden="true">
          {simbolo}
        </span>
      )}
      {children}
    </div>
  )
}
