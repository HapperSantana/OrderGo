const formateador = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export function formatearMoneda(valor: number): string {
  return formateador.format(valor)
}
