// Generador de descripciones AIDA únicas para cada producto
// Usa múltiples variaciones por bloque y un hash del nombre+referencia para seleccionar
import { fixSpanishOrthography } from "./spanishOrthography";

// Hash simple para generar un índice determinístico por producto
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], hash: number, offset = 0): T {
  return arr[(hash + offset) % arr.length];
}

export function getModelSize(referencia: string): string {
  const ref = referencia.trim().toUpperCase();
  if (ref.startsWith("P")) return "XL";
  if (ref.startsWith("B") || ref.startsWith("T")) return "S";
  return "08";
}

// ===== VARIACIONES POR LÍNEA =====

const atencionB = [
  (n: string) => `Eleva tu look con la ${n} que toda mujer moderna necesita en su armario.`,
  (n: string) => `Dale un giro a tu estilo con esta ${n} que irradia frescura y feminidad.`,
  (n: string) => `Tu próxima prenda favorita ya está aquí. Conoce la ${n} que transformará tu outfit.`,
  (n: string) => `Estilo, actitud y personalidad se encuentran en esta ${n} diseñada para brillar.`,
  (n: string) => `Deja que tu look hable por ti con la ${n} perfecta para cada momento.`,
  (n: string) => `Reinventa tu forma de vestir con la ${n} que combina tendencia y comodidad.`,
  (n: string) => `Haz de cada día una pasarela con esta ${n} que redefine la elegancia casual.`,
  (n: string) => `La ${n} que estabas buscando para completar tu guardarropa ideal.`,
];

const interesB = [
  (n: string, c: string) => `Su tejido en ${c} garantiza suavidad al tacto y un ajuste que se adapta a tu cuerpo con naturalidad. Una prenda pensada para lucir increíble en cualquier momento del día.`,
  (n: string, c: string) => `Elaborada en ${c}, cada detalle ha sido cuidado para ofrecerte una experiencia de uso incomparable. Su caída fluida y su acabado impecable la hacen única.`,
  (n: string, c: string) => `Con una composición de ${c}, esta pieza logra el equilibrio perfecto entre confort y estilo. Su diseño actual se adapta a distintas siluetas con naturalidad.`,
  (n: string, c: string) => `Fabricada en ${c}, combina ligereza y resistencia en una prenda que se siente como una segunda piel. Ideal para llevar del día a la noche sin perder estilo.`,
  (n: string, c: string) => `Su composición en ${c} le aporta una textura agradable y un movimiento natural que realza cada paso. Pensada para la mujer que valora calidad y diseño.`,
  (n: string, c: string) => `Confeccionada en ${c}, esta ${n} ofrece un tacto suave y un ajuste favorecedor que acompaña tu silueta con delicadeza.`,
  (n: string, c: string) => `El ${c} de su composición le da un acabado premium que se nota desde el primer momento. Cómoda, ligera y con un corte que favorece tu figura.`,
  (n: string, c: string) => `Gracias a su tejido en ${c}, disfrutarás de una prenda que respira, se mueve contigo y mantiene su forma lavado tras lavado.`,
];

const deseoB = [
  () => `Siente la confianza de llevar una pieza que resalta lo mejor de ti. Versatilidad, estilo y feminidad en una sola prenda.`,
  () => `Una prenda que te acompaña con elegancia a donde vayas. Perfecta para expresar tu esencia sin esfuerzo.`,
  () => `Diseñada para hacerte sentir segura y radiante. Esa pieza que buscas cuando quieres verte bien sin complicarte.`,
  () => `Combínala con todo y siempre acertarás. Es la clase de prenda que se convierte en tu aliada de estilo.`,
  () => `Porque mereces prendas que estén a la altura de tu personalidad. Esta pieza refleja fuerza, estilo y autenticidad.`,
  () => `Llévala con jeans, con falda o sola: siempre proyectará esa imagen de mujer que sabe lo que quiere.`,
  () => `Es esa prenda comodín que resuelve cualquier look y te hace sentir espectacular sin intentarlo demasiado.`,
  () => `Tu estilo habla de ti. Esta pieza dice elegancia, seguridad y buen gusto en cada detalle.`,
];

const accionB = [
  () => `No dejes pasar esta pieza clave. Hazla parte de tu estilo hoy.`,
  () => `Agrégala a tu carrito y descubre por qué se convertirá en tu favorita.`,
  () => `Renueva tu armario con esta pieza imprescindible. Tu estilo te lo agradecerá.`,
  () => `Este es el momento de darle a tu look el upgrade que merece.`,
  () => `Haz tuya esta pieza antes de que se agote y marca la diferencia.`,
  () => `Dale el sí a tu próxima prenda estrella. Tu guardarropa lo necesita.`,
  () => `Descubre lo que esta prenda puede hacer por tu estilo. Llévala hoy.`,
  () => `No esperes más. Tu nuevo look favorito está a un clic de distancia.`,
];

