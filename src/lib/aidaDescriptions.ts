import { fixSpanishOrthography } from "./spanishOrthography";
import { PdfDesignData } from "./pdfParser";

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
  archetype: "PAS" | "FAB" | "STORYTELLING" | "HYPE" | "VERSATILITY" | "SCULPTING";
  atencion: string;
  interes: string;
  deseo: string;
  accion: string;
  fullHTML: string;
  fullText: string;
}

// ===== ARCHETYPE 1: PAS (Problem - Agitate - Solution) =====
const pasAtencion = [
  (n: string, ref: string) => `¿Cansada de prendas que pierden la forma o aprietan a mitad del día? Conoce la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `¿Buscas esa prenda que arme increíble sin sacrificar tu libertad de movimiento? La ${n} (REF ${ref}) es la respuesta.`,
  (n: string, ref: string) => `El dilema de encontrar ropa elegante y realmente cómoda termina con la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `¿Te cuesta armar outfits rápidos sin caer en lo básico? La ${n} (REF ${ref}) resuelve tu look en segundos.`,
];

const pasInteres = [
  (c: string, det: string) => `Desarrollada en ${c}, su tejido de ingeniería textil resuelve la rigidez habitual. Incorpora ${det}, garantizando suavidad y frescura constante.`,
  (c: string, det: string) => `Confeccionada en ${c}, evita deformaciones y arrugas excesivas. Sus atributos (${det}) brindan el ajuste anatómico que tu cuerpo necesita.`,
  (c: string, det: string) => `Gracias a su composición en ${c}, olvídate de telas ásperas. Su estructura con ${det} acompaña tus movimientos con absoluta ligereza.`,
];

const pasDeseo = [
  (st: string, occ: string) => `Siente la tranquilidad de lucir impecable en ${occ}. Olvídate de ajustar tu ropa a cada instante. Tip de styling: ${st}.`,
  (st: string, occ: string) => `Proyecta una imagen profesional y estilizada en ${occ}. Disfruta la confianza de vestir una prenda impecable. Combínala con: ${st}.`,
];

// ===== ARCHETYPE 2: FAB (Feature - Advantage - Benefit) =====
const fabAtencion = [
  (n: string, ref: string) => `Ingeniería de diseño y alta confección: descubre los secretos de la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `Detalles premium que marcan la diferencia. Presentamos la nueva ${n} (REF ${ref}).`,
  (n: string, ref: string) => `Calidad textil y confección de vanguardia en la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `Innovación en cada costura: así es la ${n} (REF ${ref}) de la nueva colección.`,
];

const fabInteres = [
  (c: string, det: string) => `Característica principal: Tejido de alta densidad en ${c}. Ventaja: excelente flexibilidad y transpirabilidad. Beneficio: confort prolongado y resistencia lavado tras lavado (${det}).`,
  (c: string, det: string) => `Tejida en ${c} con acabado de alta definición. Permite una recuperación elástica inmediata y resalta atributos clave: ${det}.`,
];

const fabDeseo = [
  (st: string, occ: string) => `Disfruta de una prenda versátil para ${occ} que mantiene su color y estructura intactos. Sugerencia de styling: ${st}.`,
  (st: string, occ: string) => `Una inversión inteligente para tu armario. Perfecta para un look de ${occ}. Llévala con: ${st}.`,
];

