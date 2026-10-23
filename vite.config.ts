import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Las pruebas actuales son de lógica pura (filtros, validaciones, cálculos
    // del panel), así que no necesitan un navegador simulado.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})