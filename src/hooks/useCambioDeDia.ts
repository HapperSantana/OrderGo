import { useEffect, useRef, useState } from 'react'
import { fechaLocalISO, vigilarCambioDeDia } from '../utils/medianoche'

// CC10: devuelve la fecha de hoy ("AAAA-MM-DD", hora local) y se actualiza sola cuando cambia el día, aunque la
// aplicación se quede abierta toda la noche. Opcionalmente avisa con (fechaNueva, fechaAnterior) para que quien
// lo use recargue sus datos o avance sus filtros.
export function useCambioDeDia(alCambiarDeDia?: (nuevaFecha: string, fechaAnterior: string) => void): string {
  const [hoy, setHoy] = useState(() => fechaLocalISO(new Date()))

  // Siempre se llama a la versión más reciente de la función, sin volver a suscribirse en cada render.
  const escuchador = useRef(alCambiarDeDia)
  useEffect(() => {
    escuchador.current = alCambiarDeDia
  })

  useEffect(
    () =>
      vigilarCambioDeDia((nuevaFecha, fechaAnterior) => {
        setHoy(nuevaFecha)
        escuchador.current?.(nuevaFecha, fechaAnterior)
      }),
    [],
  )

  return hoy
}
