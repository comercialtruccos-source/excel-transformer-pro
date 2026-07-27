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

  it("should generate shopify CSV format from transformed data", () => {
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
      description: "Descripcion test",
    };

    const csvData = transformToShopifyCSV(transformed, config);
    expect(csvData.length).toBe(3); // 1 header + 2 variants
    expect(csvData[0][0]).toBe("Handle");
    expect(csvData[1][0]).toBe("p0109"); // Handle for reference P0109
    expect(csvData[1][17]).toBe("P0109S01"); // Variant SKU
  });
});