// ===== ARCHETYPE 3: STORYTELLING & TENDENCIA =====
const storyAtencion = [
  (n: string, ref: string) => `Directo desde el taller de diseño: la inspiración detrás de la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `Cuando la tendencia y el arte de la confección se unen, nace la ${n} (REF ${ref}).`,
  (n: string, ref: string) => `Una declaración de estilo contemporáneo: así conceptualizamos la ${n} (REF ${ref}).`,
];

const storyInteres = [
  (c: string, det: string) => `Inspirada en el equilibrio entre sofisticación y espontaneidad, confeccionada en ${c}. Destaca por sus acabados en ${det}.`,
  (c: string, det: string) => `Creada para contar una historia de moda sin esfuerzo. Su composición en ${c} se enriquece con detalles de ${det}.`,
];

const storyDeseo = [
  (st: string, occ: string) => `Ideal para expresar tu personalidad en ${occ}. Recomendación del departamento de diseño: ${st}.`,
  (st: string, occ: string) => `Eleva tu presencia en ${occ} con una pieza con alma. Propuesta de styling: ${st}.`,
];

// ===== ARCHETYPE 4: HYPE & BESTSELLER =====
const hypeAtencion = [
  (n: string, ref: string) => `🔥 ¡ALERTA TENDENCIA! La ${n} (REF ${ref}) se perfila como la favorita de la temporada.`,
  (n: string, ref: string) => `✨ La prenda más solicitada en catálogo: ${n} (REF ${ref}).`,
  (n: string, ref: string) => `⚡ ¡Nuevo Best-Seller! Descubre por qué todas aman la ${n} (REF ${ref}).`,
];

const hypeInteres = [
  (c: string, det: string) => `Elaborada en ${c}, su éxito radica en la combinación de confort supremo y detalles visuales impactantes: ${det}.`,
  (c: string, det: string) => `Confeccionada en ${c}, esta pieza ha conquistado a nuestras clientes por su calce favorecedor y acabados en ${det}.`,
];

const hypeDeseo = [
  (st: string, occ: string) => `Asegura tu estilo para ${occ} antes de que se agoten las existencias. Styling recomendado: ${st}.`,
  (st: string, occ: string) => `Pídela hoy y sé la primera en lucirla en ${occ}. Combínala así: ${st}.`,
];

// ===== ACCIONES DINÁMICAS =====
const accionesVariadas = [
  () => `Solicita tu pedido hoy mismo antes de que se agote en inventario.`,
  () => `Haz clic para incorporar esta pieza clave a tu armario esta temporada.`,
  () => `Agrégala a tu carrito y comprueba por ti misma la diferencia de confección.`,
  () => `Escríbenos para catálogo mayorista o realiza tu compra en nuestra tienda online.`,
  () => `No dejes pasar la oportunidad de estrenar tu nuevo look favorito.`,
];

/**
 * Generates structured AIDA with distinct copy archetypes per reference
 */
export function generateAIDAStructure(
  nombre: string,
  composicion: string,
  referencia: string,
  pdfDesign?: PdfDesignData
): AIDAStructure {
  const ref = referencia.trim().toUpperCase();
  const nombreClean = fixSpanishOrthography(
    nombre
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const compClean = fixSpanishOrthography(
    composicion
      .replace(/%/g, "% ")
      .replace(/\s+/g, " ")
      .trim()
  );

  const tallaMod = getModelSize(referencia);
  const h = hashString(referencia + nombre);

  const mood = pdfDesign?.collectionTitle || "Tendencia Denim & Esenciales";
  const occ = pdfDesign?.occasion || "Casual Chic & Diario";
  const det = pdfDesign?.details?.length ? pdfDesign.details.join(", ") : "Horma anatómica y diseño exclusivo";
  const st = pdfDesign?.styling || "Combínalo con blazer o chaqueta denim para elevar tu estilo.";

  // Select Archetype dynamically based on hash
  const archetypes: AIDAStructure["archetype"][] = ["PAS", "FAB", "STORYTELLING", "HYPE", "VERSATILITY", "SCULPTING"];
  const archetype = archetypes[h % archetypes.length];

  let atencion: string;
  let interes: string;
  let deseo: string;

  if (archetype === "PAS") {
    atencion = pick(pasAtencion, h, 0)(nombreClean, referencia);
    interes = pick(pasInteres, h, 1)(compClean, det);
    deseo = pick(pasDeseo, h, 2)(st, occ);
  } else if (archetype === "FAB") {
    atencion = pick(fabAtencion, h, 0)(nombreClean, referencia);
    interes = pick(fabInteres, h, 1)(compClean, det);
    deseo = pick(fabDeseo, h, 2)(st, occ);
  } else if (archetype === "STORYTELLING") {
    atencion = pick(storyAtencion, h, 0)(nombreClean, referencia);
    interes = pick(storyInteres, h, 1)(compClean, det);
    deseo = pick(storyDeseo, h, 2)(st, occ);
  } else {
    atencion = pick(hypeAtencion, h, 0)(nombreClean, referencia);
    interes = pick(hypeInteres, h, 1)(compClean, det);
    deseo = pick(hypeDeseo, h, 2)(st, occ);
  }

  const accion = pick(accionesVariadas, h, 4)();

  const fullHTML = `<p><strong>${atencion}</strong></p>
<p>${interes}</p>
<p>${deseo}</p>
<p><strong>${accion}</strong></p>
<br>
<p><strong>REF:</strong> ${referencia}</p>
<p><strong>Composición:</strong> ${compClean}</p>
<p><strong>Colección:</strong> ${mood}</p>
<p><strong>Talla de Modelo:</strong> Talla ${tallaMod}</p>`;

  const fullText = `${atencion}\n\n${interes}\n\n${deseo}\n\n${accion}`;

  return {
    archetype,
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
