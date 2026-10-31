import type { LucideIcon } from 'lucide-react'
import { Lema } from './Lema'

interface EncabezadoPaginaProps {
  icono: LucideIcon
  titulo: string
  descripcion: string
}

// Encabezado de cada pantalla: ícono decorativo (naranja) junto al título de la página.
export function EncabezadoPagina({ icono: Icono, titulo, descripcion }: EncabezadoPaginaProps) {
  return (
    <div className="encabezado-pagina">
      <div className="encabezado-pagina__texto">
        <h1 className="encabezado-pagina__titulo">
          <Icono className="encabezado-pagina__icono" size={30} strokeWidth={1.75} aria-hidden="true" focusable="false" />
          {titulo}
        </h1>
        <p>{descripcion}</p>
      </div>
      <Lema />
    </div>
  )
}
