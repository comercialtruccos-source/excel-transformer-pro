import { describe, it, expect } from "vitest";
import { extractVariants, transformToShopifyFormat, ShopifyConfig } from "../lib/shopifyTransform";

describe("shopifyTransform tests", () => {
  it("should detect DESCRIPCIÓN and COMPOSICIÓN DE TELA and generate AIDA descriptions", () => {
    const data = [
      ["REFERENCIA", "SET TALLAS", "COLOR 1", "DESCRIPCIÓN", "COMPOSICIÓN DE TELA"],
      ["T22107053", "08 - 14", "AZUL MEDIO", "Jean Wide Leg Tiro Alto Pretina Asimétrica", "98% Algodón 2% Elastano"],
    ];

    const variants = extractVariants(data);
    expect(variants.length).toBeGreaterThan(0);
    expect(variants[0].referencia).toBe("T22107053");
    expect(variants[0].nombre).toBe("Jean Wide Leg Tiro Alto Pretina Asimétrica");
    expect(variants[0].composicion).toBe("98% Algodón 2% Elastano");

    const config: ShopifyConfig = {
      vendor: "Trucco's",
      productType: "Jeans",
      tags: "Denim",
      bodyTemplate: "AIDA",
      price: "159900",
      compareAtPrice: "189900",
      published: true,
      inventoryQty: "10",
      inventoryPolicy: "deny",
      weight: "500",
      imageBaseUrl: "https://example.com/",
      status: "active",
      titleTemplate: "{nombre} en {composicion} Marca Trucco's",
    };

    const shopifyCsv = transformToShopifyFormat(variants, config);
    expect(shopifyCsv.length).toBeGreaterThan(1);
    
    // Description column is index 2
    const description = shopifyCsv[1][2];
    expect(description).toContain("Jean Wide Leg Tiro Alto Pretina Asimétrica");
    expect(description).toContain("REF T22107053");
    expect(description).toContain("Confeccionada en 98% Algodón 2% Elastano");
    expect(description).toContain("REFERENCIA:");
    expect(description).toContain("COMPOSICIÓN:");
    expect(description).toContain("COLECCIÓN:");
  });

  it("should still generate valid AIDA when nombre or composicion are missing", () => {
    const data = [
      ["REF", "TALLA", "COLOR 1"],
      ["B29107", "S", "BLANCO"],
    ];

    const variants = extractVariants(data);
    expect(variants.length).toBe(1);

    const config: ShopifyConfig = {
      vendor: "Trucco's",
      productType: "Blusa",
      tags: "",
      bodyTemplate: "AIDA",
      price: "90000",
      compareAtPrice: "",
      published: true,
      inventoryQty: "5",
      inventoryPolicy: "deny",
      weight: "300",
      imageBaseUrl: "",
      status: "active",
      titleTemplate: "{referencia}",
    };

    const shopifyCsv = transformToShopifyFormat(variants, config);
    const description = shopifyCsv[1][2];
    expect(description).toContain("REF B29107");
    expect(description).toContain("REFERENCIA:");
    expect(description).toContain("COMPOSICIÓN:");
    expect(description).toContain("Disponible en catálogo");
  });
});
