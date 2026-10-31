import { Leaf } from 'lucide-react'

// Lema de la marca, en letra manuscrita, que acompaña el título de cada pantalla.
export const LEMA = 'El mejor gestor de pedidos para tu negocio'

// Es decorativo y se repite en todas las pantallas, por eso se oculta a los lectores de
// pantalla (aria-hidden): no aporta información que no den ya el título y la descripción.
export function Lema() {
  return (
    <p className="lema" aria-hidden="true">
      <span className="lema__texto">
        {LEMA}
        <Leaf className="lema__hoja" size={22} strokeWidth={1.75} aria-hidden="true" focusable="false" />
      </span>
      <svg className="lema__subrayado" viewBox="0 0 120 12" aria-hidden="true" focusable="false">
        <path d="M3 8C26 2 48 2 70 6C88 9 104 8 117 3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </p>
  )
}
