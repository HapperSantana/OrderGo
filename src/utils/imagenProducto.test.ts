import { describe, expect, it } from 'vitest'
import {
  LADO_MAXIMO_PX,
  TAMANO_MAXIMO_ORIGINAL,
  calcularTamanoReducido,
  esRutaDelPropietario,
  extensionDeTipo,
  formatearTamano,
  rutaImagenProducto,
  validarArchivoImagen,
} from './imagenProducto'

const MB = 1024 * 1024

describe('validarArchivoImagen', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('acepta %s', (tipo) => {
    expect(validarArchivoImagen({ type: tipo, size: 500 * 1024 })).toBeNull()
  })

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain', ''])('rechaza el formato "%s"', (tipo) => {
    expect(validarArchivoImagen({ type: tipo, size: 1000 })).toBe('Formato no admitido. Usa una imagen JPG, PNG o WebP.')
  })

  it('una foto de celular de varios MB sí se acepta (se reduce antes de subirla)', () => {
    expect(validarArchivoImagen({ type: 'image/jpeg', size: 6 * MB })).toBeNull()
  })

  it('el límite del archivo original es inclusivo', () => {
    expect(validarArchivoImagen({ type: 'image/png', size: TAMANO_MAXIMO_ORIGINAL })).toBeNull()
    expect(validarArchivoImagen({ type: 'image/png', size: TAMANO_MAXIMO_ORIGINAL + 1 })).toMatch(/máximo es 10\.0 MB/)
  })

  it('indica cuánto pesa el archivo rechazado', () => {
    expect(validarArchivoImagen({ type: 'image/png', size: 12 * MB })).toBe('La imagen pesa 12.0 MB y el máximo es 10.0 MB.')
  })

  it('rechaza un archivo vacío', () => {
    expect(validarArchivoImagen({ type: 'image/png', size: 0 })).toBe('El archivo está vacío.')
  })

  it('el formato se revisa antes que el tamaño', () => {
    expect(validarArchivoImagen({ type: 'text/plain', size: 50 * MB })).toMatch(/Formato no admitido/)
  })
})

describe('formatearTamano', () => {
  it('usa KB por debajo de 1 MB y MB desde ahí', () => {
    expect(formatearTamano(2048)).toBe('2 KB')
    expect(formatearTamano(300)).toBe('1 KB')
    expect(formatearTamano(1.5 * MB)).toBe('1.5 MB')
  })
})

describe('rutaImagenProducto', () => {
  const dueno = '11111111-1111-1111-1111-111111111111'

  it('empieza por la carpeta del propietario', () => {
    expect(rutaImagenProducto(dueno, 'abc', 'image/webp')).toBe(`${dueno}/abc.webp`)
  })

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('%s usa la extensión .%s', (tipo, ext) => {
    expect(extensionDeTipo(tipo)).toBe(ext)
    expect(rutaImagenProducto(dueno, 'x', tipo).endsWith(`.${ext}`)).toBe(true)
  })

  it('una ruta generada siempre cumple la regla del propietario (igual que la restricción SQL)', () => {
    expect(esRutaDelPropietario(rutaImagenProducto(dueno, 'abc', 'image/webp'), dueno)).toBe(true)
  })
})

describe('esRutaDelPropietario (espejo de productos_imagen_path_propia)', () => {
  const ana = '11111111-1111-1111-1111-111111111111'
  const beto = '22222222-2222-2222-2222-222222222222'

  it('acepta una ruta dentro de la propia carpeta', () => {
    expect(esRutaDelPropietario(`${ana}/a.webp`, ana)).toBe(true)
  })

  it('rechaza la carpeta de otro propietario', () => {
    expect(esRutaDelPropietario(`${beto}/a.webp`, ana)).toBe(false)
  })

  it('rechaza una ruta sin archivo o sin carpeta', () => {
    expect(esRutaDelPropietario(`${ana}/`, ana)).toBe(false)
    expect(esRutaDelPropietario('a.webp', ana)).toBe(false)
  })

  it('rechaza un propietario cuyo id es prefijo de otro', () => {
    expect(esRutaDelPropietario(`${ana}-otro/a.webp`, ana)).toBe(false)
  })
})

describe('calcularTamanoReducido', () => {
  it('reduce una foto horizontal conservando la proporción', () => {
    expect(calcularTamanoReducido(3000, 2000)).toEqual({ ancho: 800, alto: 533 })
  })

  it('reduce una foto vertical', () => {
    expect(calcularTamanoReducido(2000, 3000)).toEqual({ ancho: 533, alto: 800 })
  })

  it('reduce una imagen cuadrada', () => {
    expect(calcularTamanoReducido(4000, 4000)).toEqual({ ancho: LADO_MAXIMO_PX, alto: LADO_MAXIMO_PX })
  })

  it('nunca amplía una imagen pequeña', () => {
    expect(calcularTamanoReducido(300, 200)).toEqual({ ancho: 300, alto: 200 })
    expect(calcularTamanoReducido(800, 600)).toEqual({ ancho: 800, alto: 600 })
  })

  it('una imagen apenas más grande que el límite se reduce', () => {
    expect(calcularTamanoReducido(801, 400)).toEqual({ ancho: 800, alto: 400 })
  })

  it('una imagen muy alargada no produce una dimensión de 0 píxeles', () => {
    const { ancho, alto } = calcularTamanoReducido(20000, 10)
    expect(ancho).toBe(800)
    expect(alto).toBeGreaterThanOrEqual(1)
  })

  it('respeta un límite distinto', () => {
    expect(calcularTamanoReducido(1000, 500, 100)).toEqual({ ancho: 100, alto: 50 })
  })

  it('dimensiones inválidas dan 1×1 en lugar de fallar', () => {
    expect(calcularTamanoReducido(0, 0)).toEqual({ ancho: 1, alto: 1 })
    expect(calcularTamanoReducido(Number.NaN, 10)).toEqual({ ancho: 1, alto: 1 })
  })
})
