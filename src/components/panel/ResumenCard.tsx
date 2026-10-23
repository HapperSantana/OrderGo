interface ResumenCardProps {
  titulo: string
  valor: string
  detalle?: string
  destacada?: boolean
}

export function ResumenCard({ titulo, valor, detalle, destacada }: ResumenCardProps) {
  return (
    <article className={`resumen-card${destacada ? ' resumen-card--destacada' : ''}`}>
      <h3 className="resumen-card__titulo">{titulo}</h3>
      <p className="resumen-card__valor">{valor}</p>
      {detalle && <p className="resumen-card__detalle">{detalle}</p>}
    </article>
  )
}