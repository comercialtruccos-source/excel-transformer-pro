import * as XLSX from "xlsx";
import { loadColorCatalog, formatComposicionForTitle } from "./excelTransform";
import { generateAIDADescription, getModelSize } from "./aidaDescriptions";
import { fixSpanishOrthography } from "./spanishOrthography";

// Shopify CSV column headers
export const SHOPIFY_HEADERS = [
  "Title",
  "URL handle",
  "Description",
  "Vendor",
  "Product category",
  "Type",
  "Tags",
  "Published on online store",
  "Status",
  "SKU",
  "Barcode",
  "Option1 name",
  "Option1 value",
  "Option1 Linked To",
  "Option2 name",
  "Option2 value",
  "Option2 Linked To",
  "Option3 name",
  "Option3 value",
  "Option3 Linked To",
  "Price",
  "Compare-at price",
  "Cost per item",
  "Charge tax",
  "Tax code",
  "Unit price total measure",
  "Unit price total measure unit",
  "Unit price base measure",
  "Unit price base measure unit",
  "Inventory tracker",
  "Inventory quantity",
  "Continue selling when out of stock",
  "Weight value (grams)",
  "Weight unit for display",
  "Requires shipping",
  "Fulfillment service",
  "Product image URL",
  "Image position",
  "Image alt text",
  "Variant image URL",
  "Gift card",
  "SEO title",
  "SEO description",
  "Color (product.metafields.shopify.color-pattern)",
  "Google Shopping / Google product category",
  "Google Shopping / Gender",
  "Google Shopping / Age group",
  "Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name",
  "Google Shopping / Ads labels",
  "Google Shopping / Condition",
  "Google Shopping / Custom product",
  "Google Shopping / Custom label 0",
  "Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2",
  "Google Shopping / Custom label 3",
  "Google Shopping / Custom label 4",
];

export interface ShopifyConfig {
  vendor: string;
  productType: string;
  tags: string;
  bodyTemplate: string;
  price: string;
  compareAtPrice: string;
  published: boolean;
  inventoryQty: string;
  inventoryPolicy: "deny" | "continue";
  weight: string;
  imageBaseUrl: string;
  status: "active" | "draft" | "archived";
  titleTemplate: string;
}

export interface ProductVariant {
  handle: string;
  title: string;
  sku: string;
  referencia: string;
  talla: string;
  color: string;
  colorCode: string;
  nombre: string;
  composicion: string;
}

// Catálogo de colores (Descripcion -> Codigo)
let colorCatalog: Map<string, string> = new Map();

// Cargar catálogo de colores desde el CSV
export async function loadShopifyColorCatalog(): Promise<void> {
  try {
    const response = await fetch("/data/colors.csv");
    const text = await response.text();
    const lines = text.split("\n");
    
    colorCatalog.clear();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [descripcion, codigo] = line.split(";");
      if (descripcion && codigo) {
        const normalizedDesc = normalizeColorName(descripcion);
        colorCatalog.set(normalizedDesc, codigo.trim());
      }
    }
    
    console.log(`Catálogo de colores cargado para Shopify: ${colorCatalog.size} colores`);
  } catch (error) {
    console.error("Error cargando catálogo de colores:", error);
  }
}

// Normalizar nombre de color para comparación
function normalizeColorName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  ["28", "30", "32", "34", "36", "38"],
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

// Expande el rango de tallas
function expandSizeRange(sizeRange: string): string[] {
  const cleaned = sizeRange.trim().toUpperCase();
  
  const rangeMatch = cleaned.match(/^(\d+|[A-Z]+)\s*[-–]\s*(\d+|[A-Z]+)$/);
  
  if (rangeMatch) {
    const startSize = rangeMatch[1];
    const endSize = rangeMatch[2];
    
    const startLetterIdx = letterSizes.indexOf(startSize);
    const endLetterIdx = letterSizes.indexOf(endSize);
    
    if (startLetterIdx !== -1 && endLetterIdx !== -1 && startLetterIdx <= endLetterIdx) {
      return letterSizes.slice(startLetterIdx, endLetterIdx + 1);
    }
    
    const numericResult = findNumericRange(startSize, endSize);
    if (numericResult) {
      return numericResult;
    }
  }
  
  if (letterSizes.includes(cleaned)) {
    return [cleaned];
  }
  
  if (/^\d+$/.test(cleaned)) {
    return [cleaned.padStart(2, "0")];
  }
  
  return [sizeRange];
}

