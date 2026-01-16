import * as XLSX from "xlsx";

export interface TransformResult {
  original: string[][];
  transformed: string[][];
}

// Expande el rango de tallas (ej: "S - L" -> ["S", "M", "L"])
function expandSizeRange(sizeRange: string): string[] {
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  
  // Limpiar y detectar formato
  const cleaned = sizeRange.trim().toUpperCase();
  
  // Si contiene un rango (ej: "S - L" o "S-L")
  const rangeMatch = cleaned.match(/^([A-Z]+)\s*[-–]\s*([A-Z]+)$/);
  
  if (rangeMatch) {
    const startSize = rangeMatch[1];
    const endSize = rangeMatch[2];
    
    const startIndex = sizes.indexOf(startSize);
    const endIndex = sizes.indexOf(endSize);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
      return sizes.slice(startIndex, endIndex + 1);
    }
  }
  
  // Si es una talla única
  if (sizes.includes(cleaned)) {
    return [cleaned];
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
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        // Filtrar filas vacías y convertir todo a strings
        const cleanData = jsonData
          .filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ""))
          .map((row) => row.map((cell) => String(cell ?? "")));
        
        resolve(cleanData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsBinaryString(file);
  });
}

export function exportToExcel(data: string[][], filename: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transformado");
  XLSX.writeFile(workbook, filename);
}
