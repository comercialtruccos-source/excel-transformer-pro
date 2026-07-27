import { describe, it, expect } from "vitest";
import { matchPdfDesignData, PdfPageData } from "../lib/pdfParser";
import {
  buildMergedProducts,
  generateMultichannelCopy,
  MergedProductData
} from "../lib/marketingCopyGenerator";

describe("Marketing Multichannel Copy Generator Unit Tests", () => {
  it("should match PDF pages to references and extract design metadata", () => {
    const pages: PdfPageData[] = [
      {
        pageNumber: 1,
        text: "Colección Denim Revolution. Presentación de Jeans REF P0109 con tiro alto y roturas. Lavado vintage.",
      },
    ];

    const result = matchPdfDesignData(pages, ["P0109"]);
    expect(result.has("P0109")).toBe(true);

    const pdfData = result.get("P0109")!;
    expect(pdfData.reference).toBe("P0109");
    expect(pdfData.collectionTitle.toUpperCase()).toContain("DENIM REVOLUTION");
    expect(pdfData.details).toContain("tiro alto");
    expect(pdfData.details).toContain("roturas");
  });

  it("should build merged products from HGI rows and PDF design data", () => {
    const hgiRows = [
      ["SKU", "REFERENCIA", "TALLA", "COLOR", "CODIGO COLOR", "NOMBRE", "COMPOSICION"],
      ["P0109S01", "P0109", "S", "ROJO", "01", "JEAN BOTA RECTA", "98% ALGODON 2% ELASTANO"],
      ["P0109M01", "P0109", "M", "ROJO", "01", "JEAN BOTA RECTA", "98% ALGODON 2% ELASTANO"],
    ];

    const pdfDataMap = matchPdfDesignData(
      [{ pageNumber: 1, text: "REF P0109 oficina tiro alto" }],
      ["P0109"]
    );

    const merged = buildMergedProducts(hgiRows, pdfDataMap);
    expect(merged.length).toBe(1);
    expect(merged[0].referencia).toBe("P0109");
    expect(merged[0].colores).toContain("ROJO");
    expect(merged[0].tallas).toContain("S");
    expect(merged[0].tallas).toContain("M");
  });

  it("should generate distinct and harmonized copies for different references and PDF data", () => {
    const pages: PdfPageData[] = [
      {
        pageNumber: 1,
        text: "Colección Boho Chic 2026",
      },
      {
        pageNumber: 2,
        text: "REF P0109 - Jean bota ancha en tono hielo con tiro alto corsetero. Ideal para Oficina.",
      },
      {
        pageNumber: 3,
        text: "REF J0250 - Chamarra denim destruida con lavado ácido. Para Noche y Fiesta.",
      },
    ];

    const pdfDataMap = matchPdfDesignData(pages, ["P0109", "J0250"]);

    const product1: MergedProductData = {
      referencia: "P0109",
      nombre: "Jean Bota Ancha",
      composicion: "98% Algodón 2% Elastano",
      colores: ["AZUL HIELO"],
      tallas: ["S", "M", "L"],
      pdfDesign: pdfDataMap.get("P0109"),
    };

    const product2: MergedProductData = {
      referencia: "J0250",
      nombre: "Chamarra Denim",
      composicion: "100% Algodón Rígido",
      colores: ["NEGRO"],
      tallas: ["XS", "S", "M"],
      pdfDesign: pdfDataMap.get("J0250"),
    };

    const copy1 = generateMultichannelCopy(product1);
    const copy2 = generateMultichannelCopy(product2);

    // Verify PDF collection theme harmonization (case-insensitive check)
    expect(copy1.instagram.mainCaption.toUpperCase()).toContain("BOHO CHIC");
    expect(copy2.instagram.mainCaption.toUpperCase()).toContain("BOHO CHIC");

    // Verify slide-specific details and unique texts across references
    expect(copy1.instagram.mainCaption).toContain("Oficina");
    expect(copy2.instagram.mainCaption).toContain("Noche");

    // Ensure copies are distinct across references
    expect(copy1.instagram.mainCaption).not.toEqual(copy2.instagram.mainCaption);
    expect(copy1.tikTok.hooks[0]).not.toEqual(copy2.tikTok.hooks[0]);
  });
});
