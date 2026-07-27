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
 * Generates multichannel marketing copy for a single product reference.
 */
export function generateMultichannelCopy(product: MergedProductData): ReferenceMultichannelCopy {
  const { referencia, nombre, composicion, colores, tallas, pdfDesign } = product;

  const coloresText = colores.length ? colores.join(", ") : "Variedad de tonos";
  const tallasText = tallas.length ? tallas.join(" - ") : "Tallas estándar";
  const occasion = pdfDesign?.occasion || "Casual Chic & Diario";
  const detailsList = pdfDesign?.details?.join(", ") || "Horma anatómica y diseño exclusivo";
  const styling = pdfDesign?.styling || "Combínalo con blazer o chaqueta denim para elevar tu look.";

  // --- 1. TikTok & Reels ---
  const tikTok: TikTokStrategy = {
    hooks: [
      `¿Buscas el pantalón que arme silueta perfecta sin apretar? Mira la REF ${referencia}. 🔥`,
      `3 formas de combinar la ${nombre} de la nueva colección Trucco's. ✨`,
      `El secreto para lucir increíble en segundos: ${nombre} (REF ${referencia}). 💖`,
    ],
    videoStructure: {
      hookTime: `0-3s: Gancho visual probándose la ${nombre} en cámara con música en tendencia.`,
      detailTime: `3-10s: Acercamiento al tejido en ${composicion}, mostrando la elasticidad y los detalles (${detailsList}).`,
      ctaTime: `10-15s: Muestra las variaciones en ${coloresText} e invita a hacer clic en el perfil o escribir a WhatsApp.`,
    },
    hashtags: [
      "#TruccosJeans",
      "#DenimStyle",
      "#ModaColombia",
      `#${referencia}`,
      "#OcasiónChic",
      "#JeansColombianos",
    ],
  };

  // --- 2. Instagram ---
  const mainCaption = `✨ ¡Conoce la nueva ${nombre} (REF ${referencia})! ✨\n\n` +
    `Diseñada pensando en tu comodidad y elegancia diaria. Elaborada en **${composicion}**, esta prenda se adapta a tu silueta brindándote la horma y flexibilidad que necesitas para toda la jornada.\n\n` +
    `🌸 **Ocasión ideal:** ${occasion}\n` +
    `🔍 **Detalles de diseño:** ${detailsList}\n` +
    `💡 **Styling sugerido:** ${styling}\n\n` +
    `🎨 **Colores disponibles:** ${coloresText}\n` +
    `📏 **Tallas:** ${tallasText}\n\n` +
    `👉 ¡Haz clic en el enlace de nuestra biografía para hacer tu pedido mayorista o de tienda online! 🛍️`;

  const instagram: InstagramStrategy = {
    mainCaption: fixSpanishOrthography(mainCaption),
    carouselSlides: [
      {
        slideNumber: 1,
        title: `Lámina 1: Foto de Impacto`,
        content: `Fotografía de modelo vistiendo la ${nombre}.\nTexto superpuesto: "${nombre} | El fit perfecto para tu día a día ✨"`,
      },
      {
        slideNumber: 2,
        title: `Lámina 2: Textura y Calidad`,
        content: `Macro shot del tejido en ${composicion}.\nTexto superpuesto: "Tejido de máxima flexibilidad y confort. Compuesto por ${composicion}."`,
      },
      {
        slideNumber: 3,
        title: `Lámina 3: Tip de Styling`,
        content: `Propuesta de outfit completo.\nTexto superpuesto: "${styling}"`,
      },
      {
        slideNumber: 4,
        title: `Lámina 4: Disponibilidad y CTA`,
        content: `Gráfica con variantes de color.\nTexto superpuesto: "Disponible en colores: ${coloresText}. Tallas ${tallasText}.\n¡Escríbenos al enlace de la bio!"`,
      },
    ],
    storyIdeas: [
      `Encuesta Interactiva: "¿Preferirías esta ${nombre} para el día ☀️ o para la noche 🌙?"`,
      `Sticker de Preguntas: "¿Con qué color de ${nombre} combinarías tu outfit de hoy: ${coloresText}?"`,
    ],
  };

  // --- 3. Facebook ---
  const facebook: FacebookStrategy = {
    conversationalCopy: fixSpanishOrthography(
      `Si buscas versatilidad, durabilidad y un ajuste que resalte lo mejor de ti, la nueva ${nombre} (REF ${referencia}) es para ti.\n\n` +
      `Confeccionada con tela de alta tecnología (${composicion}), te ofrece libertad de movimiento sin perder su forma original. Perfecta para un estilo ${occasion}.\n\n` +
      `✔ Horma anatómica de ajuste confortable.\n` +
      `✔ Disponible en colores ${coloresText}.\n` +
      `✔ Tallas desde ${tallasText}.\n\n` +
      `Recibe asesoría personalizada o catalogo completo para mayoristas dando clic abajo:`
    ),
    callToAction: "Enviar mensaje a WhatsApp de atención",
  };

  // --- 4. Email Marketing ---
  const emailBodyText = `Hola,\n\n` +
    `Queremos presentarte la nueva ${nombre} (REF ${referencia}), una pieza clave de nuestra más reciente colección.\n\n` +
    `Confeccionada en ${composicion}, combina suavidad, resistencia y un calce diseñado para brindar comodidad total durante todo el día.\n\n` +
    `Atributos destacados:\n` +
    `- Silueta y detalles: ${detailsList}\n` +
    `- Ocasión recomendada: ${occasion}\n` +
    `- Colores: ${coloresText}\n` +
    `- Tallas: ${tallasText}\n\n` +
    `Haz tu pedido hoy mismo y renueva tu inventario con las mejores prendas del mercado colombiano.`;

  const emailBodyHTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">` +
    `<h2 style="color: #111;">La nueva ${nombre} ya está disponible ✨</h2>` +
    `<p>Hola,</p>` +
    `<p>Queremos presentarte la nueva <strong>${nombre} (REF ${referencia})</strong>, una pieza clave diseñada para destacar.</p>` +
    `<p>Confeccionada en <strong>${composicion}</strong>, combina suavidad, resistencia y un calce superior.</p>` +
    `<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">` +
    `<h4 style="margin-top: 0;">Detalles de la Prenda:</h4>` +
    `<ul>` +
    `<li><strong>Silueta & Detalles:</strong> ${detailsList}</li>` +
    `<li><strong>Ocasión:</strong> ${occasion}</li>` +
    `<li><strong>Colores:</strong> ${coloresText}</li>` +
    `<li><strong>Tallas:</strong> ${tallasText}</li>` +
    `</ul>` +
    `</div>` +
    `<p style="text-align: center; margin-top: 30px;">` +
    `<a href="#" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Solicitar Pedido / Catálogo</a>` +
    `</p>` +
    `</div>`;

  const email: EmailMarketingStrategy = {
    subjectLines: [
      `La nueva ${nombre} que estabas esperando ya está disponible ✨`,
      `Diseño, comodidad y tendencia: Conoce la REF ${referencia}`,
      `El fit perfecto sí existe: Descubre la REF ${referencia}`,
    ],
    previewText: `Elaborado en ${composicion}. Descubre cómo combinarlo esta temporada.`,
    emailBodyHTML,
    emailBodyText: fixSpanishOrthography(emailBodyText),
  };

  // --- 5. Ads Digitales ---
  const ads: AdsDigitalStrategy = {
    headline: `Efecto Moldeador y Comodidad Total | REF ${referencia}`,
    primaryText: fixSpanishOrthography(
      `¿Cansada de prendas que se deforman o aprietan? La ${nombre} (REF ${referencia}) está elaborada en ${composicion} para darte una horma envidiable y flexibilidad absoluta. ¡Envío seguro a todo el país!`
    ),
    angleA: {
      title: "Ángulo A: Calidad & Horma Anatómica",
      text: fixSpanishOrthography(
        `Disfruta de la calidad de confección colombiana. La REF ${referencia} moldea tu figura respetando tu comodidad gracias a su tejido en ${composicion}. Disponible en tallas ${tallasText}.`
      ),
    },
    angleB: {
      title: "Ángulo B: Tendencia & Versatilidad",
      text: fixSpanishOrthography(
        `Eleva tu estilo para cualquier ocasión (${occasion}). Combina la ${nombre} fácilmente y luce impecable en cada momento del día.`
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
    "COMPOSICIÓN",
    "COLORES",
    "TALLAS",
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
      p.composicion,
      p.colores.join(", "),
      p.tallas.join(" - "),
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
