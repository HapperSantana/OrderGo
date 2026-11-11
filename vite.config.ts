import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Las pruebas actuales son de lógica pura (filtros, validaciones, cálculos
    // del panel), así que no necesitan un navegador simulado.
    environment: 'node',
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
        setupFiles: ['src/pruebas/configurarDom.ts'],
    // Por defecto Vitest deja vacío el contenido de los .css; la prueba de la paleta
    // (src/styles/paleta.test.ts) necesita leer global.css como texto.
    css: { include: [/global\.css/] },
  },
})
