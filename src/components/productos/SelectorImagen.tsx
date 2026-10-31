import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { SeleccionImagen } from '../../types/producto'
import { validarArchivoImagen } from '../../utils/imagenProducto'
import { MiniaturaProducto } from './MiniaturaProducto'

interface SelectorImagenProps {
  // URL de la imagen que el producto ya tiene (al editar), o null.
  urlActual: string | null
  nombreProducto: string
  onChange: (seleccion: SeleccionImagen) => void
  disabled?: boolean
}

// Elegir, cambiar o quitar la imagen de un producto, con vista previa.
// El componente guarda su propia selección y la comunica con onChange; para
// reiniciarlo (después de guardar o cancelar) el padre le cambia la `key`.
export function SelectorImagen({ urlActual, nombreProducto, onChange, disabled }: SelectorImagenProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [quitar, setQuitar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Siempre apunta a la URL temporal vigente, para liberarla al reemplazarla o al desmontar.
  const urlTemporal = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (urlTemporal.current) URL.revokeObjectURL(urlTemporal.current)
    }
  }, [])

  function soltarVistaPrevia() {
    if (urlTemporal.current) URL.revokeObjectURL(urlTemporal.current)
    urlTemporal.current = null
  }

  function actualizar(nuevoArchivo: File | null, nuevoQuitar: boolean, nuevaVistaPrevia: string | null) {
    setArchivo(nuevoArchivo)
    setQuitar(nuevoQuitar)
    setVistaPrevia(nuevaVistaPrevia)
    onChange({ archivo: nuevoArchivo, quitar: nuevoQuitar })
  }

  function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0] ?? null
    // Se vacía el input para poder elegir de nuevo el mismo archivo si se quita y se vuelve a elegir.
    evento.target.value = ''
    if (!elegido) return

    const problema = validarArchivoImagen(elegido)
    if (problema) {
      setError(problema)
      return
    }

    setError(null)
    soltarVistaPrevia()
    urlTemporal.current = URL.createObjectURL(elegido)
    actualizar(elegido, false, urlTemporal.current)
  }

  function alQuitar() {
    setError(null)
    soltarVistaPrevia()
    // Si el producto ya tenía imagen, se marca para quitarla al guardar; si era
    // solo una selección nueva, basta con descartarla.
    actualizar(null, Boolean(urlActual), null)
  }

  function alDeshacer() {
    actualizar(null, false, null)
  }

  const urlMostrada = vistaPrevia ?? (quitar ? null : urlActual)
  const hayImagen = Boolean(urlMostrada)

  return (
    <div className="selector-imagen">
      <div className="selector-imagen__vista">
        <MiniaturaProducto url={urlMostrada} nombre={nombreProducto} tamano={88} />
      </div>

      <div className="selector-imagen__controles">
        <div className="selector-imagen__botones">
          <label className={`boton boton--secundario selector-imagen__elegir${disabled ? ' selector-imagen__elegir--desactivado' : ''}`}>
            {hayImagen ? 'Cambiar imagen' : 'Elegir imagen'}
            <input
              type="file"
              className="selector-imagen__input"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={alElegir}
            />
          </label>

          {hayImagen && (
            <button type="button" className="boton boton--enlace" onClick={alQuitar} disabled={disabled}>
              Quitar imagen
            </button>
          )}

          {quitar && (
            <button type="button" className="boton boton--enlace" onClick={alDeshacer} disabled={disabled}>
              Conservar la imagen actual
            </button>
          )}
        </div>

        {quitar ? (
          <p className="selector-imagen__ayuda">La imagen se quitará al guardar.</p>
        ) : (
          <p className="selector-imagen__ayuda">JPG, PNG o WebP. Se ajusta automáticamente a un tamaño ligero.</p>
        )}

        {error && (
          <p className="mensaje-error mensaje-error--compacto" role="alert">
            {error}
          </p>
        )}

        {/* Lectores de pantalla: avisa qué archivo quedó elegido */}
        <span className="solo-lectores" role="status">
          {archivo ? `Imagen seleccionada: ${archivo.name}` : ''}
        </span>
      </div>
    </div>
  )
}
