import { Wifi, WifiOff, X } from 'lucide-react'
import { useConexion } from '../../hooks/useConexion'

// Aviso global de conexión (HU10). Sin conexión se anuncia de inmediato como alerta; al volver, un aviso
// amable invita a actualizar la página, porque lo que falló al cargar no se vuelve a pedir solo.
export function AvisoConexion() {
  const { enLinea, seRestablecio, cerrarAvisoDeRestablecida } = useConexion()

  if (!enLinea) {
    return (
      <div className="aviso-conexion aviso-conexion--sin" role="alert">
        <WifiOff size={20} aria-hidden="true" focusable="false" />
        <p>
          <strong>Sin conexión a internet.</strong> Lo que ya cargó sigue a la vista, pero los cambios no se guardarán hasta que vuelva
          la conexión.
        </p>
      </div>
    )
  }

  if (seRestablecio) {
    return (
      <div className="aviso-conexion aviso-conexion--ok" role="status">
        <Wifi size={20} aria-hidden="true" focusable="false" />
        <p>
          <strong>Conexión restablecida.</strong> Actualiza la página para ver los datos más recientes.
        </p>
        <button type="button" className="boton boton--secundario" onClick={() => window.location.reload()}>
          Actualizar página
        </button>
        <button type="button" className="boton boton--icono" onClick={cerrarAvisoDeRestablecida} aria-label="Cerrar aviso de conexión restablecida">
          <X size={18} aria-hidden="true" focusable="false" />
        </button>
      </div>
    )
  }

  return null
}
