// Hàm quét dùng bởi tokens.lint.test.ts (script `npm run lint`).

const HEX_COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?)\(/g;
const PX_VALUE = /(?<![\w.-])(\d*\.?\d+)px\b/g;
const SECRET_PUBLIC_VAR = /\bVITE_[A-Z0-9_]*(?:SECRET|SERVICE)[A-Z0-9_]*\b/g;

/** Literal màu (`#hex`, `rgb(`, `hsl(`) và giá trị px khác 0 — chỉ tokens.css được chứa chúng. */
export function findStyleLiterals(source: string): string[] {
  const colors = [...source.matchAll(HEX_COLOR), ...source.matchAll(COLOR_FUNCTION)].map((m) => m[0]);
  const pixels = [...source.matchAll(PX_VALUE)].filter((m) => Number(m[1]) !== 0).map((m) => m[0]);
  return [...colors, ...pixels];
}

/** Tên biến `VITE_*` chứa SECRET/SERVICE: biến `VITE_` vào bundle trình duyệt nên không được mang secret. */
export function findSecretPublicVars(source: string): string[] {
  return [...new Set([...source.matchAll(SECRET_PUBLIC_VAR)].map((m) => m[0]))];
}