// Detectar columnas
function findColumns(headers: string[]): { 
  colorCols: number[]; refCol: number; sizeCol: number; nombreCol: number; composicionCol: number 
} {
  const colorCols: number[] = [];
  let refCol = -1;
  let sizeCol = -1;
  let nombreCol = -1;
  let composicionCol = -1;
  
  headers.forEach((header, index) => {
    const upperHeader = header.toUpperCase().trim();
    
    if (upperHeader.includes("COLOR") || upperHeader.includes("COLOUR")) {
      colorCols.push(index);
    } else if (upperHeader === "REFERENCIA" || upperHeader === "REF" || upperHeader === "SKU" || upperHeader === "CODIGO") {
      refCol = index;
    } else if (upperHeader.includes("TALLA") || upperHeader.includes("SIZE") || upperHeader === "SET TALLAS") {
      sizeCol = index;
    } else if (upperHeader === "NOMBRE") {
      nombreCol = index;
    } else if (upperHeader === "COMPOSICION" || upperHeader === "COMPOSICIÓN") {
      composicionCol = index;
    }
  });
  
  if (refCol === -1) refCol = 0;
  if (sizeCol === -1) sizeCol = 1;
  
  return { colorCols, refCol, sizeCol, nombreCol, composicionCol };
}

// generateAIDADescription y getModelSize importados desde ./aidaDescriptions

