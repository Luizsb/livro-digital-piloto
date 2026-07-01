/**
 * Caminhos públicos do ODA (arquivos em public/ODAS/... → servidos pelo Vite em runtime).
 * Use em this.load.image(...) e carregamento de fontes via CSS ou Phaser.
 */
export const ODA_ID = 'SAE26_AI43_HIS_C07_OA1' as const;

const RES = `ODAS/${ODA_ID}/resources`;

/** Base: ex. "./ODAS/SAE26_AI43_HIS_C07_OA1/resources" com base Vite `./` */
export function odaResourcesBase(): string {
  const base = import.meta.env.BASE_URL;
  const path = `${base}${RES}`.replace(/([^:]\/)\/+/g, '$1');
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/** URL completa para um ficheiro dentro de resources/ (ex: "game/images/foo.png") */
export function odaResourceUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `${odaResourcesBase()}/${clean}`.replace(/([^:]\/)\/+/g, '$1');
}

/** URL do `index.html` do ODA em `public/ODAS/{id}/` (para iframe no modal). */
export function odaIndexUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return `${base}ODAS/${ODA_ID}/index.html`.replace(/([^:]\/)\/+/g, '/');
}
