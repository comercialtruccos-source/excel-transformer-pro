import * as XLSX from "xlsx";

export interface TransformResult {
  original: string[][];
  transformed: string[][];
}

// Catálogo de colores (Descripcion -> Codigo)
let colorCatalog: Map<string, string> = new Map();

// Cargar catálogo de colores desde el CSV
export async function loadColorCatalog(): Promise<void> {
  try {
    const response = await fetch("/data/colors.csv?v=" + Date.now());
    const text = await response.text();
    const lines = text.split("\n");
    
    colorCatalog.clear();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [descripcion, codigo] = line.split(";");
      if (descripcion && codigo) {
        // Normalizar: mayúsculas y sin acentos para mejor coincidencia
        const normalizedDesc = normalizeColorName(descripcion);
        colorCatalog.set(normalizedDesc, codigo.trim());
      }
    }
    
    console.log(`Catálogo de colores cargado: ${colorCatalog.size} colores`);
  } catch (error) {
    console.error("Error cargando catálogo de colores:", error);
  }
}

// Normalizar nombre de color para comparación
function normalizeColorName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
}

// Buscar código de color
function findColorCode(colorName: string): string {
  const normalized = normalizeColorName(colorName);
  return colorCatalog.get(normalized) || "";
}

// Rangos de tallas predefinidos
const letterSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const numericSizeRanges = [
  ["06", "08", "10", "12", "14"],
  ["14", "16", "18", "20", "22"],
  ["16", "18", "20", "22"],
  ["26", "28", "30", "32", "34", "36"],
  ["28", "30", "32", "34", "36"],
  ["30", "32", "34", "36", "38", "40"],
];

// Encuentra el rango numérico que contiene ambas tallas
function findNumericRange(start: string, end: string): string[] | null {
  const startNorm = start.padStart(2, "0");
  const endNorm = end.padStart(2, "0");
  
  for (const range of numericSizeRanges) {
    const startIdx = range.indexOf(startNorm);
    const endIdx = range.indexOf(endNorm);
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      return range.slice(startIdx, endIdx + 1);
    }
  }
  return null;
}

// Expande el rango de tallas (ej: "S - L" -> ["S", "M", "L"] o "06 - 14" -> ["06", "08", "10", "12", "14"])
function expandSizeRange(sizeRange: string): string[] {
  const cleaned = sizeRange.trim().toUpperCase();
  
  // Detectar rango con guion (ej: "S - L" o "06-14")
  const rangeMatch = cleaned.match(/^(\d+|[A-Z]+)\s*[-–]\s*(\d+|[A-Z]+)$/);
  
  if (rangeMatch) {
    const startSize = rangeMatch[1];
    const endSize = rangeMatch[2];
    
    // Verificar si son tallas de letras
    const startLetterIdx = letterSizes.indexOf(startSize);
    const endLetterIdx = letterSizes.indexOf(endSize);
    
    if (startLetterIdx !== -1 && endLetterIdx !== -1 && startLetterIdx <= endLetterIdx) {
      return letterSizes.slice(startLetterIdx, endLetterIdx + 1);
    }
    
    // Verificar si son tallas numéricas
    const numericResult = findNumericRange(startSize, endSize);
    if (numericResult) {
      return numericResult;
    }
  }
  
  // Si es una talla única de letra
  if (letterSizes.includes(cleaned)) {
    return [cleaned];
  }
  
  // Si es una talla numérica única, devolverla formateada
  if (/^\d+$/.test(cleaned)) {
    return [cleaned.padStart(2, "0")];
  }
  
  // Si no reconocemos el formato, devolver como está
  return [sizeRange];
}

// Detectar columnas de colores (COLOR 1, COLOR 2, etc. o similares)
function findColorColumns(headers: string[]): { colorCols: number[]; refCol: number; sizeCol: number } {
  const colorCols: number[] = [];
  let refCol = -1;
  let sizeCol = -1;
  
  headers.forEach((header, index) => {
    const upperHeader = header.toUpperCase().trim();
    
    if (upperHeader.includes("COLOR") || upperHeader.includes("COLOUR")) {
      colorCols.push(index);
    } else if (upperHeader.includes("REFERENCIA") || upperHeader.includes("REF") || upperHeader.includes("SKU") || upperHeader.includes("CODIGO")) {
      refCol = index;
    } else if (upperHeader.includes("TALLA") || upperHeader.includes("SIZE") || upperHeader.includes("SET")) {
      sizeCol = index;
    }
  });
  
  // Si no encontramos referencia, asumimos que es la primera columna
  if (refCol === -1) refCol = 0;
  // Si no encontramos tallas, asumimos que es la segunda columna
  if (sizeCol === -1) sizeCol = 1;
  
  return { colorCols, refCol, sizeCol };
}

