//import cajaJugo from '../../assets/decoracion/caja-jugo.svg'
//import ensalada from '../../assets/decoracion/ensalada.svg'
//import hoja from '../../assets/decoracion/hoja.svg'
import mancha from '../../assets/decoracion/mancha.svg'
import platoVegetales from '../../assets/decoracion/plato-vegetales.svg'
//import platoVerduras from '../../assets/decoracion/plato-verduras.svg'
import vasoCola from '../../assets/decoracion/vaso-cola.svg'

interface Pieza {
  id: string
  src: string
  lado: 'izq' | 'der'
  // Clase con el tamaño, la posición vertical y el giro de esta pieza (ver "decoracion__" en global.css).
  clase: string
}

// Piezas de cada lado, de atrás hacia adelante: primero las manchas y hojas de fondo,
// después los platos y bebidas. Cada pieza asoma por el borde de la pantalla y queda
// recortada por él, dentro del margen libre a los lados del contenido.
const PIEZAS: Pieza[] = [
  { id: 'mancha-izq-abajo', src: mancha, lado: 'izq', clase: 'decoracion__mancha-izq-abajo' },
  //{ id: 'hoja-izq-arriba', src: hoja, lado: 'izq', clase: 'decoracion__hoja-izq-arriba' },
  //{ id: 'ensalada', src: ensalada, lado: 'izq', clase: 'decoracion__ensalada' },
  //{ id: 'hoja-izq-media', src: hoja, lado: 'izq', clase: 'decoracion__hoja-izq-media' },
  { id: 'plato-vegetales', src: platoVegetales, lado: 'izq', clase: 'decoracion__plato-vegetales' },
  //{ id: 'mancha-der-arriba', src: mancha, lado: 'der', clase: 'decoracion__mancha-der-arriba' },
  //{ id: 'plato-verduras', src: platoVerduras, lado: 'der', clase: 'decoracion__plato-verduras' },
  //{ id: 'caja-jugo', src: cajaJugo, lado: 'der', clase: 'decoracion__caja-jugo' },
  //{ id: 'hoja-der-abajo', src: hoja, lado: 'der', clase: 'decoracion__hoja-der-abajo' },
  { id: 'vaso-cola', src: vasoCola, lado: 'der', clase: 'decoracion__vaso-cola' },
]

// Decoración gastronómica en los bordes de las pantallas internas. Es puramente visual:
//  - está oculta a los lectores de pantalla (aria-hidden) y no recibe clics (pointer-events: none);
//  - queda detrás del contenido y solo aparece en pantallas anchas, donde sobra espacio a los lados
//    (en pantallas angostas se oculta para no estorbar; ver global.css);
//  - nunca se dibuja encima de formularios, tablas ni de la ventana emergente;
//  - sus imágenes son perezosas (loading="lazy"): en el celular, donde está oculta, no se descargan.
export function Decoracion() {
  return (
    <div className="decoracion" aria-hidden="true">
      {PIEZAS.map((pieza) => (
        <img
          key={pieza.id}
          className={`decoracion__pieza decoracion__pieza--${pieza.lado} ${pieza.clase}`}
          src={pieza.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ))}
    </div>
  )
}
