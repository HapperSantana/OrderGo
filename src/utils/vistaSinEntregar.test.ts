import { describe, expect, it } from 'vitest'
import { VISTA_SIN_ENTREGAR, crearFiltrosIniciales, filtrosDeVista, filtrosParaVerSinEntregar, sonFiltrosIniciales } from './filtrosPedidos'
import { RUTA_PEDIDOS_SIN_ENTREGAR, resumirConsultaPendientes } from './pedidosPendientes'

// El aviso del panel (CC08) lleva a la lista de pedidos por una dirección; estas pruebas vigilan que la lista
// entienda justo la dirección que arma el panel.

describe('vista "Sin entregar" por dirección', () => {
  const HOY = '2026-11-09'

  it('sin parámetro (o con uno desconocido) la lista abre en la vista de hoy de siempre', () => {
    expect(filtrosDeVista(null, HOY)).toEqual(crearFiltrosIniciales(HOY))
    expect(filtrosDeVista('otra-cosa', HOY)).toEqual(crearFiltrosIniciales(HOY))
    expect(filtrosDeVista('', HOY)).toEqual(crearFiltrosIniciales(HOY))
  })

  it('con vista=sin-entregar abre en "Sin entregar", sin límite de fechas y sin otros filtros', () => {
    const f = filtrosDeVista(VISTA_SIN_ENTREGAR, HOY)
    expect([f.estado, f.desde, f.hasta, f.pago, f.metodo, f.cliente]).toEqual(['sin_entregar', '', '', 'todos', 'todos', ''])
  })

  it('esa vista NO cuenta como "la vista de hoy" (por eso no se mueve a medianoche ni muestra el aviso)', () => {
    expect(sonFiltrosIniciales(filtrosParaVerSinEntregar(HOY), HOY)).toBe(false)
  })

  it('el botón de la lista y la dirección del panel dan exactamente los mismos filtros', () => {
    expect(filtrosDeVista(VISTA_SIN_ENTREGAR, HOY)).toEqual(filtrosParaVerSinEntregar(HOY))
  })

  it('la dirección que arma el panel es la que entiende la lista (ida y vuelta)', () => {
    expect(RUTA_PEDIDOS_SIN_ENTREGAR).toBe('/pedidos?vista=sin-entregar')
    const [ruta, consulta] = RUTA_PEDIDOS_SIN_ENTREGAR.split('?')
    expect(ruta).toBe('/pedidos')
    expect(filtrosDeVista(new URLSearchParams(consulta).get('vista'), HOY).estado).toBe('sin_entregar')
  })
})

describe('resumirConsultaPendientes (la consulta liviana del panel)', () => {
  it('sin pendientes: cero y sin fecha', () => {
    expect(resumirConsultaPendientes(0, null)).toEqual({ cantidad: 0, masAntiguo: null })
  })

  it('con pendientes: la cantidad y la fecha LOCAL del más antiguo', () => {
    const masAntiguo = new Date(2026, 10, 7, 19, 30).toISOString() // 7 de noviembre, 19:30 hora local
    expect(resumirConsultaPendientes(3, masAntiguo)).toEqual({ cantidad: 3, masAntiguo: '2026-11-07' })
  })

  it('una respuesta incoherente (cantidad sin fecha, o fecha sin cantidad) no inventa un aviso', () => {
    expect(resumirConsultaPendientes(2, null)).toEqual({ cantidad: 0, masAntiguo: null })
    expect(resumirConsultaPendientes(0, new Date().toISOString())).toEqual({ cantidad: 0, masAntiguo: null })
  })
})
