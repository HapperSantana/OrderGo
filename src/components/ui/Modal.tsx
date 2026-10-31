import { useEffect, useId, useRef } from 'react'
import type { MouseEvent as EventoRaton, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  // Contenido fijo al pie (por ejemplo, los botones de confirmar y cancelar).
  pie?: ReactNode
  // Clase extra para ajustar el tamaño o el contenido de esta ventana en particular.
  className?: string
  children: ReactNode
}

// Ventana emergente accesible, hecha con el elemento nativo <dialog>:
//  - showModal() deja el resto de la página inactiva (no se puede enfocar ni hacer clic
//    fuera), que es lo que hace que el foco quede "atrapado" dentro de la ventana;
//  - la tecla Escape la cierra y, al cerrarse, el foco vuelve al botón que la abrió;
//  - se cierra con un clic en el fondo oscuro, pero no si el usuario empezó a arrastrar
//    (por ejemplo, al seleccionar texto) dentro de la ventana y soltó afuera.
// Se dibuja con un portal directamente en <body>, FUERA de cualquier <form>: así, pulsar
// Enter en un campo de la ventana nunca envía el formulario que está detrás.
// El contenido solo existe mientras está abierta, así que cada apertura empieza limpia.
export function Modal({ abierto, onCerrar, titulo, pie, className = '', children }: ModalProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const idTitulo = useId()
  // ¿El clic empezó en el fondo (y no dentro del contenido)?
  const empezoEnElFondo = useRef(false)

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento || !abierto) return

    elemento.showModal()
    document.body.classList.add('modal-abierto')
    // El foco empieza en el título (lo lee el lector de pantalla) y no en un campo de
    // texto, para que en el celular no aparezca el teclado sin que nadie lo pida.
    tituloRef.current?.focus()

    return () => {
      document.body.classList.remove('modal-abierto')
      if (elemento.open) elemento.close()
    }
  }, [abierto])

  function alPresionarEnFondo(evento: EventoRaton<HTMLDialogElement>) {
    empezoEnElFondo.current = evento.target === evento.currentTarget
  }

  function alHacerClic(evento: EventoRaton<HTMLDialogElement>) {
    if (empezoEnElFondo.current && evento.target === evento.currentTarget) onCerrar()
    empezoEnElFondo.current = false
  }

  return createPortal(
    <dialog
      ref={dialogo}
      className={`modal ${className}`.trim()}
      aria-labelledby={idTitulo}
      aria-modal="true"
      // Escape: se evita el cierre nativo y se avisa al padre, que es quien decide si está abierta.
      onCancel={(evento) => {
        evento.preventDefault()
        onCerrar()
      }}
      onMouseDown={alPresionarEnFondo}
      onClick={alHacerClic}
    >
      {abierto && (
        <div className="modal__contenido">
          <header className="modal__encabezado">
            <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className="modal__titulo">
              {titulo}
            </h2>
            <button type="button" className="boton boton--icono modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <X size={18} aria-hidden="true" focusable="false" />
            </button>
          </header>
          <div className="modal__cuerpo">{children}</div>
          {pie && <footer className="modal__pie">{pie}</footer>}
        </div>
      )}
    </dialog>,
    document.body,
  )
}
