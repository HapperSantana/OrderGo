import { useEffect, useRef, useState } from 'react'

interface EstadoConexion {
  // ¿El navegador dice que hay conexión a internet?
  enLinea: boolean
  // La conexión volvió después de haberse perdido (y el aviso de "restablecida" todavía no se cerró).
  seRestablecio: boolean
  cerrarAvisoDeRestablecida: () => void
}

// Estado de la conexión a internet según el navegador (eventos "online" y "offline").
//
// Por qué existe: sin conexión, las consultas a Supabase se reintentan solas durante unos 9 segundos antes de
// fallar, y durante todo ese tiempo la pantalla solo dice "Cargando…". El navegador, en cambio, sabe al instante
// que no hay red (Wi-Fi caído, modo avión), así que se puede avisar de inmediato.
export function useConexion(): EstadoConexion {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [seRestablecio, setSeRestablecio] = useState(false)
  // Solo se anuncia "restablecida" si de verdad se había perdido (un cambio de red con conexión continua no cuenta).
  const estuvoSinConexion = useRef(typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    function alConectar() {
      setEnLinea(true)
      if (estuvoSinConexion.current) {
        estuvoSinConexion.current = false
        setSeRestablecio(true)
      }
    }
    function alDesconectar() {
      estuvoSinConexion.current = true
      setEnLinea(false)
      setSeRestablecio(false)
    }

    window.addEventListener('online', alConectar)
    window.addEventListener('offline', alDesconectar)
    return () => {
      window.removeEventListener('online', alConectar)
      window.removeEventListener('offline', alDesconectar)
    }
  }, [])

  return { enLinea, seRestablecio, cerrarAvisoDeRestablecida: () => setSeRestablecio(false) }
}
