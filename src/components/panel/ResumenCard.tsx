import type { LucideIcon } from 'lucide-react'

interface ResumenCardProps {
  titulo: string
  valor: string
  detalle?: string
  destacada?: boolean
  // Ícono decorativo en la esquina de la tarjeta.
  icono?: LucideIcon
}

export function ResumenCard({ titulo, valor, detalle, destacada, icono: Icono }: ResumenCardProps) {
  return (
    <article className={`resumen-card${destacada ? ' resumen-card--destacada' : ''}`}>
      <div className="resumen-card__cabecera">
        <h3 className="resumen-card__titulo">{titulo}</h3>
        {Icono && <Icono className="resumen-card__icono" size={20} strokeWidth={1.75} aria-hidden="true" focusable="false" />}
      </div>
      <p className="resumen-card__valor">{valor}</p>
      {detalle && <p className="resumen-card__detalle">{detalle}</p>}
    </article>
  )
}
