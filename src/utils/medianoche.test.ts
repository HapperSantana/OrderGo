import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fechaLocalISO, msHastaMedianoche, vigilarCambioDeDia } from './medianoche'

// Las fechas se construyen en hora LOCAL (new Date(año, mes, día, ...)), así que estas pruebas valen en
// cualquier zona horaria. Se repiten con distintas zonas ejecutando, por ejemplo, TZ=Asia/Tokyo npm test.
const local = (anio: number, mes: number, dia: number, h = 0, m = 0, s = 0, ms = 0) => new Date(anio, mes - 1, dia, h, m, s, ms)

describe('fechaLocalISO', () => {
  it('da la fecha local con ceros a la izquierda', () => {
    expect(fechaLocalISO(local(2026, 3, 5, 9))).toBe('2026-03-05')
    expect(fechaLocalISO(local(2026, 12, 31, 23, 59, 59, 999))).toBe('2026-12-31')
  })

  it('un minuto antes de la medianoche sigue siendo el mismo día, y un instante después ya es el siguiente', () => {
    expect(fechaLocalISO(local(2026, 11, 8, 23, 59, 59, 999))).toBe('2026-11-08')
    expect(fechaLocalISO(local(2026, 11, 9, 0, 0, 0, 0))).toBe('2026-11-09')
  })
})

describe('msHastaMedianoche', () => {
  it('a las 23:59:50 faltan 10 segundos', () => {
    expect(msHastaMedianoche(local(2026, 11, 8, 23, 59, 50))).toBe(10_000)
  })

  it('a las 12:00 faltan 12 horas', () => {
    expect(msHastaMedianoche(local(2026, 11, 8, 12))).toBe(12 * 3_600_000)
  })

  it('justo a medianoche falta un día completo (no cero: la medianoche ya pasó)', () => {
    const ms = msHastaMedianoche(local(2026, 11, 9, 0, 0, 0, 0))
    expect(ms).toBeGreaterThanOrEqual(23 * 3_600_000)
    expect(ms).toBeLessThanOrEqual(25 * 3_600_000)
  })

  it('cruza el fin de mes y de año', () => {
    expect(msHastaMedianoche(local(2026, 12, 31, 23, 0))).toBe(3_600_000)
    expect(msHastaMedianoche(local(2026, 2, 28, 23, 30))).toBe(30 * 60_000)
  })

  it('en cualquier momento del año (incluidos los cambios de horario) es positivo y no pasa de 25 horas', () => {
    for (let dia = 0; dia < 366; dia++) {
      for (const hora of [0, 1, 2, 3, 12, 23]) {
        const ms = msHastaMedianoche(local(2026, 1, 1 + dia, hora, 30))
        expect(ms, `día ${dia} hora ${hora}`).toBeGreaterThan(0)
        expect(ms, `día ${dia} hora ${hora}`).toBeLessThanOrEqual(25 * 3_600_000)
      }
    }
  })
})

