// Deja solo los dígitos de un teléfono, para poder comparar
// "33 1234 5678", "33-1234-5678" y "3312345678" como el mismo número.
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '')
}