// Línea T
const atencionT = [
  (n: string) => `Renueva tu estilo con la ${n} que marca tendencia esta temporada.`,
  (n: string) => `Llega la ${n} que fusiona lo clásico con lo contemporáneo para un look único.`,
  (n: string) => `Tu outfit merece esta ${n} que combina actitud y sofisticación en cada detalle.`,
  (n: string) => `Descubre la ${n} que hará girar cabezas y redefinirá tu concepto de estilo.`,
  (n: string) => `La moda se vive, se siente y se lleva con piezas como esta ${n}.`,
  (n: string) => `Atrévete a lucir diferente con la ${n} que marca un antes y un después.`,
  (n: string) => `Frescura, movimiento y estilo se unen en esta ${n} que necesitas conocer.`,
  (n: string) => `La ${n} que eleva cualquier combinación y te hace lucir impecable sin esfuerzo.`,
];

const interesT = [
  (n: string, c: string) => `Elaborada en ${c}, su textura suave y su corte contemporáneo la convierten en una prenda versátil para cualquier ocasión. Combínala de mil formas y siempre lucirás impecable.`,
  (n: string, c: string) => `Su composición en ${c} le da esa caída perfecta que busca toda mujer exigente. Fresca, cómoda y con un diseño que no pasa desapercibido.`,
  (n: string, c: string) => `Confeccionada en ${c}, cada puntada refleja atención al detalle. Una prenda que se siente ligera y se ve sofisticada a la vez.`,
  (n: string, c: string) => `Con un tejido de ${c}, esta pieza ofrece el confort que necesitas y la presencia que deseas. Su corte favorece distintos tipos de cuerpo.`,
  (n: string, c: string) => `Hecha en ${c}, aporta una sensación de frescura y un movimiento natural que acompaña cada gesto con gracia.`,
  (n: string, c: string) => `El ${c} de esta prenda le otorga una textura envolvente y un look pulido que se mantiene impecable durante todo el día.`,
  (n: string, c: string) => `Tejida en ${c}, logra un balance ideal entre estructura y fluidez. Perfecta para la mujer que busca versatilidad con carácter.`,
  (n: string, c: string) => `Su fabricación en ${c} asegura durabilidad y frescura. Una inversión inteligente para tu guardarropa de temporada.`,
];

const deseoT = [
  () => `Diseñada para mujeres que buscan sentirse cómodas sin renunciar a la sofisticación. Una pieza que realza tu figura y refleja tu personalidad.`,
  () => `Para la mujer que sabe que el estilo no se compra, se construye. Esta prenda es el siguiente paso perfecto.`,
  () => `Siente cómo cada detalle fue pensado para ti. Una pieza que te empodera y te hace brillar con naturalidad.`,
  () => `Porque tu forma de vestir cuenta tu historia. Esta prenda habla de una mujer segura, moderna y auténtica.`,
  () => `Imagínate luciendo esta pieza en tu próxima salida. Esa sensación de seguridad y estilo es lo que mereces.`,
  () => `Hecha para mujeres que no siguen tendencias, las crean. Llévala con orgullo y haz que tu estilo inspire.`,
  () => `Cuando te la pongas, sentirás esa diferencia que solo da una prenda bien diseñada. Comodidad y presencia en cada paso.`,
  () => `Es el tipo de prenda que te hace sentir lista para todo. Desde una reunión casual hasta una noche especial.`,
];

const accionT = [
  () => `Descubre cómo se ve el estilo perfecto y agrégala a tu colección.`,
  () => `Lleva tu estilo al siguiente nivel. Esta pieza te está esperando.`,
  () => `No dejes que esta temporada pase sin esta pieza en tu armario.`,
  () => `Haz clic y empieza a vivir tu mejor versión de estilo.`,
  () => `Tu guardarropa merece esta actualización. Hazla tuya ahora.`,
  () => `Atrévete a estrenar algo nuevo. Esta prenda tiene tu nombre.`,
  () => `El momento es ahora. Agrega esta pieza y transforma tu look.`,
  () => `Déjate sorprender por lo que esta prenda hará por tu imagen.`,
];

// Línea P (Plus Size)
const atencionP = [
  (n: string) => `Descubre la ${n} que celebra cada curva con estilo y actitud.`,
  (n: string) => `Tu cuerpo, tus reglas. Esta ${n} fue diseñada para que te sientas increíble.`,
  (n: string) => `Estilo sin límites: la ${n} que abraza tu silueta y potencia tu confianza.`,
  (n: string) => `Porque la moda es para todas. Conoce la ${n} que redefine la elegancia en cada talla.`,
  (n: string) => `Llega la ${n} que te hará sentir poderosa, cómoda y absolutamente fabulosa.`,
  (n: string) => `Viste tu actitud con la ${n} que entiende y celebra tu cuerpo.`,
  (n: string) => `La ${n} perfecta para mujeres reales que quieren verse y sentirse espectaculares.`,
  (n: string) => `Confianza, comodidad y estilo se unen en esta ${n} pensada especialmente para ti.`,
];

