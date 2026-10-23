import { ETIQUETAS_PERIODO } from '../../utils/resumenPanel'
import type { Periodo } from '../../utils/resumenPanel'

const PERIODOS = Object.keys(ETIQUETAS_PERIODO) as Periodo[]

interface SelectorPeriodoProps {
  periodo: Periodo
  onCambiar: (periodo: Periodo) => void
}

// Botones de opción única (Hoy / Esta semana / Este mes).
export function SelectorPeriodo({ periodo, onCambiar }: SelectorPeriodoProps) {
  return (
    <div className="selector-periodo" role="radiogroup" aria-label="Periodo del resumen">
      {PERIODOS.map((opcion) => (
        <button
          key={opcion}
          type="button"
          role="radio"
          aria-checked={opcion === periodo}
          className={`selector-periodo__opcion${opcion === periodo ? ' selector-periodo__opcion--activa' : ''}`}
          onClick={() => onCambiar(opcion)}
        >
          {ETIQUETAS_PERIODO[opcion]}
        </button>
      ))}
    </div>
  )
}