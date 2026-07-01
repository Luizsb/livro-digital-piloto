/**
 * URL para ficheiros em `public/` (imagens, etc.), respeitando o `base` do Vite
 * (dev `/`, GitHub Pages `/livro-digital-piloto/`).
 */
export function publicUrl(pathFromPublic: string): string {
  const p = pathFromPublic.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return `/${p}`;
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return `${withSlash}${p}`;
}
