import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Configure pdfjs worker for legacy build
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfPageData {
  pageNumber: number;
  text: string;
}

export interface PdfDesignData {
  reference: string;
  concept: string;
  occasion: string;
  details: string[];
  styling: string;
  colorPalette?: string[];
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
 * Keywords for detecting aesthetic occasions of use
 */
const OCCASION_KEYWORDS: Record<string, string[]> = {
  "Oficina & Ejecutiva": ["oficina", "trabajo", "ejecutiva", "formal", "elegante", "blazer", "sastrería"],
  "Casual Chic & Urbano": ["casual", "urbano", "diario", "universidad", "salida", "streetwear", "cómodo"],
  "Noche & Fiesta": ["noche", "fiesta", "coctel", "brillo", "glam", "evento", "cena"],
  "Fin de Semana & Relax": ["fin de semana", "descanso", "viaje", "playa", "domingo", "relax"],
};

/**
 * Keywords for detecting design details
 */
const DETAIL_KEYWORDS = [
  "tiro alto",
  "tiro medio",
  "tiro bajo",
  "bota recta",
  "bota ancha",
  "bota ajustada",
  "flare",
  "skinny",
  "wide leg",
  "roturas",
  "destruido",
  "fogueado",
  "lavado oscuro",
  "lavado claro",
  "lavado medio",
  "bolsillos funcionales",
  "efecto moldeador",
  "pretina ancha",
  "levanta cola",
  "push up",
  "control abdomen",
];

/**
 * Matches extracted PDF text against references from Excel and builds aesthetic design metadata.
 */
export function matchPdfDesignData(
  pages: PdfPageData[],
  excelReferences: string[]
): Map<string, PdfDesignData> {
  const result = new Map<string, PdfDesignData>();

  if (!pages || !pages.length || !excelReferences || !excelReferences.length) return result;

  // Combine full PDF text to detect general collection concepts
  const fullText = pages.map((p) => p.text).join("\n");

  excelReferences.forEach((ref) => {
    if (!ref) return;

    const normalizedRef = ref.trim().toUpperCase();
    const cleanRef = normalizedRef.replace(/[^A-Z0-9]/g, "");

    // Find pages mentioning this reference
    const matchingPages = pages.filter((p) => {
      const pageUpper = p.text.toUpperCase();
      return (
        pageUpper.includes(normalizedRef) ||
        (cleanRef.length >= 3 && pageUpper.includes(cleanRef))
      );
    });

    const refText = matchingPages.length
      ? matchingPages.map((p) => p.text).join(" ")
      : fullText;

    // Detect occasion of use
    let detectedOccasion = "Casual Chic & Diario";
    for (const [occasionName, keywords] of Object.entries(OCCASION_KEYWORDS)) {
      if (keywords.some((kw) => refText.toLowerCase().includes(kw))) {
        detectedOccasion = occasionName;
        break;
      }
    }

    // Detect design details
    const detectedDetails: string[] = [];
    DETAIL_KEYWORDS.forEach((detail) => {
      if (refText.toLowerCase().includes(detail)) {
        detectedDetails.push(detail);
      }
    });

    if (detectedDetails.length === 0) {
      if (normalizedRef.startsWith("P")) {
        detectedDetails.push("Silueta Plus Size", "Efecto Moldeador", "Tiro Alto Anatómico");
      } else if (normalizedRef.startsWith("J")) {
        detectedDetails.push("Corte Denim Premium", "Efecto Levanta Cola", "Ajuste Confort");
      } else {
        detectedDetails.push("Diseño Exclusivo Trucco's", "Ajuste Anatómico", "Acabado de Alta Calidad");
      }
    }

    // Detect styling suggestions
    let styling = "Combínalo con tacones y blazer para un look de impacto, o con tenis para un estilo casual diario.";
    if (refText.toLowerCase().includes("styling") || refText.toLowerCase().includes("combinar")) {
      const match = refText.match(/(?:styling|combinar|look|outfit)[\s:]+([^.]+)/i);
      if (match && match[1]) {
        styling = match[1].trim();
      }
    }

    // Detect general collection concept / mood
    let concept = "Colección Esenciales & Tendencia Denim";
    const moodMatch = fullText.match(/(?:concepto|inspiración|mood|colección)[\s:]+([^.]+)/i);
    if (moodMatch && moodMatch[1]) {
      concept = moodMatch[1].trim();
    }

    result.set(normalizedRef, {
      reference: normalizedRef,
      concept,
      occasion: detectedOccasion,
      details: Array.from(new Set(detectedDetails)),
      styling,
      rawText: refText.substring(0, 300),
    });
  });

  return result;
}
