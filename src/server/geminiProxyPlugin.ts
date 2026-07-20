import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const SYSTEM_INSTRUCTION = `Você é analista de dados de um piloto de livro digital escolar.
Responda sempre em português do Brasil, de forma clara e concisa.
Baseie-se estritamente nos dados recebidos. Não invente métricas.
Quando inferir comportamento, indique no texto que é hipótese.`;

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function geminiProxyPlugin(): Plugin {
  return {
    name: 'gemini-api-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      const resolveApiKey = () =>
        env.GEMINI_API_KEY?.trim() || env.VITE_GEMINI_API_KEY?.trim() || '';

      server.middlewares.use('/api/gemini/health', (_req, res) => {
        sendJson(res, 200, { configured: Boolean(resolveApiKey()) });
      });

      server.middlewares.use('/api/gemini/generate', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: { message: 'Method Not Allowed' } });
          return;
        }

        const apiKey = resolveApiKey();
        if (!apiKey) {
          sendJson(res, 503, {
            error: { message: 'GEMINI_API_KEY não configurada. Use .env.local na raiz do projeto.' },
          });
          return;
        }

        try {
          const body = (await readJsonBody(req)) as {
            prompt?: string;
            responseSchema?: Record<string, unknown>;
          };

          if (!body.prompt?.trim()) {
            sendJson(res, 400, { error: { message: 'Campo prompt é obrigatório.' } });
            return;
          }

          const upstream = await fetch(
            `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
                generationConfig: {
                  maxOutputTokens: 1200,
                  responseMimeType: 'application/json',
                  responseSchema: body.responseSchema,
                },
              }),
            },
          );

          const payload = await upstream.json();
          sendJson(res, upstream.status, payload);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro interno no proxy Gemini.';
          sendJson(res, 500, { error: { message } });
        }
      });
    },
  };
}
