// Verificación completa antes de entregar:  npm run verificar
//
//   1. Tipos (TypeScript)      2. Lint (oxlint)      3. Pruebas (Vitest)
//   4. Build real, CON variables de entorno      5. El paquete contiene la aplicación
//
// El paso 5 existe porque un build sin las variables de Supabase "termina bien" pero deja un paquete vacío
// (ver scripts/paqueteValido.mjs). Se compila en una carpeta temporal para no tocar tu carpeta "dist".
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { revisarPaquete } from './paqueteValido.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const carpetaTemporal = '.verificar-dist'

// Si ya tienes las variables definidas (en el entorno), se usan; si no, valores de ejemplo: basta con que existan.
const variables = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://ejemplo.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'clave-de-ejemplo',
}

const resultados = []

function paso(nombre, accion) {
  process.stdout.write(`… ${nombre}`)
  const inicio = Date.now()
  let detalle = ''
  let ok = false
  try {
    const salida = accion()
    ok = salida.ok
    detalle = salida.detalle ?? ''
  } catch (error) {
    detalle = String(error)
  }
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
  process.stdout.write(`\r${ok ? '✔' : '✘'} ${nombre} (${segundos} s)\n`)
  if (!ok && detalle) console.log(detalle.split('\n').map((linea) => `    ${linea}`).join('\n'))
  resultados.push({ nombre, ok })
  return ok
}

function comando(texto, env = {}) {
  // Se ejecuta como una sola cadena con shell para que funcione igual en Windows, macOS y Linux.
  const r = spawnSync(texto, { cwd: raiz, shell: true, encoding: 'utf8', env: { ...process.env, ...env } })
  const cola = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n')
  return { ok: r.status === 0, detalle: cola }
}

paso('Tipos (tsc -b)', () => comando('npx tsc -b'))
paso('Lint (oxlint)', () => comando('npm run lint'))
paso('Pruebas (npm test)', () => comando('npm test'))

const compilo = paso('Build real con variables de entorno', () => comando(`npx vite build --outDir ${carpetaTemporal} --emptyOutDir`, variables))

if (compilo) {
  paso('El paquete contiene la aplicación', () => {
    const carpetaJs = join(raiz, carpetaTemporal, 'assets')
    const archivos = existsSync(carpetaJs) ? readdirSync(carpetaJs).filter((nombre) => nombre.endsWith('.js')) : []
    const texto = archivos.map((nombre) => readFileSync(join(carpetaJs, nombre), 'utf8')).join('\n')
    const problemas = revisarPaquete(texto)
    return { ok: problemas.length === 0, detalle: problemas.join('\n') }
  })
}

rmSync(join(raiz, carpetaTemporal), { recursive: true, force: true })

const fallidos = resultados.filter((r) => !r.ok)
console.log(fallidos.length === 0 ? '\nTodo en orden: se puede entregar.' : `\nFalló ${fallidos.length} de ${resultados.length} pasos: NO se debe entregar.`)
process.exit(fallidos.length === 0 ? 0 : 1)
