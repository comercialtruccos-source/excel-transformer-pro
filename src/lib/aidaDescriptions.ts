import { fixSpanishOrthography } from "./spanishOrthography";
import { PdfDesignData } from "./pdfParser";

// Deterministic string hashing for unique per-product variation
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
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

export interface AIDAStructure {
  atencion: string;
  interes: string;
  deseo: string;
  accion: string;
  fullHTML: string;
  fullText: string;
}

// ===== VARIACIONES DE ATENCIÓN =====
const atencionBlusa = [
  (n: string, mood: string) => `Eleva tu look con la ${n} que toda mujer necesita esta temporada. Inspirada en la tendencia ${mood}.`,
  (n: string, mood: string) => `Dale un giro a tu estilo con esta ${n} que irradia frescura y feminidad dentro de la colección ${mood}.`,
  (n: string, mood: string) => `Tu próxima prenda favorita ya está aquí. Conoce la ${n} diseñada para destacar en cualquier ocasión.`,
  (n: string, mood: string) => `Estilo, actitud y sofisticación se encuentran en esta ${n} de la colección ${mood}.`,
  (n: string, mood: string) => `Reinventa tu guardarropa con la ${n} perfecta para crear looks inolvidables.`,
  (n: string, mood: string) => `Frescura y distinción en una sola pieza: la ${n} que complementa tu estilo único.`,
];

const atencionJean = [
  (n: string, mood: string) => `¿Buscas el fit perfecto que moldee tu silueta sin sacrificar comodidad? Conoce el ${n} de la colección ${mood}.`,
  (n: string, mood: string) => `El jean que estabas esperando para realzar tu figura con elegancia: ${n} en tendencia ${mood}.`,
  (n: string, mood: string) => `Reinventa tu estilo denim con el ${n} diseñado para adaptarse a tu ritmo diario.`,
  (n: string, mood: string) => `Confort absoluto y horma envidiable en cada detalle del ${n} de la colección ${mood}.`,
  (n: string, mood: string) => `Lleva tu estilo urbano al siguiente nivel con el ${n} imprescindible de esta temporada.`,
  (n: string, mood: string) => `Definición, ajuste y actitud en una prenda icónica: el ${n} que transforma tu outfit.`,
];

const atencionPlusSize = [
  (n: string, mood: string) => `Descubre la ${n} que celebra cada curva con estilo, sofisticación y la tendencia ${mood}.`,
  (n: string, mood: string) => `Tu cuerpo, tu confianza: la ${n} diseñada para brindarte un calce envolvente y espectacular.`,
  (n: string, mood: string) => `Estilo sin límites. Abraza tu silueta con la ${n} de la colección ${mood}.`,
  (n: string, mood: string) => `Moda real para mujeres reales: la ${n} que combina horma anatómica y confort total.`,
  (n: string, mood: string) => `Llega la ${n} Plus Size pensada para hacerte sentir poderosa, cómoda y radiante.`,
];

// ===== VARIACIONES DE INTERÉS =====
const interesList = [
  (c: string, det: string) => `Elaborada en ${c}, su textura de alta calidad garantiza suavidad al contacto con la piel y una caída favorecedora. Sus detalles de confección (${det}) aportan un acabado refinado y duradero.`,
  (c: string, det: string) => `Confeccionada con un equilibrado tejido en ${c}, esta prenda ofrece flexibilidad y óptima recuperación elástica. Destaca por sus atributos únicos: ${det}.`,
  (c: string, det: string) => `Su composición en ${c} le otorga un movimiento natural y una sensación liviana durante todo el día. Cuenta con finos detalles de acabado (${det}) que la hacen irrepetible.`,
  (c: string, det: string) => `Diseñada en ${c}, combina resistencia y frescura para acompañarte en tus mejores momentos. Incorpora acentos de diseño como ${det} para un look sofisticado.`,
  (c: string, det: string) => `El tejido premium en ${c} se adapta con naturalidad a tu cuerpo, conservando su forma lavado tras lavado. Los detalles de ${det} elevan su presencia visual.`,
];

