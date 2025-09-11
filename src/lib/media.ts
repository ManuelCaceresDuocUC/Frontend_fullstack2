// src/lib/media.ts
export const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/,"");

export const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export const toUrl = (key: string) => (S3_BASE ? `${S3_BASE}/${key.replace(/^\/+/,"")}` : key);
// src o key -> URL final
export const resolveImg = (src?: string) =>
  !src ? "" : /^https?:\/\//i.test(src) ? src : toUrl(src);

// construye key con tu estructura perfumes/<marca>/
export const buildKey = (brand: string, filename: string) =>
  `perfumes/${slug(brand)}/${crypto.randomUUID()}-${filename}`;
