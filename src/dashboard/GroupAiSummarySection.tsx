import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GroupReport } from './types';
import { buildGroupAiSummaryInput, buildGroupAiSummaryPrompt } from './buildGroupAiSummaryInput';
import {
  formatGroupAiSummaryAsText,
  isGroupAiSummaryResult,
  type GroupAiSummaryResult,
} from './groupAiSummaryTypes';
import { checkGeminiAvailable, GeminiClientError, generateGroupAiSummary } from './geminiClient';

function cacheKeyForReport(report: GroupReport): string {
  return `ld-ai-summary:v2:${report.generated_at}:${report.valid_sessions_count}:${report.book_id}:${report.chapter_id}`;
}

function parseCachedSummary(raw: string | null): GroupAiSummaryResult | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isGroupAiSummaryResult(parsed)) return parsed;
  } catch {
    return null;
  }
  return null;
}

function InsightCard({
  title,
  items,
  variant = 'default',
}: {
  title: string;
  items: Array<{ label: string; detail: string; severity?: 'info' | 'warning' }>;
  variant?: 'default' | 'warning' | 'action';
}) {
  const styles =
    variant === 'warning'
      ? 'border-amber-200 bg-amber-50/70'
      : variant === 'action'
        ? 'border-[#80298F]/25 bg-[#F9DDFF]/25'
        : 'border-slate-200 bg-white';

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${styles}`}>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#80298F]">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={`${title}:${item.label}`} className="rounded-xl border border-white/60 bg-white/70 p-3">
            <p className="font-semibold text-slate-900">{item.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.detail}</p>
            {item.severity === 'warning' ? (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Atenção
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StructuredAiSummaryView({ summary }: { summary: GroupAiSummaryResult }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border-2 border-[#80298F]/20 bg-gradient-to-br from-[#F9DDFF]/50 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#80298F]">Síntese executiva</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{summary.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{summary.synthesis}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <InsightCard
          title="Padrões do grupo"
          items={summary.patterns.map((item) => ({ label: item.label, detail: item.detail }))}
        />
        <InsightCard
          title="Pontos de atenção"
          variant="warning"
          items={summary.attention_points.map((item) => ({
            label: item.label,
            detail: item.detail,
            severity: item.severity,
          }))}
        />
      </div>

      <InsightCard
        title="Recomendações práticas"
        variant="action"
        items={summary.recommendations.map((item) => ({
          label: item.action,
          detail: item.rationale,
        }))}
      />
    </div>
  );
}

export function GroupAiSummarySection({ report }: { report: GroupReport }) {
  const storageKey = useMemo(() => cacheKeyForReport(report), [report]);
  const [summary, setSummary] = useState<GroupAiSummaryResult | null>(() => {
    try {
      return parseCachedSummary(sessionStorage.getItem(storageKey));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const inputPreview = useMemo(() => buildGroupAiSummaryInput(report), [report]);

  useEffect(() => {
    let cancelled = false;
    void checkGeminiAvailable().then((ready) => {
      if (!cancelled) setGeminiReady(ready);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildGroupAiSummaryPrompt(inputPreview);
      const result = await generateGroupAiSummary(prompt);
      setSummary(result);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(result));
      } catch {
        // cache opcional
      }
    } catch (err) {
      const message =
        err instanceof GeminiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível gerar o resumo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [inputPreview, storageKey]);

  const clearCache = () => {
    setSummary(null);
    setError(null);
    setCopied(false);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(formatGroupAiSummaryAsText(summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar o resumo para a área de transferência.');
    }
  };

  const canGenerate = geminiReady === true && report.valid_sessions_count > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#9B4DAB]/25 bg-gradient-to-br from-[#F9DDFF]/40 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#80298F]">Resumo com IA</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Narrativa executiva do lote</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Síntese visual a partir dos agregados, comentários e alertas já calculados. Complementa as
          abas Consolidado, Recursos e Técnico — não as substitui.
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Conteúdo gerado por IA (Gemini). Valide números e hipóteses nas outras abas.
        </p>
      </section>

      {geminiReady === false ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">Gemini não disponível neste ambiente</p>
          <p className="mt-1">
            Em desenvolvimento, crie <code className="rounded bg-amber-100 px-1">.env.local</code>{' '}
            com <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY=sua_chave</code> e
            reinicie <code className="rounded bg-amber-100 px-1">npm run dev</code>. A chave fica no
            proxy local — não no bundle público.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading || !canGenerate}
          className="rounded-lg bg-[#80298F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b2278] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Gerando resumo…' : summary ? 'Regenerar resumo' : 'Gerar resumo com IA'}
        </button>
        {summary ? (
          <>
            <button
              type="button"
              onClick={() => void copySummary()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copied ? 'Copiado!' : 'Copiar resumo'}
            </button>
            <button
              type="button"
              onClick={clearCache}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpar
            </button>
          </>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {summary ? (
        <StructuredAiSummaryView summary={summary} />
      ) : !loading ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-600">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Sessões</p>
              <p className="mt-1 text-2xl font-bold text-[#80298F]">{inputPreview.sessions.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Comentários</p>
              <p className="mt-1 text-2xl font-bold text-[#80298F]">
                {inputPreview.feedback.written_comments.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Insights determinísticos</p>
              <p className="mt-1 text-2xl font-bold text-[#80298F]">
                {inputPreview.rule_based_insights.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Possível pulo no vídeo</p>
              <p className="mt-1 text-2xl font-bold text-[#80298F]">
                {inputPreview.resources.video_skip_suspected_count}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            A geração é sob demanda para economizar tokens. O resultado será exibido em cards
            estruturados (não markdown).
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Analisando o lote…
        </section>
      )}
    </div>
  );
}

export default GroupAiSummarySection;
