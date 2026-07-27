import * as XLSX from "xlsx";
import { PdfDesignData } from "./pdfParser";
import { generateAIDAStructure, AIDAStructure } from "./aidaDescriptions";
import { fixSpanishOrthography } from "./spanishOrthography";

export interface MergedProductData {
  referencia: string;
  nombre: string;
  composicion: string;
  colores: string[];
  tallas: string[];
  pdfDesign?: PdfDesignData;
  aida: AIDAStructure;
}

export interface TikTokStrategy {
  hooks: string[];
  videoStructure: {
    hookTime: string;
    detailTime: string;
    ctaTime: string;
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
 * Builds merged product records by aggregating transformed HGI rows, combining with PDF design metadata,
 * and generating the central AIDA Shopify description for each product.
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
    const nombreClean = cleanProductName(data.nombre, referencia);
    const compClean = data.composicion || "100% Algodón Premium";

    // Step 2: Generate central Shopify AIDA description
    const aida = generateAIDAStructure(nombreClean, compClean, referencia, pdfData);

    result.push({
      referencia,
      nombre: nombreClean,
      composicion: compClean,
      colores: Array.from(data.colores),
      tallas: Array.from(data.tallas),
      pdfDesign: pdfData,
      aida,
    });
  }

  return result;
}

/**
 * Step 3: Generates multichannel marketing copy DERIVED DIRECTLY from the unique Shopify AIDA description of each reference.
 */
