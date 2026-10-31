import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { EMOJIS_CATEGORIA } from '../../utils/categorias'

interface SelectorEmojiProps {
  valor: string | null
  onChange: (emoji: string | null) => void
  disabled?: boolean
  // Texto para lectores de pantalla (ej. "Emoji de la categoría").
  etiqueta?: string
}

// Botón que muestra el emoji elegido y abre una cuadrícula con los emojis
// disponibles (lista cerrada de comida). Se maneja con ratón o teclado:
// Enter/Espacio abre, Tab recorre los emojis, Escape cierra y devuelve el foco.
export function SelectorEmoji({ valor, onChange, disabled, etiqueta = 'Emoji' }: SelectorEmojiProps) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)

  // Mientras está abierto: un clic fuera lo cierra, y el foco pasa al emoji elegido (o al primero).
  useEffect(() => {
    if (!abierto) return

    function alHacerClicFuera(evento: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', alHacerClicFuera)

    const botones = contenedor.current?.querySelectorAll<HTMLButtonElement>('.selector-emoji__opcion')
    const elegido = Array.from(botones ?? []).find((b) => b.getAttribute('aria-pressed') === 'true')
    ;(elegido ?? botones?.[0])?.focus()

    return () => document.removeEventListener('mousedown', alHacerClicFuera)
  }, [abierto])

  function elegir(emoji: string | null) {
    onChange(emoji)
    setAbierto(false)
    boton.current?.focus()
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape' && abierto) {
      evento.stopPropagation()
      setAbierto(false)
      boton.current?.focus()
    }
  }

  return (
    <div className="selector-emoji" ref={contenedor} onKeyDown={alTeclear}>
      <button
        ref={boton}
        type="button"
        className={`selector-emoji__boton${valor ? '' : ' selector-emoji__boton--vacio'}`}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={`${etiqueta}: ${valor ?? 'ninguno'}. Cambiar`}
        disabled={disabled}
        onClick={() => setAbierto((actual) => !actual)}
      >
        {valor ?? '+'}
      </button>

      {abierto && (
        <div className="selector-emoji__panel" role="group" aria-label="Elegir emoji">
          <div className="selector-emoji__cuadricula">
            {EMOJIS_CATEGORIA.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="selector-emoji__opcion"
                aria-label={emoji}
                aria-pressed={emoji === valor}
                onClick={() => elegir(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button type="button" className="boton boton--enlace selector-emoji__ninguno" onClick={() => elegir(null)}>
            Sin emoji
          </button>
        </div>
      )}
    </div>
  )
}
