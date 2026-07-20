import { useMemo } from 'react';
import type { GroupReport } from './types';
import {
  editorialBacklogAreaLabel,
  buildGroupEditorialImprovement,
} from './buildGroupEditorialImprovement';
import { formatDuration, formatLoadTimeMs } from './reportExtractors';
import { DimensionScoreBars } from './groupCharts';
import { pluralSessao } from '@shared/lib/pluralizePt';

const AREA_STYLES = {
  conteudo: 'border-violet-200 bg-violet-50/60',
  recurso: 'border-sky-200 bg-sky-50/60',
  ux: 'border-emerald-200 bg-emerald-50/60',
  tecnico: 'border-amber-200 bg-amber-50/60',
} as const;

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function GroupEditorialImprovementReport({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const editorial = useMemo(() => buildGroupEditorialImprovement(report), [report]);
  const { feedback_summary } = editorial;

  const feedbackDimensions =
    feedback_summary.feedback_count > 0
      ? [
          { label: 'Clareza da navegação', value: feedback_summary.avg_navigation_clarity },
          { label: 'Conforto visual', value: feedback_summary.avg_visual_comfort },
          { label: 'Utilidade dos recursos', value: feedback_summary.avg_resource_usefulness },
        ]
      : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-slate-300/40 bg-gradient-to-br from-slate-100/80 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Editorial & melhoria de produto
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Backlog de melhorias com base em evidências
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Prioriza ajustes de conteúdo, recursos digitais, UX de leitura e experiência técnica para
          o time editorial e de produto (DIA LD).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Complementa a aba Retomada pedagógica (foco em aula) e Recursos digitais (inventário).
        </p>
      </section>

      <Section
        title="Backlog sugerido"
        subtitle="Itens ordenados por impacto potencial neste lote — use como ponto de partida, não como decisão automática."
      >
        <ul className="space-y-3">
          {editorial.backlog.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-4 py-4 ${AREA_STYLES[item.area]}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  {editorialBacklogAreaLabel(item.area)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    item.priority === 'high'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-white/70 text-slate-600'
                  }`}
                >
                  {item.priority === 'high' ? 'Prioridade alta' : 'Prioridade média'}
                </span>
              </div>
              <p className="mt-2 font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      {editorial.pages_for_review.length > 0 ? (
        <Section
          title="Páginas para revisão editorial"
          subtitle="Baixa conclusão, tempo curto ou visualização sem engajamento mínimo."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Página</th>
                  <th className="pb-2 pr-4 font-medium">Vistas / concl.</th>
                  <th className="pb-2 pr-4 font-medium">Tempo médio</th>
                  <th className="pb-2 font-medium">Sinal</th>
                </tr>
              </thead>
              <tbody>
                {editorial.pages_for_review.map((row) => (
                  <tr key={row.page} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-[#80298F]">Pág. {row.page}</td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.viewedPct}% / {row.completedPct}%
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.avg_dwell_seconds != null
                        ? formatDuration(Math.round(row.avg_dwell_seconds))
                        : '—'}
                    </td>
                    <td className="py-2.5 text-slate-600">{row.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {editorial.interactive_images.length > 0 ? (
        <Section title="Imagens que geram interação (zoom)">
          <ul className="grid gap-3 sm:grid-cols-2">
            {editorial.interactive_images.map((item) => (
              <li
                key={item.image_id}
                className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-slate-600">
                  {item.interaction_pct}% com zoom · {item.zoom_total} zoom(s) ·{' '}
                  {item.viewed_sessions}/{n} expostos
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {editorial.underused_resources.length > 0 ? (
        <Section title="Recursos digitais subutilizados">
          <ul className="grid gap-3 sm:grid-cols-2">
            {editorial.underused_resources.map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-slate-600">
                  {item.open_pct}% de adoção · {item.sessions_missed} de {n} não abriram
                </p>
              </li>
            ))}
          </ul>
          {report.resource_analytics.avg_video_max_progress_pct !== null ? (
            <p className="mt-4 text-sm text-slate-600">
              Progresso médio no vídeo:{' '}
              <span className="font-semibold text-[#80298F]">
                {Math.round(report.resource_analytics.avg_video_max_progress_pct)}%
              </span>
              {' · '}
              {report.resource_analytics.sessions_with_video_completed_pct}% concluíram a
              reprodução
            </p>
          ) : null}
        </Section>
      ) : null}

      {feedback_summary.feedback_count > 0 ? (
        <Section
          title="Feedback sobre a experiência"
          subtitle={`${feedback_summary.feedback_count} resposta(s) neste lote`}
        >
          {feedback_summary.avg_rating !== null ? (
            <p className="mb-4 text-sm text-slate-700">
              Nota geral média:{' '}
              <span className="text-lg font-bold text-[#80298F]">
                {feedback_summary.avg_rating.toFixed(1)}/5
              </span>
            </p>
          ) : null}
          {feedbackDimensions.length > 0 ? (
            <DimensionScoreBars dimensions={feedbackDimensions} />
          ) : null}
        </Section>
      ) : (
        <Section title="Feedback sobre a experiência">
          <p className="text-sm text-slate-500">Nenhum feedback enviado neste lote.</p>
        </Section>
      )}

      {editorial.device_experience.length > 0 ? (
        <Section title="Experiência por dispositivo">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Dispositivo</th>
                  <th className="pb-2 pr-4 font-medium">Sessões</th>
                  <th className="pb-2 pr-4 font-medium">Carga média</th>
                  <th className="pb-2 font-medium">Alertas técnicos</th>
                </tr>
              </thead>
              <tbody>
                {editorial.device_experience.map((row) => (
                  <tr key={row.device_label} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-slate-800">{row.device_label}</td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.session_count} {pluralSessao(row.session_count)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {formatLoadTimeMs(row.avg_load_ms)}
                    </td>
                    <td className="py-2.5 text-slate-700">
                      {row.technical_issue_sessions > 0
                        ? `${row.technical_issue_sessions} ${pluralSessao(row.technical_issue_sessions)}`
                        : 'Nenhum'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </div>
  );
}

export default GroupEditorialImprovementReport;
