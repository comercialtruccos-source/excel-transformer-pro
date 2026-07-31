import { fixSpanishOrthography } from "./spanishOrthography";
import { PdfDesignData } from "./pdfParser";

export function getModelSize(referencia: string): string {
  const ref = referencia.trim().toUpperCase();
  if (ref.startsWith("P")) return "XL";
  if (ref.startsWith("B") || ref.startsWith("T")) return "S";
  return "08";
}

export interface AIDAStructure {
  archetype: string;
  atencion: string;
  interes: string;
  deseo: string;
  accion: string;
  fullHTML: string;
  fullText: string;
}

/**
 * Parses product name to extract micro design features (necklines, sleeves, accents, silhouettes)
 */
function parseProductMicroDetails(nombre: string): {
  category: string;
  neckline?: string;
  sleeves?: string;
  accents: string[];
  silhouette?: string;
} {
  const n = nombre.toLowerCase();
  const accents: string[] = [];

  // Detect category
  let category = "Prenda";
  if (n.includes("blusa")) category = "Blusa";
  else if (n.includes("jean")) category = "Jean";
  else if (n.includes("pantalon") || n.includes("pantalón")) category = "Pantalón";
  else if (n.includes("chamarra") || n.includes("chaqueta")) category = "Chaqueta";
  else if (n.includes("vestido")) category = "Vestido";
  else if (n.includes("enterizo") || n.includes("jumpsuit")) category = "Enterizo";
  else if (n.includes("top")) category = "Top";
  else if (n.includes("camisa")) category = "Camisa";

  // Neckline
  let neckline: string | undefined;
  if (n.includes("escote en v") || n.includes("escote v")) neckline = "escote en V";
  else if (n.includes("cuello camisero")) neckline = "cuello camisero";
  else if (n.includes("cuello alto")) neckline = "cuello alto";
  else if (n.includes("escote cruzado")) neckline = "escote cruzado";
  else if (n.includes("cuello redondo")) neckline = "cuello redondo";
  else if (n.includes("escote bandeja")) neckline = "escote bandeja";

  // Sleeves
  let sleeves: string | undefined;
  if (n.includes("manga corta")) sleeves = "manga corta";
  else if (n.includes("manga larga")) sleeves = "manga larga";
  else if (n.includes("sisa") || n.includes("sin manga")) sleeves = "sisa";
  else if (n.includes("manga 3/4")) sleeves = "manga 3/4";
  else if (n.includes("manga bombacha") || n.includes("manga abullonada")) sleeves = "manga bombacha";

  // Accents & Embellishments
  if (n.includes("perla")) accents.push("detalles de perlas");
  if (n.includes("brillo") || n.includes("lurex")) accents.push("acabado con destellos de brillo");
  if (n.includes("tacha") || n.includes("remache")) accents.push("aplicaciones de tachas");
  if (n.includes("bordado")) accents.push("bordado exclusivo");
  if (n.includes("encaje")) accents.push("detalles en encaje");
  if (n.includes("estampado")) accents.push("estampado de temporada");
  if (n.includes("lazo") || n.includes("amarradura")) accents.push("lazo ajustable");
  if (n.includes("rotura") || n.includes("destroy")) accents.push("detalles destruidos de tendencia");
  if (n.includes("cierre") || n.includes("cremallera")) accents.push("cierre metálico");

  // Silhouette / Cut
  let silhouette: string | undefined;
  if (n.includes("bota ancha")) silhouette = "corte bota ancha";
  else if (n.includes("bota recta")) silhouette = "corte bota recta";
  else if (n.includes("wide leg")) silhouette = "silueta wide leg";
  else if (n.includes("skinny")) silhouette = "corte ajustado skinny";
  else if (n.includes("oversize") || n.includes("holgado")) silhouette = "silueta oversize de calce holgado";
  else if (n.includes("plus size")) silhouette = "corte Plus Size anatómico";

  return { category, neckline, sleeves, accents, silhouette };
}

/**
 * Builds 100% SPECIFIC AIDA copy without generic AI filler phrases.
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

  const micro = parseProductMicroDetails(nombre);
  const tallaMod = getModelSize(referencia);

  const mood = pdfDesign?.collectionTitle || "Colección Tendencias Denim";
  const occ = pdfDesign?.occasion || "Uso Diario & Casual Chic";
  const st = pdfDesign?.styling || "Combínalo con pantalones de tiro alto o jeans para un outfit impecable.";

  // Build specific feature phrase
  const featureParts: string[] = [];
  if (micro.neckline) featureParts.push(`con ${micro.neckline}`);
  if (micro.sleeves) featureParts.push(micro.sleeves);
  if (micro.silhouette) featureParts.push(micro.silhouette);
  if (micro.accents.length) featureParts.push(`y ${micro.accents.join(" y ")}`);

  const specificFeatureDesc = featureParts.length ? featureParts.join(" ") : "con detalles de confección exclusiva";

  // Build 100% SPECIFIC AIDA blocks (No generic filler)
  const atencion = `${nombreClean} (REF ${ref}) ${specificFeatureDesc}. Una pieza pensada para destacar dentro de la colección ${mood}.`;

  const interes = `Confeccionada en ${compClean}, su tejido ofrece una sensación suave al tacto y excelente flexibilidad. ${pdfDesign?.washOrFabricNotes || "Conserva su horma y color lavado tras lavado."}`;

  const deseo = `Ideal para lucir en ${occ}. Su diseño resalta lo mejor de tu figura brindando confort ininterrumpido. ${pdfDesign?.designNotes ? `Nota de diseño: "${pdfDesign.designNotes}". ` : ""}${st}`;

  const accion = `Disponible en catálogo. Solicita la REF ${ref} en tus tallas y tonos preferidos hoy mismo.`;

  const fullHTML = `<p><strong>${atencion}</strong></p>
<p>${interes}</p>
<p>${deseo}</p>
<p><strong>${accion}</strong></p>
<br>
<p><strong>REFERENCIA:</strong> ${referencia}</p>
<p><strong>COMPOSICIÓN:</strong> ${compClean}</p>
<p><strong>COLECCIÓN:</strong> ${mood}</p>
<p><strong>TALLA DE MODELO:</strong> Talla ${tallaMod}</p>`;

  const fullText = `${atencion}\n\n${interes}\n\n${deseo}\n\n${accion}`;

  return {
    archetype: micro.category,
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
