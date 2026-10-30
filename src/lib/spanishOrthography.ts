// Correcciones ortográficas para palabras frecuentes en moda
// (catálogos suelen llegar en mayúsculas sin tildes).
// Aplica reemplazos respetando mayúsculas/minúsculas del original.

const REPLACEMENTS: Array<[RegExp, string]> = [
  // Materiales / composición
  [/\balgodon\b/gi, "algodón"],
  [/\bpoliester\b/gi, "poliéster"],
  [/\bpolyester\b/gi, "poliéster"],
  [/\bacrilico\b/gi, "acrílico"],
  [/\brayon\b/gi, "rayón"],
  [/\bnylon\b/gi, "nailon"],
  [/\bnailon\b/gi, "nailon"],
  [/\bbambu\b/gi, "bambú"],
  [/\bcañamo\b/gi, "cáñamo"],
  [/\bcanamo\b/gi, "cáñamo"],
  [/\bsaten\b/gi, "satén"],
  [/\bchifon\b/gi, "chifón"],
  [/\bgasa\b/gi, "gasa"],
  [/\bmezclilla\b/gi, "mezclilla"],
  [/\bdrill\b/gi, "drill"],
  [/\bdenim\b/gi, "denim"],
  [/\bspandex\b/gi, "spandex"],
  [/\belastano\b/gi, "elastano"],
  [/\bviscosa\b/gi, "viscosa"],
  [/\bmodal\b/gi, "modal"],
  [/\bpana\b/gi, "pana"],
  [/\blino\b/gi, "lino"],
  [/\blana\b/gi, "lana"],
  [/\bseda\b/gi, "seda"],
  [/\bencaje\b/gi, "encaje"],

  // Prendas
  [/\bpantalon\b/gi, "pantalón"],
  [/\bpantalones\b/gi, "pantalones"],
  [/\bcamison\b/gi, "camisón"],
  [/\bblusón\b/gi, "blusón"],
  [/\bbluson\b/gi, "blusón"],
  [/\bsueter\b/gi, "suéter"],
  [/\bsweter\b/gi, "suéter"],
  [/\bchaleco\b/gi, "chaleco"],
  [/\bchaqueta\b/gi, "chaqueta"],
  [/\bvestido\b/gi, "vestido"],
  [/\bfalda\b/gi, "falda"],
  [/\bblusa\b/gi, "blusa"],
  [/\bcamiseta\b/gi, "camiseta"],
  [/\bjean\b/gi, "jean"],
  [/\bjeans\b/gi, "jeans"],
  [/\bleggin\b/gi, "leggin"],
  [/\bleggings\b/gi, "leggings"],
  [/\bbody\b/gi, "body"],
  [/\btop\b/gi, "top"],
  [/\bbermuda\b/gi, "bermuda"],
  [/\bshort\b/gi, "short"],
  [/\bcorset\b/gi, "corsé"],
  [/\bkimono\b/gi, "kimono"],

  // Adjetivos comunes
  [/\bclasico\b/gi, "clásico"],
  [/\bclasica\b/gi, "clásica"],
  [/\bbasico\b/gi, "básico"],
  [/\bbasica\b/gi, "básica"],
  [/\belastico\b/gi, "elástico"],
  [/\belastica\b/gi, "elástica"],
  [/\bcomodo\b/gi, "cómodo"],
  [/\bcomoda\b/gi, "cómoda"],
  [/\bunico\b/gi, "único"],
  [/\bunica\b/gi, "única"],
  [/\bmagico\b/gi, "mágico"],
  [/\bmagica\b/gi, "mágica"],
  [/\bmoderno\b/gi, "moderno"],
  [/\bmoderna\b/gi, "moderna"],

  // Colores frecuentes
  [/\bturquesa\b/gi, "turquesa"],
  [/\bfucsia\b/gi, "fucsia"],
  [/\bcoral\b/gi, "coral"],
  [/\bmostaza\b/gi, "mostaza"],
  [/\bmarron\b/gi, "marrón"],
  [/\bcafe\b/gi, "café"],
  [/\bvinotinto\b/gi, "vinotinto"],
  [/\bvino tinto\b/gi, "vinotinto"],
];

// Conserva el casing del match original
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original === original.toLowerCase()) return replacement.toLowerCase();
  // Title case (primera mayúscula)
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}

export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export function fixSpanishOrthography(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, (match) => matchCase(match, replacement));
  }
  return result;
}