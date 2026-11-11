// CC10: detectar el cambio de día (la medianoche LOCAL del usuario) mientras la aplicación sigue abierta.
// Es lógica pura, sin React, para poder probarla con relojes simulados.

// Fecha en la zona horaria LOCAL, como "AAAA-MM-DD". (toISOString() daría la fecha en UTC, que de noche ya
// puede ser "mañana".)
export function fechaLocalISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

// Milisegundos que faltan para la próxima medianoche local. Se calcula con el calendario (no sumando 24 h) para
// que los días de cambio de horario (23 o 25 horas) también salgan bien. Siempre es mayor que cero.
export function msHastaMedianoche(ahora: Date): number {
  const siguiente = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0)
  return Math.max(1, siguiente.getTime() - ahora.getTime())
}

// Se espera un instante después de la medianoche antes de revisar, para no despertar un poco ANTES (los
// temporizadores del navegador no son exactos) y encontrar todavía el mismo día.
const MARGEN_MS = 250

interface FuenteDeVisibilidad {
  visibilityState: string
  addEventListener: (tipo: 'visibilitychange', escuchador: () => void) => void
  removeEventListener: (tipo: 'visibilitychange', escuchador: () => void) => void
}

interface OpcionesVigilancia {
  // Reloj (para pruebas). Por defecto, la hora real.
  ahora?: () => Date
  // De dónde llega el aviso "volví a la pestaña". Por defecto, el documento del navegador.
  visibilidad?: FuenteDeVisibilidad
}

// Llama a `alCambiar(nuevaFecha, fechaAnterior)` cada vez que cambia el día, y devuelve la función para dejar de
// vigilar. Funciona de dos maneras a la vez:
//  1. un temporizador programado para la próxima medianoche;
//  2. una revisión al volver a la pestaña: si la computadora estuvo dormida o la pestaña en segundo plano, el
//     temporizador pudo retrasarse mucho (o no dispararse a tiempo), pero la fecha real ya cambió.
export function vigilarCambioDeDia(
  alCambiar: (nuevaFecha: string, fechaAnterior: string) => void,
  opciones: OpcionesVigilancia = {},
): () => void {
  const ahora = opciones.ahora ?? (() => new Date())
  const visibilidad = opciones.visibilidad ?? (typeof document !== 'undefined' ? document : undefined)

  let fechaConocida = fechaLocalISO(ahora())
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let activo = true

  function revisar() {
    const actual = fechaLocalISO(ahora())
    if (actual === fechaConocida) return
    const anterior = fechaConocida
    fechaConocida = actual
    alCambiar(actual, anterior)
  }

  function programar() {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => {
      if (!activo) return
      revisar()
      programar() // se repite cada noche (y, si despertó antes de tiempo, reintenta en un instante)
    }, msHastaMedianoche(ahora()) + MARGEN_MS)
  }

  function alVolverALaPestana() {
    if (!activo || visibilidad?.visibilityState !== 'visible') return
    revisar()
    programar() // el temporizador pudo quedar desfasado mientras la pestaña estaba dormida
  }

  programar()
  visibilidad?.addEventListener('visibilitychange', alVolverALaPestana)

  return () => {
    activo = false
    clearTimeout(temporizador)
    visibilidad?.removeEventListener('visibilitychange', alVolverALaPestana)
  }
}
