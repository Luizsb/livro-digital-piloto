import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Base absoluta do GitHub Pages — assets funcionam em subrotas como /teste/. */
export const GITHUB_PAGES_BASE = '/livro-digital-piloto/';

const isPagesBuild = process.env.GITHUB_PAGES === 'true';
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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

/** GitHub Pages usa 404.html como fallback em rotas inexistentes. */
function pages404Fallback(): Plugin {
  return {
    name: 'pages-404-fallback',
    closeBundle() {
      if (!isPagesBuild) return;
      const distDir = path.join(projectRoot, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const fallbackPath = path.join(distDir, '404.html');
      fs.copyFileSync(indexPath, fallbackPath);
      const testeDir = path.join(distDir, 'teste');
      fs.mkdirSync(testeDir, { recursive: true });
      fs.copyFileSync(indexPath, path.join(testeDir, 'index.html'));
      fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ command }) => {
  const base = isPagesBuild ? GITHUB_PAGES_BASE : '/';

  return {
    resolve: {
      alias: {
        '@app': path.resolve(projectRoot, 'src/app'),
        '@book': path.resolve(projectRoot, 'src/book'),
        '@analytics': path.resolve(projectRoot, 'src/analytics'),
        '@analytics-ui': path.resolve(projectRoot, 'src/analytics-ui'),
        '@dashboard': path.resolve(projectRoot, 'src/dashboard'),
        '@shared': path.resolve(projectRoot, 'src/shared'),
      },
    },
    plugins: [
      react(),
      rewriteRootAssetUrls(base),
      pages404Fallback(),
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