describe('vigilarCambioDeDia', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // Un "documento" mínimo para probar el aviso de volver a la pestaña sin navegador.
  function crearVisibilidad() {
    const escuchadores = new Set<() => void>()
    const fuente = {
      visibilityState: 'visible',
      addEventListener: (_tipo: 'visibilitychange', f: () => void) => void escuchadores.add(f),
      removeEventListener: (_tipo: 'visibilitychange', f: () => void) => void escuchadores.delete(f),
    }
    return { fuente, avisar: () => escuchadores.forEach((f) => f()), cantidad: () => escuchadores.size }
  }

  it('avisa al pasar la medianoche, con la fecha nueva y la anterior', () => {
    vi.setSystemTime(local(2026, 11, 8, 23, 59, 50))
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: crearVisibilidad().fuente })

    vi.advanceTimersByTime(9_000)
    expect(alCambiar).not.toHaveBeenCalled() // todavía son las 23:59:59

    vi.advanceTimersByTime(2_000) // ya pasó la medianoche
    expect(alCambiar).toHaveBeenCalledTimes(1)
    expect(alCambiar).toHaveBeenCalledWith('2026-11-09', '2026-11-08')
  })

  it('NO avisa si el día no cambió', () => {
    vi.setSystemTime(local(2026, 11, 8, 10))
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: crearVisibilidad().fuente })
    vi.advanceTimersByTime(3 * 3_600_000)
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('sigue vigilando: avisa también la noche siguiente y la otra', () => {
    vi.setSystemTime(local(2026, 11, 8, 23, 59, 0))
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: crearVisibilidad().fuente })
    vi.advanceTimersByTime(2 * 60_000)
    vi.advanceTimersByTime(24 * 3_600_000)
    vi.advanceTimersByTime(24 * 3_600_000)
    expect(alCambiar.mock.calls.map((llamada) => llamada.join('<-'))).toEqual(['2026-11-09<-2026-11-08', '2026-11-10<-2026-11-09', '2026-11-11<-2026-11-10'])
  })

  it('al dejar de vigilar no vuelve a avisar y quita su escuchador', () => {
    vi.setSystemTime(local(2026, 11, 8, 23, 59, 50))
    const { fuente, cantidad } = crearVisibilidad()
    const alCambiar = vi.fn()
    const detener = vigilarCambioDeDia(alCambiar, { visibilidad: fuente })
    expect(cantidad()).toBe(1)
    detener()
    expect(cantidad()).toBe(0)
    vi.advanceTimersByTime(60_000)
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('si la computadora estuvo dormida, al volver a la pestaña se detecta el cambio sin esperar al temporizador', () => {
    vi.setSystemTime(local(2026, 11, 8, 22))
    const { fuente, avisar } = crearVisibilidad()
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: fuente })

    // El reloj salta a la mañana siguiente SIN que corran los temporizadores (equipo suspendido).
    vi.setSystemTime(local(2026, 11, 9, 8))
    expect(alCambiar).not.toHaveBeenCalled()

    avisar() // la persona vuelve a la pestaña
    expect(alCambiar).toHaveBeenCalledWith('2026-11-09', '2026-11-08')
  })

  it('volver a la pestaña el mismo día no avisa', () => {
    vi.setSystemTime(local(2026, 11, 8, 15))
    const { fuente, avisar } = crearVisibilidad()
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: fuente })
    avisar()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('con la pestaña oculta no revisa al recibir el evento (revisará al volver a verla)', () => {
    vi.setSystemTime(local(2026, 11, 8, 22))
    const { fuente, avisar } = crearVisibilidad()
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: fuente })
    vi.setSystemTime(local(2026, 11, 9, 8))
    fuente.visibilityState = 'hidden'
    avisar()
    expect(alCambiar).not.toHaveBeenCalled()
    fuente.visibilityState = 'visible'
    avisar()
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })

  it('no avisa dos veces por el mismo cambio (temporizador y regreso a la pestaña a la vez)', () => {
    vi.setSystemTime(local(2026, 11, 8, 23, 59, 59))
    const { fuente, avisar } = crearVisibilidad()
    const alCambiar = vi.fn()
    vigilarCambioDeDia(alCambiar, { visibilidad: fuente })
    vi.advanceTimersByTime(2_000)
    avisar()
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })

  it('si el temporizador despierta unos milisegundos ANTES de la medianoche, vuelve a intentarlo y lo detecta', () => {
    vi.setSystemTime(local(2026, 11, 8, 23, 59, 59, 900))
    const alCambiar = vi.fn()
    // Un reloj que va 300 ms atrasado simula un temporizador impreciso: al despertar todavía es el mismo día.
    let atraso = 300
    vigilarCambioDeDia(alCambiar, { ahora: () => new Date(Date.now() - atraso), visibilidad: crearVisibilidad().fuente })
    vi.advanceTimersByTime(300)
    expect(alCambiar).not.toHaveBeenCalled()
    atraso = 0
    vi.advanceTimersByTime(1_000)
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })
})
