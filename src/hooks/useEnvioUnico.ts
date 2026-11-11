import { useCallback, useRef } from 'react'

// Evita que un formulario se envíe dos veces (doble clic, Enter repetido, un clic más mientras carga).
//
// Por qué no basta con deshabilitar el botón mientras se guarda (`disabled={isSubmitting}`): el estado de React
// se actualiza de forma asíncrona, así que dos envíos que llegan casi a la vez todavía ven `isSubmitting = false`
// y ambos pasan. Una referencia (useRef) sí cambia al instante. En un pedido nuevo eso evitaba registrarlo dos veces.
//
// Uso:
//   const enviarUnaVez = useEnvioUnico()
//   async function handleSubmit(evento) {
//     evento.preventDefault()          // siempre ANTES de cualquier await
//     await enviarUnaVez(async () => { ...guardar... })
//   }
export function useEnvioUnico() {
  const enCurso = useRef(false)

  return useCallback(async <T>(accion: () => Promise<T>): Promise<T | undefined> => {
    if (enCurso.current) return undefined
    enCurso.current = true
    try {
      return await accion()
    } finally {
      enCurso.current = false
    }
  }, [])
}
