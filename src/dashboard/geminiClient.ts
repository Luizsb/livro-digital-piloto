import {
  isGroupAiSummaryResult,
  type GroupAiSummaryResult,
} from './groupAiSummaryTypes';

/** Modelo econômico para resumos curtos (Google AI). */
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const GROUP_AI_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    synthesis: { type: 'string' },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['label', 'detail'],
      },
    },
    attention_points: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          detail: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning'] },
        },
        required: ['label', 'detail', 'severity'],
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['action', 'rationale'],
      },
    },
  },
  required: ['title', 'synthesis', 'patterns', 'attention_points', 'recommendations'],
} as const;

export class GeminiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GeminiClientError';
  }
}

/** Compatibilidade legada — preferir checkGeminiAvailable(). */
export function getGeminiApiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY?.trim() || undefined;
}

export async function checkGeminiAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/gemini/health');
    if (response.ok) {
      const data = (await response.json()) as { configured?: boolean };
      return data.configured === true;
    }
  } catch {
    // proxy indisponível (ex.: GitHub Pages estático)
  }
  return Boolean(getGeminiApiKey());
}

async function callGeminiDirect(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new GeminiClientError(
      'Chave Gemini não configurada. Defina GEMINI_API_KEY no .env.local e use npm run dev.',
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
        responseSchema: GROUP_AI_SUMMARY_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? detail;
    } catch {
      // mantém statusText
    }
    throw new GeminiClientError(`Gemini API: ${detail}`, response.status);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiClientError('Resposta vazia da API Gemini.');
  }

  return text;
}

async function callGeminiViaProxy(prompt: string): Promise<string> {
  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      responseSchema: GROUP_AI_SUMMARY_SCHEMA,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  if (!response.ok) {
    throw new GeminiClientError(
      `Gemini API: ${data.error?.message ?? response.statusText}`,
      response.status,
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiClientError('Resposta vazia da API Gemini.');
  }

  return text;
}

function parseSummaryJson(raw: string): GroupAiSummaryResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isGroupAiSummaryResult(parsed)) {
      return parsed;
    }
  } catch {
    // tenta extrair bloco JSON
  }

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      if (isGroupAiSummaryResult(parsed)) {
        return parsed;
      }
    } catch {
      // fallthrough
    }
  }

  throw new GeminiClientError('Resposta da IA não está no formato JSON esperado.');
}

export async function generateGroupAiSummary(prompt: string): Promise<GroupAiSummaryResult> {
  let raw: string;

  try {
    raw = await callGeminiViaProxy(prompt);
  } catch (error) {
    if (error instanceof GeminiClientError && error.status === 404) {
      raw = await callGeminiDirect(prompt);
    } else if (error instanceof TypeError) {
      raw = await callGeminiDirect(prompt);
    } else {
      throw error;
    }
  }

  return parseSummaryJson(raw);
}
