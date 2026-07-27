import * as XLSX from "xlsx";
import { PdfDesignData } from "./pdfParser";
import { fixSpanishOrthography } from "./spanishOrthography";

export interface MergedProductData {
  referencia: string;
  nombre: string;
  composicion: string;
  colores: string[];
  tallas: string[];
  pdfDesign?: PdfDesignData;
}

export interface TikTokStrategy {
  hooks: string[];
  videoStructure: {
    hookTime: string; // 0-3s
    detailTime: string; // 3-10s
    ctaTime: string; // 10-15s
  };
  hashtags: string[];
}

export interface InstagramStrategy {
  mainCaption: string;
  carouselSlides: {
    slideNumber: number;
    title: string;
    content: string;
  }[];
  storyIdeas: string[];
}

export interface FacebookStrategy {
  conversationalCopy: string;
  callToAction: string;
}

export interface EmailMarketingStrategy {
  subjectLines: string[];
  previewText: string;
  emailBodyHTML: string;
  emailBodyText: string;
}

export interface AdsDigitalStrategy {
  headline: string;
  primaryText: string;
  angleA: {
    title: string;
    text: string;
  };
  angleB: {
    title: string;
    text: string;
  };
}

export interface ReferenceMultichannelCopy {
  referencia: string;
  productData: MergedProductData;
  tikTok: TikTokStrategy;
  instagram: InstagramStrategy;
  facebook: FacebookStrategy;
  email: EmailMarketingStrategy;
  ads: AdsDigitalStrategy;
}

/**
 * Capitalize product name nicely
 */
