import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Configure pdfjs worker for legacy build
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfPageData {
  pageNumber: number;
  text: string;
}

export interface PdfDesignData {
  reference: string;
  collectionTitle: string;
  pageNumber: number | null;
  concept: string;
  occasion: string;
  details: string[];
  styling: string;
  designNotes: string;
  washOrFabricNotes: string;
  rawText: string;
}

/**
 * Extracts text content from each page of a PDF file.
 */
export async function extractPdfPages(file: File): Promise<PdfPageData[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const pages: PdfPageData[] = [];

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        pages.push({
          pageNumber: pageNum,
          text: pageText,
        });
      }
    }

    return pages;
  } catch (error) {
    console.error("Error al extraer texto del PDF:", error);
    throw new Error("No se pudo procesar el archivo PDF. Asegúrate de que sea un archivo válido.");
  }
}

/**
 * Enhanced list of fashion attributes & wash processes to scan in PDF
 */
const FASHION_ATTRIBUTES = [
  "tiro alto", "tiro medio", "tiro bajo", "pretina corsetera", "pretina ancha", "pretina anatómica",
  "bota recta", "bota ancha", "wide leg", "bota ajustada", "skinny", "flare", "bootcut", "palazzo", "cargo",
  "roturas", "destruido", "fogueado", "fregado", "bigotes", "frente limpio", "bolsillos cargo", "bolsillos funcionales",
  "levanta cola", "push up", "control abdomen", "efecto moldeador", "pinzas traseras", "corte en v",
  "lavado oscuro", "lavado claro", "lavado medio", "tono hielo", "índigo profundo", "proceso enzimático", "lavado vintage",
  "perlas", "tachas", "foil", "brillo", "deshilachado", "ruedo al corte", "ruedo doblado", "costuras contrastantes"
];

const OCCASION_KEYWORDS: Record<string, string[]> = {
  "Oficina & Elegancia Ejecutiva": ["oficina", "trabajo", "ejecutiva", "formal", "elegante", "blazer", "sastrería", "reunión"],
  "Casual Chic & Urbano": ["casual", "urbano", "diario", "universidad", "salida", "streetwear", "cómodo", "versátil"],
  "Noche & Coctel Glam": ["noche", "fiesta", "coctel", "brillo", "glam", "evento", "cena", "glamour"],
  "Fin de Semana & Relax": ["fin de semana", "descanso", "viaje", "playa", "domingo", "relax", "confort"],
};

/**
 * Extracts overall collection title or mood from the presentation's cover/first slides.
 */
function extractCollectionTitle(pages: PdfPageData[]): string {
  if (!pages.length) return "Colección Esenciales & Tendencia Denim";

  // Check first 3 pages for title phrases
  const coverText = pages.slice(0, 3).map((p) => p.text).join(" ");
  const match = coverText.match(/(?:colección|collection|presentación|mood|concepto|línea|tendencia)[\s:\-\–]+([^.\n,]{3,50})/i);

  if (match && match[1]) {
    const title = match[1].trim();
    if (title.length >= 4) return title;
  }

  // Fallback to first line of page 1 if available
  const page1Lines = pages[0].text.split(".")[0];
  if (page1Lines && page1Lines.length <= 60 && page1Lines.length >= 5) {
    return page1Lines.trim();
  }

  return "Colección Esenciales & Tendencia Denim";
}

/**
 * Smartly matches extracted PDF pages to Excel references and builds rich aesthetic metadata.
 */
