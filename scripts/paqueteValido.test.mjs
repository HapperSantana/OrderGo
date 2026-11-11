import { describe, expect, it } from 'vitest'
import { MARCAS_DE_LA_APLICACION, MENSAJE_SIN_VARIABLES, revisarPaquete } from './paqueteValido.mjs'

const paqueteCompleto = `...${MARCAS_DE_LA_APLICACION.map((m) => `"${m}"`).join(';')}...createClient...`

describe('revisarPaquete', () => {
  it('acepta un paquete que contiene la aplicación', () => {
    expect(revisarPaquete(paqueteCompleto)).toEqual([])
  })

  it('detecta el paquete "vacío" que sale al compilar sin variables de entorno (el error de los Sprints 5 y 6)', () => {
    // Así luce: solo librerías y el mensaje de error, sin nada de la aplicación.
    const paqueteVacio = `var react=1;throw new Error("${MENSAJE_SIN_VARIABLES} VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY.")`
    const problemas = revisarPaquete(paqueteVacio)
    expect(problemas.length).toBe(1 + MARCAS_DE_LA_APLICACION.length)
    expect(problemas[0]).toContain(MENSAJE_SIN_VARIABLES)
  })

  it('detecta un paquete al que le falta parte de la aplicación, y dice cuál', () => {
    const sinCancelar = paqueteCompleto.replace('cancelar_pedido', 'otra-cosa')
    const problemas = revisarPaquete(sinCancelar)
    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toContain('cancelar_pedido')
  })

  it('detecta el error de variables aunque el resto de la aplicación esté presente', () => {
    expect(revisarPaquete(paqueteCompleto + MENSAJE_SIN_VARIABLES)).toHaveLength(1)
  })

  it('un texto vacío o ausente es un problema, no un paquete válido', () => {
    expect(revisarPaquete('')).toHaveLength(1)
    expect(revisarPaquete(undefined)).toHaveLength(1)
  })
})