// Generar handle amigable para URL
function generateHandle(referencia: string): string {
  return referencia
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Generar título del producto - optimizado por línea
function generateTitle(variant: ProductVariant, _template: string, vendor: string = ""): string {
  const ref = variant.referencia.trim().toUpperCase();
  const nombreCap = fixSpanishOrthography(
    variant.nombre
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  );

  const isTruccos = /trucco/i.test(vendor);

  // Si no hay nombre, usar referencia como fallback
  if (!nombreCap) {
    if (isTruccos) {
      const suffix = ref.startsWith("P") ? "Plus Size Marca Trucco's" : "Marca Trucco's";
      return `${variant.referencia} ${suffix}`;
    }
    return ref.startsWith("P") ? `${variant.referencia} Plus Size` : variant.referencia;
  }

  // Composición limpia para título
  const cleanComp = fixSpanishOrthography(formatComposicionForTitle(variant.composicion));

  // Construir título: Nombre + "en" composición (si hay) + sufijo opcional
  let title = nombreCap;
  if (ref.startsWith("P")) {
    title += " Plus Size";
  }
  if (cleanComp) {
    const shortComp = cleanComp.length > 40 ? cleanComp.substring(0, 37) + "..." : cleanComp;
    title += ` en ${shortComp}`;
  }
  if (isTruccos) {
    title += " Marca Trucco's";
  }

  return title;
}

// Generar descripción HTML
function generateBody(referencia: string, template: string): string {
  return template.replace(/{referencia}/gi, referencia);
}

// Extraer variantes del Excel
export function extractVariants(data: string[][]): ProductVariant[] {
  if (!data || data.length < 2) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const { colorCols, refCol, sizeCol, nombreCol, composicionCol } = findColumns(headers);
  
  const variants: ProductVariant[] = [];
  
  for (const row of rows) {
    const referencia = (row[refCol] || "").trim();
    const sizeRange = (row[sizeCol] || "").trim();
    const sizes = expandSizeRange(sizeRange);
    const nombre = nombreCol >= 0 ? (row[nombreCol] || "").trim() : "";
    const composicion = composicionCol >= 0 ? (row[composicionCol] || "").trim() : "";
    
    const colors: string[] = [];
    for (const colIndex of colorCols) {
      const colorValue = row[colIndex]?.trim();
      if (colorValue && !/^\d+$/.test(colorValue)) {
        colors.push(colorValue);
      }
    }
    
    for (const size of sizes) {
      const cleanSize = size.trim();
      for (const color of colors) {
        const colorCode = findColorCode(color);
        const sku = `${referencia}${cleanSize}${colorCode}`;
        const handle = generateHandle(referencia);
        
        variants.push({
          handle,
          title: referencia,
          sku,
          referencia,
          talla: cleanSize,
          color,
          colorCode,
          nombre,
          composicion,
        });
      }
    }
  }
  
  return variants;
}

// Transformar a formato Shopify
export function transformToShopifyFormat(
  variants: ProductVariant[],
  config: ShopifyConfig
): string[][] {
  const result: string[][] = [SHOPIFY_HEADERS];
  
  // Agrupar variantes por handle (producto)
  const productMap = new Map<string, ProductVariant[]>();
  
  for (const variant of variants) {
    const existing = productMap.get(variant.handle) || [];
    existing.push(variant);
    productMap.set(variant.handle, existing);
  }
  
  // Generar filas para cada producto
  for (const [handle, productVariants] of productMap) {
    const firstVariant = productVariants[0];
    let isFirstRow = true;
    
    for (const variant of productVariants) {
      const row: string[] = [];
      
      // Handle
      row.push(handle);
      
      // Title - solo en primera fila del producto
      row.push(isFirstRow ? generateTitle(firstVariant, config.titleTemplate, config.vendor) : "");
      
      // Body (HTML) - solo en primera fila, usar AIDA si hay nombre y composición
      if (isFirstRow) {
        if (firstVariant.nombre && firstVariant.composicion) {
          row.push(generateAIDADescription(firstVariant.nombre, firstVariant.composicion, firstVariant.referencia));
        } else {
          row.push(generateBody(firstVariant.referencia, config.bodyTemplate));
        }
      } else {
        row.push("");
      }
      
      // Vendor - solo en primera fila
      row.push(isFirstRow ? config.vendor : "");
      
      // Product Category - solo en primera fila
      row.push(isFirstRow ? "" : "");
      
      // Type - solo en primera fila
      row.push(isFirstRow ? config.productType : "");
      
      // Tags - solo en primera fila
      row.push(isFirstRow ? config.tags : "");
      
      // Published - solo en primera fila
      row.push(isFirstRow ? (config.published ? "TRUE" : "FALSE") : "");
      
      // Option1 Name (Talla)
      row.push(isFirstRow ? "Talla" : "");
      
      // Option1 Value
      row.push(variant.talla);
      
      // Option2 Name (Color)
      row.push(isFirstRow ? "Color" : "");
      
      // Option2 Value
      row.push(variant.color);
      
      // Option3 Name
      row.push("");
      
      // Option3 Value
      row.push("");
      
      // Variant SKU
      row.push(variant.sku);
      
      // Variant Grams
      row.push(config.weight || "0");
      
      // Variant Inventory Tracker
      row.push("shopify");
      
      // Variant Inventory Qty
      row.push(config.inventoryQty || "0");
      
      // Variant Inventory Policy
      row.push(config.inventoryPolicy);
      
      // Variant Fulfillment Service
      row.push("manual");
      
      // Variant Price
      row.push(config.price);
      
      // Variant Compare At Price
      row.push(config.compareAtPrice || "");
      
      // Variant Requires Shipping
      row.push("TRUE");
      
      // Variant Taxable
      row.push("TRUE");
      
      // Image Src - solo en primera fila del producto
      const imageUrl = config.imageBaseUrl 
        ? `${config.imageBaseUrl}${firstVariant.referencia}.jpg`
        : "";
      row.push(isFirstRow ? imageUrl : "");
      
      // Image Position
      row.push(isFirstRow ? "1" : "");
      
      // Image Alt Text
      row.push(isFirstRow ? generateTitle(firstVariant, config.titleTemplate, config.vendor) : "");
      
      // Status
      row.push(isFirstRow ? config.status : "");
      
      result.push(row);
      isFirstRow = false;
    }
  }
  
  return result;
}

// Exportar a CSV para Shopify (UTF-8 con BOM)
export function exportToShopifyCSV(data: string[][], filename: string): void {
  // Crear contenido CSV con escape correcto
  const csvContent = data.map(row => 
    row.map(cell => {
      // Escapar comillas dobles y envolver en comillas si es necesario
      const escaped = String(cell).replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\n');
  
  // Agregar BOM para UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Descargar archivo
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a Excel para Shopify
export function exportToShopifyExcel(data: string[][], filename: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

// Leer archivo Excel
export async function readExcelFileForShopify(file: File): Promise<string[][]> {
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
