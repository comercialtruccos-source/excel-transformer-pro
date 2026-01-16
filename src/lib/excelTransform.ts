import * as XLSX from "xlsx";

export interface TransformResult {
  original: string[][];
  transformed: string[][];
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
  
  const result: string[][] = [["REFERENCIA", "TALLA", "COLOR"]];
  
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
        result.push([referencia, size, color]);
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
