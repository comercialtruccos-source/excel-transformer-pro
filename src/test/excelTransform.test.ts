import { describe, it, expect } from "vitest";
import {
  transformExcelData,
  transformToShopifyCSV,
  formatComposicionForTitle,
  ShopifyConfig
} from "../lib/excelTransform";

describe("excelTransform unit tests", () => {
  it("should format composicion correctly for title", () => {
    expect(formatComposicionForTitle("100% ALGODON")).toBe("Algodon");
    expect(formatComposicionForTitle("98% Algodon 2% Elastano")).toBe("Algodon y Elastano");
  });

  it("should transform raw excel rows into matrix format", () => {
    const rawData = [
      ["REFERENCIA", "TALLA", "COLOR 1", "NOMBRE", "COMPOSICION"],
      ["P0109", "S - L", "ROJO", "JEAN BOTA RECTA", "100% ALGODON"],
    ];

    const result = transformExcelData(rawData);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toEqual([
      "SKU",
      "REFERENCIA",
      "TALLA",
      "COLOR",
      "CODIGO COLOR",
      "NOMBRE",
      "COMPOSICION",
    ]);

    // First variant should have referencia P0109 and talla S
    const firstVariant = result[1];
    expect(firstVariant[1]).toBe("P0109");
    expect(firstVariant[2]).toBe("S");
    expect(firstVariant[3]).toBe("ROJO");
    expect(firstVariant[5]).toBe("JEAN BOTA RECTA");
  });

  it("should generate shopify CSV format with AIDA description from transformed data", () => {
    const transformed = [
      ["SKU", "REFERENCIA", "TALLA", "COLOR", "CODIGO COLOR", "NOMBRE", "COMPOSICION"],
      ["P0109S01", "P0109", "S", "ROJO", "01", "JEAN BOTA RECTA", "100% ALGODON"],
      ["P0109M01", "P0109", "M", "ROJO", "01", "JEAN BOTA RECTA", "100% ALGODON"],
    ];

    const config: ShopifyConfig = {
      vendor: "Trucco's",
      productCategory: "Apparel & Accessories > Clothing",
      type: "Jeans",
      tags: "Coleccion",
      price: "120000",
      published: true,
      description: "AIDA",
    };

    const csvData = transformToShopifyCSV(transformed, config);
    expect(csvData.length).toBe(3); // 1 header + 2 variants
    expect(csvData[0][0]).toBe("Handle");
    expect(csvData[1][0]).toBe("p0109"); // Handle for reference P0109
    expect(csvData[1][17]).toBe("P0109S01"); // Variant SKU

    // Body (HTML) is at index 2 for the first row, should contain AIDA structure
    const bodyHtml = csvData[1][2];
    expect(bodyHtml).toContain("REFERENCIA:");
    expect(bodyHtml).toContain("P0109");
    expect(bodyHtml).toContain("COMPOSICIÓN:");
    expect(bodyHtml).toContain("Confeccionada en");
    expect(bodyHtml).toContain("Disponible en catálogo");
  });

  it("should detect DESCRIPCION and COMPOSICION DE TELA headers in raw Excel and generate AIDA", () => {
    const rawDataWithAlternateHeaders = [
      ["REF", "TALLA", "COLOR 1", "DESCRIPCIÓN", "COMPOSICIÓN DE TELA"],
      ["T22107053", "S", "AZUL", "JEAN WIDE LEG BOTA ANCHA", "98% ALGODON 2% ELASTANO"],
    ];

    const transformed = transformExcelData(rawDataWithAlternateHeaders);
    expect(transformed[1][1]).toBe("T22107053");
    expect(transformed[1][5]).toBe("JEAN WIDE LEG BOTA ANCHA");
    expect(transformed[1][6]).toBe("98% ALGODON 2% ELASTANO");

    const config: ShopifyConfig = {
      vendor: "Trucco's",
      productCategory: "Clothing",
      type: "Jeans",
      tags: "Denim",
      price: "150000",
      published: true,
      description: "AIDA",
    };

    const csvData = transformToShopifyCSV(transformed, config);
    const bodyHtml = csvData[1][2];
    expect(bodyHtml).toContain("Jean Wide Leg Bota Ancha");
    expect(bodyHtml).toContain("REF T22107053");
    expect(bodyHtml).toContain("Confeccionada en 98% ALGODÓN 2% ELASTANO");
    expect(bodyHtml).toContain("Talla S");
  });
});
