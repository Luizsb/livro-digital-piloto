import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Base do GitHub Pages (repositório: Luizsb/livro-digital-piloto). */
export const GITHUB_PAGES_BASE = '/livro-digital-piloto/';

const isPagesBuild = process.env.GITHUB_PAGES === 'true';

/** Novo ID a cada `npm run dev` — o cliente usa isso para limpar dados de testes anteriores. */
function devSessionPlugin() {
  const devSessionId = `dev_${Date.now()}`;
  return {
    name: 'livro-piloto-dev-session',
    config() {
      return {
        define: {
          __DEV_SESSION_ID__: JSON.stringify(devSessionId),
        },
      };
    },
  };
}

/** @font-face em CSS usa `/fonts/...`; reescreve para respeitar o `base` em produção. */
function rewriteRootAssetUrls(base: string): Plugin {
  const normalized = base === '/' ? '/' : base.endsWith('/') ? base : `${base}/`;
  return {
    name: 'rewrite-root-asset-urls',
    transform(code, id) {
      if (normalized === '/' || !id.endsWith('.css')) return null;
      const rewritten = code.replace(/url\((['"]?)\//g, `url($1${normalized}`);
      if (rewritten === code) return null;
      return { code: rewritten, map: null };
    },
  };
}

export default defineConfig(({ command }) => {
  const base = isPagesBuild ? GITHUB_PAGES_BASE : '/';

  return {
    plugins: [
      react(),
      rewriteRootAssetUrls(base),
      ...(command === 'serve' ? [devSessionPlugin()] : []),
    ],
    define:
      command === 'build'
        ? {
            __DEV_SESSION_ID__: JSON.stringify(''),
          }
        : undefined,
    base,
  };
});