// ===== VARIACIONES DE DESEO =====
const deseoList = [
  (st: string, occ: string) => `Ideal para entornos de ${occ}. Siente la seguridad de vestir una pieza versátil que resalta lo mejor de ti. Tip de styling sugerido: ${st}.`,
  (st: string, occ: string) => `Una prenda comodín pensada para elevar tus looks de ${occ}. Diseñada para hacerte lucir arreglada sin esfuerzo. Consejo de combinación: ${st}.`,
  (st: string, occ: string) => `Transmite confianza y estilo auténtico donde vayas. Perfecta para un día de ${occ}. Recomendación de diseño: ${st}.`,
  (st: string, occ: string) => `Es la pieza clave que resuelve cualquier dilema de vestuario para ${occ}. proyectando elegancia y frescura. Llévala con: ${st}.`,
  (st: string, occ: string) => `Diseñada para mujeres exigentes que valoran el equilibrio entre confort y tendencia en momentos de ${occ}. ${st}.`,
];

// ===== VARIACIONES DE ACCIÓN =====
const accionList = [
  () => `Haz de esta pieza el nuevo imprescindible de tu guardarropa y marca la diferencia hoy.`,
  () => `Agrégala a tu pedido ahora y descubre por qué se convertirá en tu opción favorita.`,
  () => `No esperes más para renovar tu colección con esta prenda estrella de edición limitada.`,
  () => `Haz clic para asegurar la tuya y llevar tu estilo al siguiente nivel.`,
  () => `Dale el upgrade que tu closet merece con esta pieza pensada para destacar.`,
];

/**
 * Generates structured AIDA representation and HTML for Shopify, dynamically incorporating PDF design notes.
 */
export function generateAIDAStructure(
  nombre: string,
  composicion: string,
  referencia: string,
  pdfDesign?: PdfDesignData
): AIDAStructure {
  const ref = referencia.trim().toUpperCase();
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
  const h = hashString(referencia + nombre);

  const mood = pdfDesign?.collectionTitle || "Tendencia Esenciales & Denim";
  const occ = pdfDesign?.occasion || "Casual Chic & Uso Diario";
  const det = pdfDesign?.details?.length ? pdfDesign.details.join(", ") : "Horma anatómica y diseño exclusivo";
  const st = pdfDesign?.styling || "Combínalo con blazer o chaqueta denim para elevar tu estilo.";

  let atencion: string;
  if (ref.startsWith("P")) {
    atencion = pick(atencionPlusSize, h, 0)(nombreLower, mood);
  } else if (ref.startsWith("J") || /jean|pantalón|pantalon/i.test(nombre)) {
    atencion = pick(atencionJean, h, 0)(nombreLower, mood);
  } else {
    atencion = pick(atencionBlusa, h, 0)(nombreLower, mood);
  }

  const interes = pick(interesList, h, 1)(composicionFormatted, det);
  const deseo = pick(deseoList, h, 2)(st, occ);
  const accion = pick(accionList, h, 3)();

  const fullHTML = `<p>${atencion}</p>
<p>${interes}</p>
<p>${deseo}</p>
<p>${accion}</p>
<br>
<p><strong>REF:</strong> ${referencia}</p>
<p><strong>Elaborado en:</strong> ${composicionFormatted}</p>
<p><strong>La Modelo usa una prenda talla:</strong> ${tallaMod}</p>`;

  const fullText = `${atencion}\n\n${interes}\n\n${deseo}\n\n${accion}`;

  return {
    atencion: fixSpanishOrthography(atencion),
    interes: fixSpanishOrthography(interes),
    deseo: fixSpanishOrthography(deseo),
    accion: fixSpanishOrthography(accion),
    fullHTML,
    fullText: fixSpanishOrthography(fullText),
  };
}

export function generateAIDADescription(
  nombre: string,
  composicion: string,
  referencia: string,
  pdfDesign?: PdfDesignData
): string {
  const structure = generateAIDAStructure(nombre, composicion, referencia, pdfDesign);
  return structure.fullHTML;
}
