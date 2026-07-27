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

function cleanProductName(nombre: string, referencia: string): string {
  if (!nombre) return `Prenda REF ${referencia}`;
  return fixSpanishOrthography(
    nombre
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function getRefHash(ref: string): number {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) {
    hash = (hash << 5) - hash + ref.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Aggregates Excel data + PDF metadata and generates unique per-product AIDA descriptions.
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
 * Generates multichannel marketing copies with high variety and unique ad primary text per reference.
 */
export function generateMultichannelCopy(product: MergedProductData): ReferenceMultichannelCopy {
  const { referencia, nombre, composicion, colores, tallas, pdfDesign, aida } = product;
  const h = getRefHash(referencia);

  const coloresText = colores.length ? colores.join(", ") : "Variedad de tonos";
  const tallasText = tallas.length ? tallas.join(" - ") : "Tallas estándar";
  const collectionTitle = pdfDesign?.collectionTitle || "Colección Esenciales & Denim";
  const occasion = pdfDesign?.occasion || "Casual Chic & Uso Diario";

  // --- 1. TikTok & Reels (Dynamic Hooks based on Archetype) ---
  let tiktokHooks: string[] = [];
  if (aida.archetype === "PAS") {
    tiktokHooks = [
      `¿Cansada de prendas que pierden la horma? Mira la REF ${referencia} de Trucco's. 🔥`,
      `El secreto para estar cómoda y verte impecable todo el día: ${nombre} (REF ${referencia}). ✨`,
      `POV: Encontraste la ${nombre} perfecta en ${composicion}. 💖`,
    ];
  } else if (aida.archetype === "FAB") {
    tiktokHooks = [
      `Analizando la confección premium de la REF ${referencia} en ${composicion}. 🔍`,
      `¿Por qué esta ${nombre} (REF ${referencia}) es diferente a todas las demás? 💡`,
      `Detalles que enamoran de la nueva colección: REF ${referencia}. ✨`,
    ];
  } else if (aida.archetype === "STORYTELLING") {
    tiktokHooks = [
      `De la presentación de diseño a tu closet: Conoce la ${nombre} (REF ${referencia}). 👗`,
      `3 formas de combinar la REF ${referencia} de la colección ${collectionTitle}. ✨`,
      `El look ideal para ${occasion}: ${nombre} REF ${referencia}. 💖`,
    ];
  } else {
    tiktokHooks = [
      `🔥 ¡ALERTA BESTSELLER! La REF ${referencia} se agota en tiendas.`,
      `✨ La prenda más pedida por nuestras mayoristas: ${nombre} (REF ${referencia}).`,
      `¿Por qué todas están obsesionadas con la REF ${referencia}? Mirala de cerca. 💕`,
    ];
  }

  const tikTok: TikTokStrategy = {
    hooks: tiktokHooks,
    videoStructure: {
      hookTime: `0-3s (Gancho): Transición rápida mostrando la ${nombre} puesta. Texto: "${tiktokHooks[0]}"`,
      detailTime: `3-10s (Demostración): Zoom al tejido en ${composicion}. Audio/Texto: "${aida.interes}"`,
      ctaTime: `10-15s (Llamado a la Acción): Muestra variantes (${coloresText}). Texto: "${aida.accion}"`,
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

  // --- 2. Instagram (Layout depends on Archetype) ---
  let mainCaption = "";
  if (aida.archetype === "PAS") {
    mainCaption = `❌ **¿CANSADA DE ROPA INCÓMODA O QUE PIERDE SU FORMA?** ❌\n\n` +
      `Te presentamos la **${nombre} (REF ${referencia})** ✨\n\n` +
      `👉 ${aida.atencion}\n\n` +
      `💡 **¿POR QUÉ TE ENCANTARÁ?**\n${aida.interes}\n\n` +
      `💖 **EL RESULTADO:**\n${aida.deseo}\n\n` +
      `🎨 **Colores disponibles:** ${coloresText}\n` +
      `📏 **Tallas:** ${tallasText}\n\n` +
      `🛍️ **${aida.accion}** ¡Haz tu pedido mayorista o compra online en el enlace de la bio! ✨`;
  } else if (aida.archetype === "FAB") {
    mainCaption = `🔍 **FICHA TÉCNICA DE DISEÑO & CONFECCIÓN** 🔍\n\n` +
      `**${nombre} (REF ${referencia})** | ${collectionTitle.toUpperCase()}\n\n` +
      `✨ **Atributo Principal:** ${aida.atencion}\n\n` +
      `🧶 **Ingeniería Textil:** ${aida.interes}\n\n` +
      `👗 **Beneficio en Outfit:** ${aida.deseo}\n\n` +
      `🎨 **Colores:** ${coloresText}\n` +
      `📏 **Tallas:** ${tallasText}\n\n` +
      `👉 **${aida.accion}** ¡Haz clic en nuestra biografía! 📩`;
  } else {
    mainCaption = `✨ **NUEVO INGRESO | ${collectionTitle.toUpperCase()}** ✨\n\n` +
      `Conoce la **${nombre} (REF ${referencia})** 💕\n\n` +
      `🌟 ${aida.atencion}\n\n` +
      `🌿 **Tacto & Composición:**\n${aida.interes}\n\n` +
      `💡 **Styling Recomendado:**\n${aida.deseo}\n\n` +
      `🎨 **Colores:** ${coloresText} | 📏 **Tallas:** ${tallasText}\n\n` +
      `🛍️ **${aida.accion}** ¡Escríbenos al enlace del perfil! ✨`;
  }

  const instagram: InstagramStrategy = {
    mainCaption: fixSpanishOrthography(mainCaption),
    carouselSlides: [
      {
        slideNumber: 1,
        title: `Lámina 1: Gancho Visual (${aida.archetype})`,
        content: `Fotografía editorial de ${nombre} (REF ${referencia}).\nTexto: "${aida.atencion}"`,
      },
      {
        slideNumber: 2,
        title: `Lámina 2: Textura Textil`,
        content: `Macro shot del tejido en ${composicion}.\nTexto: "${aida.interes}"`,
      },
      {
        slideNumber: 3,
        title: `Lámina 3: Outfit & Styling`,
        content: `Propuesta de combinación para ${occasion}.\nTexto: "${aida.deseo}"`,
      },
      {
        slideNumber: 4,
        title: `Lámina 4: Variantes & Pedido`,
        content: `Colores (${coloresText}) y Tallas (${tallasText}).\nTexto: "${aida.accion}"`,
      },
    ],
    storyIdeas: [
      `Story Interactivo: "¿Llevarías la ${nombre} REF ${referencia} para ${occasion}? 🔥 SÍ / ❤️ TOTALMENTE"`,
      `Story de Detalle: "Toca aquí para ver los acabados en ${composicion} de la REF ${referencia}."`,
    ],
  };

  // --- 3. Facebook (Conversational Copy) ---
  const facebook: FacebookStrategy = {
    conversationalCopy: fixSpanishOrthography(
      `Si buscas renovación para tu estilo, la nueva ${nombre} (REF ${referencia}) de la colección "${collectionTitle}" es una apuesta segura.\n\n` +
      `${aida.atencion}\n\n` +
      `${aida.interes}\n\n` +
      `${aida.deseo}\n\n` +
      `🎨 Disponibilidad: ${coloresText} | 📏 Tallas: ${tallasText}\n\n` +
      `👉 ${aida.accion} Haz clic abajo para recibir atención personalizada en WhatsApp:`
    ),
    callToAction: "Enviar mensaje a WhatsApp Mayorista",
  };

  // --- 4. Email Marketing (3 Distinct Subject Styles) ---
  const emailSubjects = [
    `✨ ${aida.atencion}`,
    `Descubre la nueva ${nombre} (REF ${referencia}) - ${collectionTitle}`,
    `Diseño y confort insuperable: ${nombre} en ${composicion}`,
  ];

  const email: EmailMarketingStrategy = {
    subjectLines: emailSubjects,
    previewText: aida.interes.substring(0, 110),
    emailBodyHTML: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6;">` +
      `<div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">` +
      `<h1 style="margin: 0; font-size: 18px;">TRUCCO'S JEANS | ${collectionTitle.toUpperCase()}</h1>` +
      `</div>` +
      `<div style="padding: 25px;">` +
      `<h2 style="color: #111;">${nombre} (REF ${referencia})</h2>` +
      `<p style="font-size: 15px; font-weight: bold; color: #4f46e5;">${aida.atencion}</p>` +
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

  // --- 5. Ads Digitales (Meta & TikTok Ads) UNICO Y VARIADO POR REFERENCIA ---
  const headlines = [
    `Efecto Moldeador & Confort | REF ${referencia}`,
    `Nueva ${nombre} | Tendencia ${collectionTitle}`,
    `Calidad Premium en ${composicion} | REF ${referencia}`,
    `El Fit Perfecto para Tu Día | REF ${referencia}`,
    `Edición Limitada Trucco's | REF ${referencia}`,
  ];

  const primaryTextOptions = [
    `${aida.atencion} ${aida.interes} ${aida.accion}`,
    `Descubre la ${nombre} (REF ${referencia}). ${aida.interes} ${aida.deseo} ¡Pídela hoy con envío seguro!`,
    `¿Buscas ropa versátil para ${occasion}? La ${nombre} (REF ${referencia}) elaborada en ${composicion} es tu mejor opción. ${aida.accion}`,
    `${aida.atencion} Confeccionada con tecnología textil en ${composicion} para asegurar un ajuste perfecto. ${aida.accion}`,
  ];

  const selectedHeadline = headlines[h % headlines.length];
  const selectedPrimaryText = primaryTextOptions[h % primaryTextOptions.length];

  const ads: AdsDigitalStrategy = {
    headline: fixSpanishOrthography(selectedHeadline),
    primaryText: fixSpanishOrthography(selectedPrimaryText),
    angleA: {
      title: "Ángulo A: Confección & Confort (Interés AIDA)",
      text: fixSpanishOrthography(`${aida.interes} Disponible en tallas ${tallasText}.`),
    },
    angleB: {
      title: "Ángulo B: Estilo & Ocasión (Deseo AIDA)",
      text: fixSpanishOrthography(`${aida.deseo} Ideal para ${occasion}.`),
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
    "ARQUETIPO PUBLICITARIO",
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
      p.aida.archetype,
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
