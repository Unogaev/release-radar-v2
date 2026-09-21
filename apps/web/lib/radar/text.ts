const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", apos: "'", gt: ">", hellip: "…", ldquo: "“", lsquo: "‘",
  lt: "<", mdash: "—", nbsp: " ", ndash: "–", quot: '"', rdquo: "”", rsquo: "’",
};

/** Decode the HTML entities most often leaked by RSS headlines. */
export function decodeHtmlEntities(value: string): string {
  let decoded = value;
  // Some publishers double-escape titles, so make at most two safe passes.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = decoded.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const isHex = entity[1]?.toLowerCase() === "x";
        const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
        try { return String.fromCodePoint(codePoint); } catch { return match; }
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    });
    decoded = next;
    if (!decoded.includes("&")) break;
  }
  return decoded.replace(/\s+/g, " ").trim();
}