function cleanProductName(nombre: string, referencia: string): string {
  if (!nombre) return `Prenda REF ${referencia}`;
  return fixSpanishOrthography(
    nombre
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Hash function to create deterministic index variations per reference
 */
function getRefHash(ref: string): number {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) {
    hash = (hash << 5) - hash + ref.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Builds merged product records by aggregating transformed HGI rows and combining with PDF design metadata.
 */
export function buildMergedProducts(
  hgiRows: string[][],
  pdfDataMap: Map<string, PdfDesignData>
): MergedProductData[] {
  if (!hgiRows || hgiRows.length < 2) return [];

  const rows = hgiRows.slice(1);
  const map = new Map<string, { nombre: string; composicion: string; colores: Set<string>; tallas: Set<string> }>();

  for (const row of rows) {
    const [, referencia, talla, color, , nombre, composicion] = row;
    if (!referencia) continue;

    const refUpper = referencia.trim().toUpperCase();
    if (!map.has(refUpper)) {
      map.set(refUpper, {
        nombre: nombre || "",
        composicion: composicion || "",
        colores: new Set(),
        tallas: new Set(),
      });
    }

    const item = map.get(refUpper)!;
    if (color) item.colores.add(color.trim());
    if (talla) item.tallas.add(talla.trim());
    if (nombre && !item.nombre) item.nombre = nombre;
    if (composicion && !item.composicion) item.composicion = composicion;
  }

  const result: MergedProductData[] = [];

  for (const [referencia, data] of map) {
    const pdfData = pdfDataMap.get(referencia);
    result.push({
      referencia,
      nombre: cleanProductName(data.nombre, referencia),
      composicion: data.composicion || "100% Algodón Premium",
      colores: Array.from(data.colores),
      tallas: Array.from(data.tallas),
      pdfDesign: pdfData,
    });
  }

  return result;
}

/**
 * Generates multichannel marketing copy dynamically harmonized with PDF design presentation data.
 */
export function generateMultichannelCopy(product: MergedProductData): ReferenceMultichannelCopy {
  const { referencia, nombre, composicion, colores, tallas, pdfDesign } = product;
  const refHash = getRefHash(referencia);

  const coloresText = colores.length ? colores.join(", ") : "Variedad de tonos";
  const tallasText = tallas.length ? tallas.join(" - ") : "Tallas estándar";

  // PDF extracted attributes or intelligent defaults
  const collectionTitle = pdfDesign?.collectionTitle || "Colección Esenciales & Tendencia Denim";
  const occasion = pdfDesign?.occasion || "Casual Chic & Diario";
  const detailsList = pdfDesign?.details?.length ? pdfDesign.details.join(", ") : "Horma anatómica y ajuste perfecto";
  const styling = pdfDesign?.styling || "Combínalo con blazer o chaqueta denim para elevar tu estilo, o con tenis para un look casual diario.";
  const designNotes = pdfDesign?.designNotes || `Diseñado dentro de la colección ${collectionTitle}, priorizando la comodidad y la horma.`;
  const washOrFabricNotes = pdfDesign?.washOrFabricNotes || "Tejido de tacto suave y alta recuperación elástica.";
  const slideRefNote = pdfDesign?.pageNumber ? `(Presentado en Diapositiva ${pdfDesign.pageNumber} del PDF)` : "";

  // Dynamic Hooks variations for TikTok
  const hookOptions = [
    [
      `¿Buscas el pantalón que arme silueta perfecta sin apretar? Mira la REF ${referencia} de la colección ${collectionTitle}. 🔥`,
      `El secreto de la colección ${collectionTitle}: ${nombre} (REF ${referencia}). ✨`,
      `¿Por qué la REF ${referencia} es la más pedida? Tela ${composicion} y ${detailsList}. 💖`,
    ],
    [
      `3 formas de combinar la ${nombre} (REF ${referencia}) según nuestro departamento de diseño. 👗`,
      `Si amas la tendencia ${collectionTitle}, tienes que probar la REF ${referencia}. 🔥`,
      `¿El fit perfecto sí existe? Pon a prueba la ${nombre} en ${composicion}. ✨`,
    ],
    [
      `Te mostramos en detalle la REF ${referencia}: ${designNotes}. 🌟`,
      `De la presentación de diseño a tu closet: Conoce la ${nombre} (REF ${referencia}). 🛍️`,
      `¿Outfit para ${occasion}? La respuesta es la REF ${referencia} de Trucco's. 💖`,
    ],
  ];

  const selectedHooks = hookOptions[refHash % hookOptions.length];

  // --- 1. TikTok & Reels ---
  const tikTok: TikTokStrategy = {
    hooks: selectedHooks,
    videoStructure: {
      hookTime: `0-3s: Gancho visual mostrando la ${nombre} en modelo o perchero con texto superpuesto: "${selectedHooks[0]}"`,
      detailTime: `3-10s: Close-up al tejido (${composicion}). Muestra de cerca los detalles (${detailsList}) y resalta: "${washOrFabricNotes}".`,
      ctaTime: `10-15s: Muestra la prenda combinada (${styling}) en tonos ${coloresText} e invita a hacer clic en la bio o WhatsApp.`,
    },
    hashtags: [
      "#TruccosJeans",
      "#DenimStyle",
      "#ModaColombia",
      `#REF${referencia}`,
      `#${collectionTitle.replace(/[^a-zA-Z0-9]/g, "")}`,
      "#JeansColombianos",
    ],
  };

  // --- 2. Instagram ---
  const mainCaption = `✨ **NUEVO INGRESO | ${collectionTitle.toUpperCase()}** ✨\n\n` +
    `Presentamos la **${nombre} (REF ${referencia})** ${slideRefNote}\n\n` +
    `🎨 **Inspiración de Diseño:** ${designNotes}\n` +
    `🌿 **Tejido & Confort:** Confeccionado en **${composicion}**. ${washOrFabricNotes}\n` +
    `🔍 **Detalles de Horma:** ${detailsList}\n` +
    `📌 **Ocasión de uso:** ${occasion}\n\n` +
    `💡 **Tip de Styling (Departamento de Diseño):**\n"${styling}"\n\n` +
    `🎨 **Colores disponibles:** ${coloresText}\n` +
    `📏 **Tallas:** ${tallasText}\n\n` +
    `👉 ¡Haz tu pedido mayorista o compra en tienda online haciendo clic en el enlace del perfil! 🛍️✨`;

  const instagram: InstagramStrategy = {
    mainCaption: fixSpanishOrthography(mainCaption),
    carouselSlides: [
      {
        slideNumber: 1,
        title: `Lámina 1: Portada & Concepto`,
        content: `Foto editorial de la ${nombre} (REF ${referencia}).\nTexto superpuesto: "${collectionTitle} | ${nombre}"`,
      },
      {
        slideNumber: 2,
        title: `Lámina 2: Textura & Lavado`,
        content: `Acercamiento al tejido en ${composicion}.\nTexto superpuesto: "${washOrFabricNotes}. Detalles: ${detailsList}."`,
      },
      {
        slideNumber: 3,
        title: `Lámina 3: Tip de Styling`,
        content: `Propuesta visual de combinación.\nTexto superpuesto: "Styling sugerido: ${styling}"`,
      },
      {
        slideNumber: 4,
        title: `Lámina 4: Colores & Pedido`,
        content: `Muestrario de tonos ${coloresText}.\nTexto superpuesto: "Disponible en tallas ${tallasText}. ¡Escríbenos para catálogo mayorista!"`,
      },
    ],
    storyIdeas: [
      `Encuesta de Tendencia: "¿Combinarías la ${nombre} para ${occasion} ☀️ o para un evento de noche 🌙?"`,
      `Detalle de Diseño: "Desliza para ver de cerca el acabado en ${composicion} de la REF ${referencia}."`,
    ],
  };

  // --- 3. Facebook ---
  const fbTemplates = [
    `Conoce la nueva ${nombre} (REF ${referencia}), parte de la colección "${collectionTitle}". Confeccionada con tela de alta resistencia en ${composicion}, te brinda una silueta moldeada y movimiento natural. ${designNotes}\n\n` +
    `✔ Atributos destacados: ${detailsList}\n` +
    `✔ Ocasión de uso: ${occasion}\n` +
    `✔ Colores disponibles: ${coloresText}\n` +
    `✔ Tallas: ${tallasText}\n\n` +
    `💡 Tip de estilo: ${styling}\n\n` +
    `Escríbenos a WhatsApp para consultar disponibilidad y precios al por mayor:`,

    `¿Buscas renovación en tu tienda o guardarropa? La REF ${referencia} (${nombre}) destaca por su tejido en ${composicion} y sus detalles en ${detailsList}. Inspirada en la tendencia ${collectionTitle}.\n\n` +
    `Ideal para quienes buscan elegancia en entornos de ${occasion}. ${washOrFabricNotes}\n\n` +
    `🎨 Tonos: ${coloresText} | 📏 Tallas: ${tallasText}\n\n` +
    `Haz clic abajo para chatear directamente con nuestras asesoras mayoristas:`,
  ];

  const facebook: FacebookStrategy = {
    conversationalCopy: fixSpanishOrthography(fbTemplates[refHash % fbTemplates.length]),
    callToAction: "Chatear en WhatsApp / Asesoría Mayorista",
  };

  // --- 4. Email Marketing ---
  const emailSubjects = [
    `✨ ${collectionTitle}: Descubre la nueva ${nombre} (REF ${referencia})`,
    `Diseño, confort y tendencia: REF ${referencia} - ${nombre}`,
    `El fit ideal para tu negocio: ${nombre} en ${composicion}`,
  ];

  const emailBodyText = `Hola,\n\n` +
    `Te presentamos la nueva ${nombre} (REF ${referencia}), pieza protagónica de la colección "${collectionTitle}".\n\n` +
    `Nota de Diseño:\n"${designNotes}"\n\n` +
    `Confeccionada en ${composicion}, esta prenda combina elasticidad superior con acabados de alta costura. ${washOrFabricNotes}\n\n` +
    `Ficha Técnica & Atributos:\n` +
    `- Referencia: ${referencia}\n` +
    `- Detalles de horma: ${detailsList}\n` +
    `- Ocasión recomendada: ${occasion}\n` +
    `- Propuesta de combinación: ${styling}\n` +
    `- Colores en catálogo: ${coloresText}\n` +
    `- Tallas disponibles: ${tallasText}\n\n` +
    `Solicita hoy mismo tu pedido mayorista y eleva las ventas de tu tienda con la calidad Trucco's.`;

  const emailBodyHTML = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6;">` +
    `<div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">` +
    `<h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">TRUCCO'S JEANS | ${collectionTitle.toUpperCase()}</h1>` +
    `</div>` +
    `<div style="padding: 25px; background-color: #fff;">` +
    `<h2 style="color: #111; margin-top: 0;">NUEVO INGRESO: ${nombre} (REF ${referencia})</h2>` +
    `<p style="font-style: italic; color: #555; background: #f8f8f8; padding: 12px; border-left: 3px solid #6366f1;">"${designNotes}"</p>` +
    `<p>Elaborada en <strong>${composicion}</strong>. ${washOrFabricNotes}</p>` +
    `<div style="background-color: #f4f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">` +
    `<h4 style="margin-top: 0; color: #333;">Ficha de Estilo & Confección:</h4>` +
    `<ul style="padding-left: 20px; margin-bottom: 0;">` +
    `<li><strong>Detalles de Horma:</strong> ${detailsList}</li>` +
    `<li><strong>Ocasión:</strong> ${occasion}</li>` +
    `<li><strong>Styling recomendado:</strong> ${styling}</li>` +
    `<li><strong>Colores:</strong> ${coloresText}</li>` +
    `<li><strong>Tallas:</strong> ${tallasText}</li>` +
    `</ul>` +
    `</div>` +
    `<p style="text-align: center; margin-top: 30px;">` +
    `<a href="#" style="background-color: #4f46e5; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Solicitar Catálogo Mayorista</a>` +
    `</p>` +
    `</div>` +
    `</div>`;

  const email: EmailMarketingStrategy = {
    subjectLines: emailSubjects,
    previewText: `Confeccionado en ${composicion}. Descubre los detalles de la colección ${collectionTitle}.`,
    emailBodyHTML,
    emailBodyText: fixSpanishOrthography(emailBodyText),
  };

  // --- 5. Ads Digitales ---
  const ads: AdsDigitalStrategy = {
    headline: `Efecto Moldeador | ${nombre} REF ${referencia}`,
    primaryText: fixSpanishOrthography(
      `¿Buscas prendas que resalten tu silueta con total comodidad? La ${nombre} (REF ${referencia}) de la colección ${collectionTitle} está elaborada en ${composicion} con ${detailsList}. ¡Ideal para ${occasion}! Solicita tu pedido online.`
    ),
    angleA: {
      title: "Ángulo A: Calidad, Horma & Tejido",
      text: fixSpanishOrthography(
        `Experimenta el ajuste perfecto de Trucco's. La REF ${referencia} combina tejido en ${composicion} con ${washOrFabricNotes}. Moldea sin apretar. Disponible en tallas ${tallasText}.`
      ),
    },
    angleB: {
      title: "Ángulo B: Tendencia de Diseño & Styling",
      text: fixSpanishOrthography(
        `Inspirada en la colección ${collectionTitle}. ${designNotes} Tip de styling: ${styling}`
      ),
    },
  };

  return {
    referencia,
    productData: product,
    tikTok,
    instagram,
    facebook,
    email,
    ads,
  };
}

/**
 * Export full multichannel marketing grid to an Excel spreadsheet file.
 */
export function exportMarketingGridToExcel(copies: ReferenceMultichannelCopy[], filename: string): void {
  const headers = [
    "REFERENCIA",
    "NOMBRE PRENDA",
    "COLECCIÓN / MOOD PDF",
    "COMPOSICIÓN",
    "COLORES",
    "TALLAS",
    "NOTAS DE DISEÑO (PDF)",
    "OCASIÓN DE USO",
    "STYLING SUGERIDO",
    "TIKTOK GANCHO 1",
    "TIKTOK GANCHO 2",
    "TIKTOK ESTRUCTURA VIDEO",
    "INSTAGRAM CAPTION",
    "INSTAGRAM CARRUSEL LÁMINAS",
    "FACEBOOK COPY",
    "EMAIL ASUNTO 1",
    "EMAIL PREVIEW TEXT",
    "EMAIL CUERPO",
    "ADS TITULAR",
    "ADS TEXTO PRIMARIO",
    "ADS ÁNGULO A (HORMA)",
    "ADS ÁNGULO B (TENDENCIA)",
  ];

  const rows = copies.map((item) => {
    const p = item.productData;
    const carouselText = item.instagram.carouselSlides
      .map((s) => `${s.title}: ${s.content}`)
      .join("\n\n");

    return [
      item.referencia,
      p.nombre,
      p.pdfDesign?.collectionTitle || "Colección Esenciales",
      p.composicion,
      p.colores.join(", "),
      p.tallas.join(" - "),
      p.pdfDesign?.designNotes || "",
      p.pdfDesign?.occasion || "",
      p.pdfDesign?.styling || "",
      item.tikTok.hooks[0] || "",
      item.tikTok.hooks[1] || "",
      `${item.tikTok.videoStructure.hookTime} | ${item.tikTok.videoStructure.detailTime} | ${item.tikTok.videoStructure.ctaTime}`,
      item.instagram.mainCaption,
      carouselText,
      item.facebook.conversationalCopy,
      item.email.subjectLines[0] || "",
      item.email.previewText,
      item.email.emailBodyText,
      item.ads.headline,
      item.ads.primaryText,
      `${item.ads.angleA.title}: ${item.ads.angleA.text}`,
      `${item.ads.angleB.title}: ${item.ads.angleB.text}`,
    ];
  });

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Parrilla Marketing");
  XLSX.writeFile(workbook, filename);
}