export function generateMultichannelCopy(product: MergedProductData): ReferenceMultichannelCopy {
  const { referencia, nombre, colores, tallas, pdfDesign, aida } = product;

  const coloresText = colores.length ? colores.join(", ") : "Variedad de tonos";
  const tallasText = tallas.length ? tallas.join(" - ") : "Tallas estándar";
  const collectionTitle = pdfDesign?.collectionTitle || "Colección Esenciales & Tendencia Denim";
  const slideRefNote = pdfDesign?.pageNumber ? `(Diapositiva ${pdfDesign.pageNumber} del PDF)` : "";

  // --- 1. TikTok & Reels (Derived from AIDA Attention, Interest & Desire) ---
  const tikTok: TikTokStrategy = {
    hooks: [
      `🔥 ${aida.atencion}`,
      `✨ REF ${referencia}: ${aida.deseo}`,
      `💡 ${aida.interes.split(".")[0]}.`,
    ],
    videoStructure: {
      hookTime: `0-3s (Gancho Visual): Muestra la ${nombre} en modelo o perchero. Texto superpuesto: "${aida.atencion}"`,
      detailTime: `3-10s (Detalle & Confección): Acercamiento a la prenda. V.O. / Texto: "${aida.interes}"`,
      ctaTime: `10-15s (Llamado a la Acción): Variantes en ${coloresText}. Texto: "${aida.accion}"`,
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

  // --- 2. Instagram (Derived directly from AIDA 4 Blocks) ---
  const mainCaption = `✨ **NUEVO INGRESO | ${collectionTitle.toUpperCase()}** ✨\n\n` +
    `Presentamos la **${nombre} (REF ${referencia})** ${slideRefNote}\n\n` +
    `🌟 **${aida.atencion}**\n\n` +
    `🌿 **Calidad & Tejido:**\n${aida.interes}\n\n` +
    `💡 **Versatilidad & Styling:**\n${aida.deseo}\n\n` +
    `🎨 **Colores disponibles:** ${coloresText}\n` +
    `📏 **Tallas:** ${tallasText}\n\n` +
    `👉 **${aida.accion}** ¡Haz tu pedido haciendo clic en el enlace del perfil! 🛍️✨`;

  const instagram: InstagramStrategy = {
    mainCaption: fixSpanishOrthography(mainCaption),
    carouselSlides: [
      {
        slideNumber: 1,
        title: `Lámina 1: Portada (Atención AIDA)`,
        content: `Foto editorial de ${nombre} (REF ${referencia}).\nTexto: "${aida.atencion}"`,
      },
      {
        slideNumber: 2,
        title: `Lámina 2: Tejido & Confección (Interés AIDA)`,
        content: `Acercamiento al tejido.\nTexto: "${aida.interes}"`,
      },
      {
        slideNumber: 3,
        title: `Lámina 3: Styling & Ocasión (Deseo AIDA)`,
        content: `Propuesta visual de combinación.\nTexto: "${aida.deseo}"`,
      },
      {
        slideNumber: 4,
        title: `Lámina 4: Colores & CTA (Acción AIDA)`,
        content: `Muestrario de colores (${coloresText}). Tallas ${tallasText}.\nTexto: "${aida.accion}"`,
      },
    ],
    storyIdeas: [
      `Encuesta Interactiva: "¿Te gusta la combinación de la ${nombre} REF ${referencia}? 🔥 SÍ / ❤️ ME ENCANTA"`,
      `Story de Detalle: "Desliza para leer la historia detrás del diseño de la REF ${referencia}."`,
    ],
  };

  // --- 3. Facebook (Derived from AIDA Attention + Interest + Desire) ---
  const facebook: FacebookStrategy = {
    conversationalCopy: fixSpanishOrthography(
      `Conoce la nueva ${nombre} (REF ${referencia}) de la colección "${collectionTitle}".\n\n` +
      `${aida.atencion}\n\n` +
      `${aida.interes}\n\n` +
      `${aida.deseo}\n\n` +
      `🎨 Colores: ${coloresText} | 📏 Tallas: ${tallasText}\n\n` +
      `👉 ${aida.accion} Escríbenos a WhatsApp para consultar catálogo mayorista:`
    ),
    callToAction: "Enviar mensaje a WhatsApp de Atención Mayorista",
  };

  // --- 4. Email Marketing (Derived from AIDA) ---
  const email: EmailMarketingStrategy = {
    subjectLines: [
      `✨ ${aida.atencion}`,
      `Descubre la nueva ${nombre} (REF ${referencia}) - ${collectionTitle}`,
      `Diseño y confort: ${nombre} REF ${referencia}`,
    ],
    previewText: aida.interes.substring(0, 120),
    emailBodyHTML: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6;">` +
      `<div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">` +
      `<h1 style="margin: 0; font-size: 18px;">TRUCCO'S JEANS | ${collectionTitle.toUpperCase()}</h1>` +
      `</div>` +
      `<div style="padding: 25px;">` +
      `<h2 style="color: #111;">${nombre} (REF ${referencia})</h2>` +
      `<p style="font-size: 16px; font-weight: bold; color: #4f46e5;">${aida.atencion}</p>` +
      `<p>${aida.interes}</p>` +
      `<p>${aida.deseo}</p>` +
      `<div style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">` +
      `<p style="margin: 0;"><strong>Colores:</strong> ${coloresText}</p>` +
      `<p style="margin: 5px 0 0 0;"><strong>Tallas:</strong> ${tallasText}</p>` +
      `</div>` +
      `<p style="text-align: center; margin-top: 30px;">` +
      `<a href="#" style="background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">${aida.accion}</a>` +
      `</p>` +
      `</div>` +
      `</div>`,
    emailBodyText: fixSpanishOrthography(
      `Hola,\n\n${aida.atencion}\n\n${aida.interes}\n\n${aida.deseo}\n\nColores: ${coloresText}\nTallas: ${tallasText}\n\n${aida.accion}`
    ),
  };

  // --- 5. Ads Digitales (Meta & TikTok Ads) DERIVED DIRECTLY FROM AIDA ---
  // Every reference gets a 100% unique primary text because aida.atencion + aida.interes are unique!
  const ads: AdsDigitalStrategy = {
    headline: fixSpanishOrthography(`${nombre} REF ${referencia} | ${collectionTitle}`),
    primaryText: fixSpanishOrthography(`${aida.atencion} ${aida.interes} ${aida.accion}`),
    angleA: {
      title: "Ángulo A: Confección & Confort (Interés AIDA)",
      text: fixSpanishOrthography(aida.interes),
    },
    angleB: {
      title: "Ángulo B: Estilo & Actitud (Deseo AIDA)",
      text: fixSpanishOrthography(aida.deseo),
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
    "SHOPIFY DESCRIPCIÓN AIDA (HTML)",
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
    "ADS ÁNGULO A (CONFECCIÓN)",
    "ADS ÁNGULO B (ESTILO)",
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
      p.aida.fullHTML,
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
