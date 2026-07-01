import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [devSessionPlugin()] : [])],
  define:
    command === 'build'
      ? {
          __DEV_SESSION_ID__: JSON.stringify(''),
        }
      : undefined,
  base: '/',
}));
