// Se ejecuta antes de cada archivo de pruebas. Agrega los comprobadores de DOM (toBeInTheDocument, toBeDisabled…)
// y limpia lo que cada prueba pintó. Las pruebas de componentes piden el entorno de navegador simulado con
// la primera línea del archivo:   // @vitest-environment jsdom
// Las demás pruebas siguen corriendo en Node, como antes.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