export function matchPdfDesignData(
  pages: PdfPageData[],
  excelReferences: string[]
): Map<string, PdfDesignData> {
  const result = new Map<string, PdfDesignData>();
  if (!pages || !pages.length || !excelReferences || !excelReferences.length) return result;

  const collectionTitle = extractCollectionTitle(pages);
  const fullPdfText = pages.map((p) => p.text).join("\n");

  excelReferences.forEach((ref) => {
    if (!ref) return;

    const normalizedRef = ref.trim().toUpperCase();
    const digitsOnly = normalizedRef.replace(/\D/g, "");

    // 1. Search for matching page in PDF
    let matchingPage: PdfPageData | null = null;
    for (const page of pages) {
      const pageUpper = page.text.toUpperCase();
      // Match exact ref, or hyphenated/spaced variations (e.g., P0109 or P-0109 or REF 0109)
      if (
        pageUpper.includes(normalizedRef) ||
        (digitsOnly.length >= 3 && pageUpper.includes(digitsOnly))
      ) {
        matchingPage = page;
        break;
      }
    }

    const targetText = matchingPage ? matchingPage.text : fullPdfText;
    const targetTextLower = targetText.toLowerCase();

    // 2. Extract specific design details
    const details: string[] = [];
    FASHION_ATTRIBUTES.forEach((attr) => {
      if (targetTextLower.includes(attr)) {
        details.push(attr);
      }
    });

    // Smart default details based on reference prefix if PDF has no specific match
    if (details.length === 0) {
      if (normalizedRef.startsWith("P")) {
        details.push("Silueta Plus Size", "Efecto Moldeador", "Tiro Alto Anatómico", "Pretina de Confort");
      } else if (normalizedRef.startsWith("J")) {
        details.push("Corte Denim Premium", "Efecto Levanta Cola", "Pretina Corsetera", "Bota Ajustada");
      } else {
        details.push("Diseño Exclusivo Trucco's", "Ajuste Confort", "Acabado de Alta Calidad");
      }
    }

    // 3. Detect occasion of use
    let occasion = "Casual Chic & Diario";
    for (const [occName, keywords] of Object.entries(OCCASION_KEYWORDS)) {
      if (keywords.some((kw) => targetTextLower.includes(kw))) {
        occasion = occName;
        break;
      }
    }

    // 4. Extract specific styling suggestions from slide text
    let styling = "Combínalo con blazer o chaqueta denim para elevar tu estilo, o con tenis para un look relajado.";
    const stylingMatch = targetText.match(/(?:styling|combinar|look|outfit|usar con|propuesta)[\s:]+([^.!\n]+)/i);
    if (stylingMatch && stylingMatch[1] && stylingMatch[1].trim().length > 5) {
      styling = stylingMatch[1].trim();
    }

    // 5. Extract specific design notes / inspiration sentences
    let designNotes = `Diseñado dentro del concepto ${collectionTitle}, priorizando la horma y el movimiento.`;
    const notesMatch = targetText.match(/(?:diseño|inspiración|concepto|característica|destaca)[\s:]+([^.!\n]+)/i);
    if (notesMatch && notesMatch[1] && notesMatch[1].trim().length > 5) {
      designNotes = notesMatch[1].trim();
    } else if (matchingPage) {
      // Use first informative sentence of the page
      const sentences = matchingPage.text.split(".").map((s) => s.trim()).filter((s) => s.length > 15);
      if (sentences.length > 0) {
        designNotes = sentences[0];
      }
    }

    // 6. Extract wash or fabric notes
    let washOrFabricNotes = "Tejido de tacto suave y excelente recuperación elástica.";
    const washMatch = targetText.match(/(?:lavado|tela|tejido|proceso|composición)[\s:]+([^.!\n]+)/i);
    if (washMatch && washMatch[1] && washMatch[1].trim().length > 4) {
      washOrFabricNotes = washMatch[1].trim();
    }

    result.set(normalizedRef, {
      reference: normalizedRef,
      collectionTitle,
      pageNumber: matchingPage ? matchingPage.pageNumber : null,
      concept: collectionTitle,
      occasion,
      details: Array.from(new Set(details)),
      styling,
      designNotes,
      washOrFabricNotes,
      rawText: targetText.substring(0, 300),
    });
  });

  return result;
}
