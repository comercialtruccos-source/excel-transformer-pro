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
        text: "Concepto de colección: Casual Chic Noche. Presentación de Jeans REF P0109 con tiro alto y roturas.",
      },
    ];

    const result = matchPdfDesignData(pages, ["P0109"]);
    expect(result.has("P0109")).toBe(true);

    const pdfData = result.get("P0109")!;
    expect(pdfData.reference).toBe("P0109");
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

  it("should generate complete multichannel copy structure for a product reference", () => {
    const product: MergedProductData = {
      referencia: "P0109",
      nombre: "Jean Bota Recta",
      composicion: "98% Algodón 2% Elastano",
      colores: ["ROJO", "AZUL"],
      tallas: ["S", "M", "L"],
    };

    const copies = generateMultichannelCopy(product);

    // Verify TikTok strategy
    expect(copies.tikTok.hooks.length).toBeGreaterThan(0);
    expect(copies.tikTok.videoStructure.hookTime).toBeDefined();

    // Verify Instagram strategy
    expect(copies.instagram.mainCaption).toContain("P0109");
    expect(copies.instagram.carouselSlides.length).toBe(4);

    // Verify Facebook strategy
    expect(copies.facebook.conversationalCopy).toContain("P0109");

    // Verify Email strategy
    expect(copies.email.subjectLines.length).toBeGreaterThan(0);
    expect(copies.email.emailBodyText).toContain("P0109");

    // Verify Digital Ads strategy
    expect(copies.ads.headline).toContain("P0109");
    expect(copies.ads.angleA.text).toContain("P0109");
  });
});
