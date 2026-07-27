import { describe, it, expect } from "vitest";
import { matchPdfDesignData, PdfPageData } from "../lib/pdfParser";
import {
  buildMergedProducts,
  generateMultichannelCopy,
} from "../lib/marketingCopyGenerator";
import { generateAIDAStructure } from "../lib/aidaDescriptions";

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

  it("should build merged products from HGI rows and PDF design data with central AIDA", () => {
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
    expect(merged[0].aida).toBeDefined();
    expect(merged[0].aida.atencion).toBeDefined();
    expect(merged[0].colores).toContain("ROJO");
    expect(merged[0].tallas).toContain("S");
  });

  it("should generate distinct and harmonized copies for different references derived from central AIDA", () => {
    const hgiRows = [
      ["SKU", "REFERENCIA", "TALLA", "COLOR", "CODIGO COLOR", "NOMBRE", "COMPOSICION"],
      ["P0109S01", "P0109", "S", "AZUL HIELO", "01", "Jean Bota Ancha", "98% Algodón 2% Elastano"],
      ["J0250S01", "J0250", "S", "NEGRO", "01", "Chamarra Denim", "100% Algodón Rígido"],
    ];

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
    const merged = buildMergedProducts(hgiRows, pdfDataMap);

    expect(merged.length).toBe(2);

    const copy1 = generateMultichannelCopy(merged[0]);
    const copy2 = generateMultichannelCopy(merged[1]);

    // Verify PDF collection theme harmonization
    expect(copy1.instagram.mainCaption.toUpperCase()).toContain("BOHO CHIC");
    expect(copy2.instagram.mainCaption.toUpperCase()).toContain("BOHO CHIC");

    // Ensure copies are derived from unique central AIDA and are distinct
    expect(copy1.ads.primaryText).not.toEqual(copy2.ads.primaryText);
    expect(copy1.tikTok.hooks[0]).not.toEqual(copy2.tikTok.hooks[0]);
  });
});