const interesP = [
  (n: string, c: string) => `Confeccionada en ${c}, esta prenda ofrece un calce envolvente y cómodo que acompaña cada movimiento. Su diseño moderno y femenino es ideal tanto para el día a día como para una salida especial.`,
  (n: string, c: string) => `Su tejido en ${c} se adapta a tu cuerpo con suavidad, brindando libertad de movimiento y una silueta favorecedora. Cada detalle fue pensado para tu comodidad.`,
  (n: string, c: string) => `Elaborada en ${c}, esta pieza combina un corte inclusivo con acabados de primera. Se siente ligera, se ve elegante y te acompaña con confianza.`,
  (n: string, c: string) => `Con una composición de ${c}, logra ese ajuste perfecto que no aprieta ni marca. Una prenda que entiende tu cuerpo y lo celebra.`,
  (n: string, c: string) => `Fabricada en ${c}, su textura suave envuelve tu figura con delicadeza mientras su diseño contemporáneo le da un toque de sofisticación.`,
  (n: string, c: string) => `El ${c} de esta prenda le da una elasticidad natural que se mueve contigo. Cómoda desde la primera vez y diseñada para durar.`,
  (n: string, c: string) => `Hecha en ${c}, esta ${n} abraza tu cuerpo sin restricciones. Su caída fluida y su estructura bien pensada garantizan un look impecable.`,
  (n: string, c: string) => `Gracias a su composición en ${c}, disfrutarás de una prenda que respira, se estira y mantiene su forma. Perfecta para mujeres que no negocian su comodidad.`,
];

const deseoP = [
  () => `Porque vestir bien no tiene talla. Esta pieza resalta tu silueta con elegancia, te hace sentir segura y refleja la mujer poderosa que eres.`,
  () => `Mereces prendas que te hagan sentir hermosa tal como eres. Esta pieza fue creada con esa promesa en mente.`,
  () => `Cada curva cuenta una historia de fuerza y belleza. Esta prenda la narra con estilo y sofisticación.`,
  () => `Ponte esta prenda y siente cómo tu confianza se eleva. Diseñada para que te veas tan increíble como te sientes por dentro.`,
  () => `La moda inclusiva no es una tendencia, es un derecho. Y esta pieza lo demuestra con elegancia en cada costura.`,
  () => `Imagínate viéndote al espejo y amando lo que ves. Esta prenda fue hecha para ese momento.`,
  () => `Para la mujer que se ama y lo demuestra con lo que viste. Esta pieza es un acto de amor propio.`,
  () => `Sentirte cómoda y verte increíble no debería ser un privilegio. Con esta prenda, es tu realidad.`,
];

const accionP = [
  () => `Dale a tu guardarropa la pieza que merece y hazla tuya hoy mismo.`,
  () => `No esperes más para sentirte fabulosa. Agrega esta pieza a tu colección.`,
  () => `Tu armario necesita esta pieza. Hazla tuya y marca la diferencia.`,
  () => `El estilo que celebra tu cuerpo te espera. Llévala ahora.`,
  () => `Atrévete a vestir con confianza. Esta prenda es el primer paso.`,
  () => `Renueva tu look con una pieza que te entiende. Hazla parte de tu vida.`,
  () => `Date el gusto de estrenar algo que realmente fue pensado para ti.`,
  () => `Tu próxima prenda favorita está aquí. Solo falta que la hagas tuya.`,
];

export function generateAIDADescription(nombre: string, composicion: string, referencia: string): string {
  const nombreLower = fixSpanishOrthography(
    nombre
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const composicionFormatted = fixSpanishOrthography(
    composicion
      .replace(/%/g, "% ")
      .replace(/\s+/g, " ")
      .trim()
  );

  const tallaMod = getModelSize(referencia);
  const ref = referencia.trim().toUpperCase();

  // Hash basado en referencia + nombre para selección determinística pero única
  const h = hashString(referencia + nombre);

  let atencion: string;
  let interes: string;
  let deseo: string;
  let accion: string;

  if (ref.startsWith("P")) {
    atencion = pick(atencionP, h, 0)(nombreLower);
    interes = pick(interesP, h, 1)(nombreLower, composicionFormatted);
    deseo = pick(deseoP, h, 2)();
    accion = pick(accionP, h, 3)();
  } else if (ref.startsWith("T")) {
    atencion = pick(atencionT, h, 0)(nombreLower);
    interes = pick(interesT, h, 1)(nombreLower, composicionFormatted);
    deseo = pick(deseoT, h, 2)();
    accion = pick(accionT, h, 3)();
  } else {
    atencion = pick(atencionB, h, 0)(nombreLower);
    interes = pick(interesB, h, 1)(nombreLower, composicionFormatted);
    deseo = pick(deseoB, h, 2)();
    accion = pick(accionB, h, 3)();
  }

  return `<p>${atencion}</p>
<p>${interes}</p>
<p>${deseo}</p>
<p>${accion}</p>
<br>
<p>REF: ${referencia}.</p>
<p>Elaborado en: ${composicionFormatted}</p>
<p>La Modelo usa una prenda talla ${tallaMod}</p>`;
}
