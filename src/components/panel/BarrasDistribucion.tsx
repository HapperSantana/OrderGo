export interface ItemBarra {
  clave: string
  etiqueta: string
  // Número que determina el largo de la barra (la más grande ocupa todo el ancho).
  valor: number
  // Texto que se muestra a la derecha (ej. "$150.00 · 38%").
  texto: string
  // Clase CSS que da el color de la barra (ver "barra--*" en global.css).
  claseColor: string
}

interface BarrasDistribucionProps {
  items: ItemBarra[]
  ariaLabel: string
}

// Gráfica de barras horizontales hecha con HTML y CSS (sin librerías de
// gráficas): cada fila muestra etiqueta, barra proporcional y valor.
export function BarrasDistribucion({ items, ariaLabel }: BarrasDistribucionProps) {
  const maximo = Math.max(0, ...items.map((item) => item.valor))

  return (
    <ul className="barras" role="list" aria-label={ariaLabel}>
      {items.map((item) => {
        // Un valor pequeño pero mayor que cero se dibuja con un mínimo visible.
        const ancho = maximo > 0 && item.valor > 0 ? Math.max(3, (item.valor / maximo) * 100) : 0
        return (
          <li key={item.clave} className="barras__fila" role="listitem">
            <span className="barras__etiqueta">{item.etiqueta}</span>
            <span className="barras__pista" aria-hidden="true">
              <span className={`barras__relleno ${item.claseColor}`} style={{ width: `${ancho}%` }} />
            </span>
            <span className="barras__valor">{item.texto}</span>
          </li>
        )
      })}
    </ul>
  )
}