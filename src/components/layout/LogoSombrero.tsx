interface LogoSombreroProps {
  // Ancho en píxeles; el alto se calcula para conservar la proporción.
  tamano?: number;
  className?: string;
}

// Logotipo de OrderGo: sombrero de chef. Es decorativo (aria-hidden): el nombre
// de la marca siempre va escrito al lado como texto.
// La banda es clara porque está pensado para fondos oscuros (barra verde, panel de inicio de sesión).
export function LogoSombrero({ tamano = 40, className }: LogoSombreroProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 38"
      width={tamano}
      height={Math.round((tamano * 38) / 44)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M11 27h22v7a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 11 34z"
        fill="#fcf8f4"
      />
      <path
        d="M12 26C7 25.4 4 22.2 4 18.2c0-4 3.2-7.2 7.6-7.4C13 6.9 16.8 4.5 22 4.5s9 2.4 10.4 6.3C36.8 11 40 14.2 40 18.2c0 4-3 7.2-8 7.8z"
        fill="#cc4c24"
      />
    </svg>
  );
}