export function transformExcelData(data: string[][]): string[][] {
  if (!data || data.length < 2) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const { colorCols, refCol, sizeCol } = findColorColumns(headers);
  
  const result: string[][] = [["SKU", "REFERENCIA", "TALLA", "COLOR", "CODIGO COLOR"]];
  
  for (const row of rows) {
    const referencia = row[refCol] || "";
    const sizeRange = row[sizeCol] || "";
    const sizes = expandSizeRange(sizeRange);
    
    // Obtener colores que tienen valor (no vacío y no solo números)
    const colors: string[] = [];
    for (const colIndex of colorCols) {
      const colorValue = row[colIndex]?.trim();
      if (colorValue && !/^\d+$/.test(colorValue)) {
        colors.push(colorValue);
      }
    }
    
    // Generar todas las combinaciones
    for (const size of sizes) {
      for (const color of colors) {
        const colorCode = findColorCode(color);
        const sku = `${referencia}${size}${colorCode}`;
        result.push([sku, referencia, size, color, colorCode]);
      }
    }
  }
  
  return result;
}

export async function readExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("No se pudo leer el archivo"));
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        // Filtrar filas vacías y convertir todo a strings
        const cleanData = jsonData
          .filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ""))
          .map((row) => row.map((cell) => String(cell ?? "")));
        
        resolve(cleanData);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data: string[][], filename: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transformado");
  XLSX.writeFile(workbook, filename);
}

// Shopify CSV Headers (columnas requeridas)
const SHOPIFY_HEADERS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Option1 Linked To", "Option2 Name", "Option2 Value", "Option2 Linked To",
  "Option3 Name", "Option3 Value", "Option3 Linked To", "Variant SKU", "Variant Grams",
  "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service",
  "Variant Price", "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
  "Variant Barcode", "Image Src", "Image Position", "Image Alt Text", "Gift Card", "Status"
];

export interface ShopifyConfig {
  vendor: string;
  productCategory: string;
  type: string;
  tags: string;
  price: string;
  published: boolean;
  description: string;
}

export function transformToShopifyCSV(transformedData: string[][], config: ShopifyConfig): string[][] {
  if (!transformedData || transformedData.length < 2) return [SHOPIFY_HEADERS];
  
  const rows = transformedData.slice(1); // Skip header
  const result: string[][] = [SHOPIFY_HEADERS];
  
  // Agrupar por referencia para crear productos con variantes
  const productGroups = new Map<string, typeof rows>();
  
  for (const row of rows) {
    const [sku, referencia, talla, color, colorCode] = row;
    if (!productGroups.has(referencia)) {
      productGroups.set(referencia, []);
    }
    productGroups.get(referencia)!.push(row);
  }
  
  for (const [referencia, variants] of productGroups) {
    const handle = referencia.toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    variants.forEach((variant, index) => {
      const [sku, , talla, color, colorCode] = variant;
      const isFirstVariant = index === 0;
      
      const shopifyRow: string[] = [
        handle, // Handle
        isFirstVariant ? referencia : "", // Title
        isFirstVariant ? config.description : "", // Body (HTML)
        isFirstVariant ? config.vendor : "", // Vendor
        isFirstVariant ? config.productCategory : "", // Product Category
        isFirstVariant ? config.type : "", // Type
        isFirstVariant ? config.tags : "", // Tags
        isFirstVariant ? (config.published ? "true" : "false") : "", // Published
        isFirstVariant ? "Color" : "", // Option1 Name
        color, // Option1 Value
        "", // Option1 Linked To
        isFirstVariant ? "Talla" : "", // Option2 Name
        talla, // Option2 Value
        "", // Option2 Linked To
        "", // Option3 Name
        "", // Option3 Value
        "", // Option3 Linked To
        sku, // Variant SKU
        "1000", // Variant Grams
        "shopify", // Variant Inventory Tracker
        "0", // Variant Inventory Qty
        "deny", // Variant Inventory Policy
        "manual", // Variant Fulfillment Service
        config.price, // Variant Price
        "", // Variant Compare At Price
        "true", // Variant Requires Shipping
        "true", // Variant Taxable
        "", // Variant Barcode
        "", // Image Src
        "", // Image Position
        "", // Image Alt Text
        "false", // Gift Card
        "draft", // Status
      ];
      
      result.push(shopifyRow);
    });
  }
  
  return result;
}

export function exportToShopifyCSV(data: string[][], filename: string): void {
  const csvContent = data.map(row => 
    row.map(cell => {
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(",")
  ).join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
