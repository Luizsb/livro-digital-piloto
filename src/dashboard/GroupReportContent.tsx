import { useState } from 'react';
import type { GroupReport } from './types';
import { useScrollToTopOnChange } from '@shared/hooks/useScrollToTopOnChange';
import { formatDuration, formatWouldUseAgain, getWouldUseAgainColor } from './reportExtractors';
import { pluralSessao, pluralValida, pluralParticipante } from '@shared/lib/pluralizePt';
import { GroupExecutiveSection } from './GroupExecutiveSection';
import { GroupResourcesReport } from './GroupResourcesReport';
import { GroupTechnicalReport } from './GroupTechnicalReport';
import {
  DimensionScoreBars,
  DonutChart,
  HorizontalBarChart,
  PageJourneyChart,
  RatingDistributionChart,
  type ChartSegment,
} from './groupCharts';

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning';
}) {
  const valueColor =
    accent === 'success'
      ? 'text-emerald-600'
      : accent === 'warning'
        ? 'text-amber-600'
        : 'text-[#80298F]';

  return (
    <div className="flex min-h-[6.75rem] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : <span className="mt-auto" />}
    </div>
  );
}

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

const CHAPTER_STATUS_COLORS = {
  full_completion: '#10b981',
  viewed_all_incomplete: '#f59e0b',
  partial_view: '#94a3b8',
};

type GroupReportView = 'executive' | 'consolidated' | 'resources' | 'technical';

function GroupReportWarnings({ report }: { report: GroupReport }) {
  const { data_quality } = report;
  if (report.warnings.length === 0 && report.load_errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {data_quality.mixed_book_or_chapter ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          Arquivos de livros ou capítulos diferentes detectados — revise o lote antes de interpretar
          os indicadores agregados.
        </div>
      ) : null}
      {report.warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {warning}
        </div>
      ))}
      {report.load_errors.map((err) => (
        <div
          key={`${err.file_name}:${err.message}`}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span className="font-medium">{err.file_name}:</span> {err.message}
        </div>
      ))}
    </div>
  );
}

function GroupReportViewTabs({
  view,
  onChange,
  report,
}: {
  view: GroupReportView;
  onChange: (view: GroupReportView) => void;
  report: GroupReport;
}) {
  const tabs: Array<{ id: GroupReportView; label: string; hint: string }> = [
    {
      id: 'executive',
      label: 'Executivo',
      hint: 'Síntese estratégica do piloto',
    },
    {
      id: 'consolidated',
      label: 'Consolidado',
      hint: 'Jornada, feedback e comparativo',
    },
    {
      id: 'resources',
      label: 'Recursos digitais',
      hint: 'ODA, vídeo, imagens e professor',
    },
    {
      id: 'technical',
      label: 'Técnico & QA',
      hint: 'Performance, erros e qualidade',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-xl px-4 py-3 text-left transition ${
              view === tab.id
                ? 'bg-[#80298F] text-white shadow-md shadow-[#80298F]/20'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="block text-sm font-bold">{tab.label}</span>
            <span
              className={`mt-0.5 block text-xs ${
                view === tab.id ? 'text-white/85' : 'text-slate-500'
              }`}
            >
              {tab.hint}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 px-2 text-xs text-slate-500">
        {report.participants_count} {pluralParticipante(report.participants_count)} ·{' '}
        {report.valid_sessions_count} {pluralSessao(report.valid_sessions_count)}{' '}
        {pluralValida(report.valid_sessions_count)} · cap. {report.chapter_id}
      </p>
    </div>
  );
}

function GroupConsolidatedReport({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const {
    summary,
    page_analytics,
    engagement_analytics,
    feedback_analytics,
    focus_analytics,
    data_quality,
  } = report;

  const chapterStatusSegments: ChartSegment[] = [
    {
      label: 'Concluiu 100% das páginas',
      value: engagement_analytics.full_completion_count,
      color: CHAPTER_STATUS_COLORS.full_completion,
    },
    {
      label: 'Viu todas, mas tempo insuficiente',
      value: engagement_analytics.viewed_all_incomplete_count,
      color: CHAPTER_STATUS_COLORS.viewed_all_incomplete,
    },
    {
      label: 'Não percorreu o capítulo inteiro',
      value: engagement_analytics.partial_view_count,
      color: CHAPTER_STATUS_COLORS.partial_view,
    },
  ];

  const wouldUseAgainSegments: ChartSegment[] = Object.entries(
    feedback_analytics.would_use_again_distribution,
  )
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      label: formatWouldUseAgain(key),
      value: count,
      color: getWouldUseAgainColor(key),
    }));

  return (
    <div className="space-y-6">
      <Section
        title="Visão geral do grupo"
        subtitle={`${report.participants_count} ${pluralParticipante(report.participants_count)} · ${n} ${pluralSessao(n)} ${pluralValida(n)} · cap. ${report.chapter_id}`}
      >
        <p className="mb-4 text-sm text-slate-600">
          O <strong>status do capítulo</strong> (gráfico abaixo) mostra quem concluiu 100% das páginas,
          quem viu tudo mas ficou pouco tempo em algumas, ou quem não percorreu o capítulo inteiro.
          Isso é diferente da <strong>média de conclusão</strong>, que mede, página a página, quantas
          atingiram o tempo mínimo.
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <MetricCard
            label="Participantes"
            value={String(report.participants_count)}
            hint={summary.participant_ids.join(', ') || undefined}
          />
          <MetricCard
            label="Sessões válidas"
            value={String(n)}
            hint={
              report.invalid_sessions_count > 0
                ? `${report.invalid_sessions_count} ignorada(s) (duplicadas ou inválidas)`
                : `${report.source_reports_count} arquivo(s) carregado(s)`
            }
          />
          <MetricCard
            label="Páginas vistas (média)"
            value={String(summary.avg_pages_viewed)}
            hint={`de ${page_analytics.total_pages} por sessão`}
          />
          <MetricCard
            label="Média de páginas concluídas"
            value={`${summary.avg_completion_rate}%`}
            hint="Das páginas vistas, quantas atingiram tempo mínimo"
          />
          <MetricCard
            label="Tempo visível (média)"
            value={formatDuration(summary.avg_visible_time_seconds)}
          />
          <MetricCard
            label="Sairam da aba do livro"
            value={`${focus_analytics.sessions_with_focus_loss_pct}%`}
            hint={
              focus_analytics.avg_tab_hidden_count !== null
                ? `Média de ${focus_analytics.avg_tab_hidden_count} saída(s) por sessão`
                : 'Nenhuma sessão perdeu o foco'
            }
            accent={focus_analytics.sessions_with_focus_loss_pct > 0 ? 'warning' : 'default'}
          />
          {focus_analytics.avg_hidden_time_seconds !== null &&
          focus_analytics.avg_hidden_time_seconds > 0 ? (
            <MetricCard
              label="Tempo fora da aba (média)"
              value={formatDuration(Math.round(focus_analytics.avg_hidden_time_seconds))}
              hint="Em outra guia ou aplicativo"
            />
          ) : null}
          {focus_analytics.avg_idle_time_seconds !== null &&
          focus_analytics.avg_idle_time_seconds > 0 ? (
            <MetricCard
              label="Tempo inativo (média)"
              value={formatDuration(Math.round(focus_analytics.avg_idle_time_seconds))}
              hint="Sem interação com a aba visível"
            />
          ) : null}
          <MetricCard
            label="Qualidade da coleta (média)"
            value={
              data_quality.avg_data_quality_score !== null
                ? String(data_quality.avg_data_quality_score)
                : '—'
            }
            hint={`${data_quality.reliable_session_count}/${n} ≥ ${data_quality.reliable_quality_threshold} · aba Técnico & QA`}
          />
        </div>
      </Section>

      <Section
        title="Status do capítulo"
        subtitle="Com base em páginas visualizadas e tempo mínimo de permanência em cada uma."
      >
        <div className="max-w-md">
          <DonutChart
            segments={chapterStatusSegments}
            centerLabel="sessões"
            centerValue={String(n)}
          />
        </div>
      </Section>

      <Section
        title="Jornada por página"
        subtitle="Onde o grupo avançou, concluiu ou abandonou — visualização comparativa por página."
      >
        <PageJourneyChart pages={page_analytics.heatmap} sessionCount={n} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {page_analytics.heatmap
            .filter((item) => item.abandonmentCount > 0)
            .sort((a, b) => b.abandonmentCount - a.abandonmentCount)
            .slice(0, 3)
            .map((item) => (
              <div
                key={item.page}
                className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm"
              >
                <span className="font-semibold text-amber-900">Ponto de abandono · pág. {item.page}</span>
                <p className="mt-1 text-amber-800">
                  {item.abandonmentCount} {pluralSessao(item.abandonmentCount)} parou
                  aqui ({n > 0 ? Math.round((item.abandonmentCount / n) * 100) : 0}%)
                </p>
              </div>
            ))}
        </div>
      </Section>

      <Section title="Profundidade de leitura">
        <HorizontalBarChart items={summary.reading_depth_distribution} total={n} />
      </Section>

      {feedback_analytics.feedback_count > 0 || feedback_analytics.written_comments.length > 0 ? (
        <Section
          title="Feedback dos participantes"
          subtitle={`${feedback_analytics.feedback_count} de ${n} responderam (${feedback_analytics.feedback_rate_pct}%)`}
        >
          {feedback_analytics.feedback_count > 0 ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Nota geral
                  {feedback_analytics.avg_rating !== null ? (
                    <span className="ml-2 text-2xl font-bold text-[#80298F]">
                      {feedback_analytics.avg_rating.toFixed(1)}/5
                    </span>
                  ) : null}
                </h3>
                <RatingDistributionChart
                  distribution={feedback_analytics.rating_distribution}
                  total={feedback_analytics.feedback_count}
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Dimensões (média)</h3>
                <DimensionScoreBars
                  dimensions={[
                    {
                      label: 'Clareza da navegação',
                      value: feedback_analytics.avg_navigation_clarity,
                    },
                    { label: 'Conforto visual', value: feedback_analytics.avg_visual_comfort },
                    {
                      label: 'Utilidade dos recursos',
                      value: feedback_analytics.avg_resource_usefulness,
                    },
                  ]}
                />
              </div>
            </div>
          ) : null}
          {wouldUseAgainSegments.length > 0 ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Usaria novamente?</h3>
              <DonutChart
                segments={wouldUseAgainSegments}
                centerLabel="respostas"
                centerValue={String(feedback_analytics.feedback_count)}
              />
            </div>
          ) : null}
          {feedback_analytics.written_comments.length > 0 ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">
                Comentários escritos ({feedback_analytics.written_comments.length})
              </h3>
              <ul className="space-y-4">
                {feedback_analytics.written_comments.map((item) => (
                  <li
                    key={`${item.participant_id}:${item.file_name}:${item.comment.slice(0, 40)}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#80298F]">{item.participant_id}</span>
                      {item.submitted_at_br ? (
                        <span className="text-xs text-slate-500">{item.submitted_at_br}</span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{item.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : (
        <Section title="Feedback dos participantes">
          <p className="text-sm text-slate-500">Nenhum feedback enviado neste lote.</p>
        </Section>
      )}

      <Section title="Comparativo entre participantes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Participante</th>
                <th className="pb-2 pr-4 font-medium">Páginas</th>
                <th className="pb-2 pr-4 font-medium">Conclusão</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Foco</th>
                <th className="pb-2 pr-4 font-medium">Recursos</th>
                <th className="pb-2 pr-4 font-medium">Tempo</th>
                <th className="pb-2 pr-4 font-medium">Qualidade</th>
                <th className="pb-2 font-medium">Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {report.sessions.map((row) => (
                <tr
                  key={`${row.sessionId}:${row.fileName}`}
                  className="border-b border-slate-100"
                >
                  <td className="py-2.5 pr-4 font-semibold text-[#80298F]">{row.participantId}</td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.pagesViewedCount}/{row.totalPages}
                    {row.abandonedBeforeEnd && row.abandonmentPage != null ? (
                      <span className="ml-1 text-xs text-amber-700">
                        (parou pág. {row.abandonmentPage})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.completionRate}%</td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.chapterStatus}</td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.tabHiddenCount > 0 ? (
                      <>
                        {row.tabHiddenCount} saída{row.tabHiddenCount === 1 ? '' : 's'}
                        {row.hiddenTimeSeconds !== null && row.hiddenTimeSeconds > 0
                          ? ` · ${formatDuration(row.hiddenTimeSeconds)} fora`
                          : ''}
                      </>
                    ) : (
                      'Sempre em foco'
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {[
                      row.videoPlayed ? 'Vídeo' : null,
                      row.odaOpened ? 'ODA' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {formatDuration(row.visibleTimeSeconds)}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.dataQualityScore ?? '—'}</td>
                  <td className="py-2.5 text-xs text-slate-500">{row.fileName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

export function GroupReportContent({ report }: { report: GroupReport }) {
  const [view, setView] = useState<GroupReportView>('executive');
  useScrollToTopOnChange(view);

  return (
    <div className="space-y-6">
      <GroupReportWarnings report={report} />
      <GroupReportViewTabs view={view} onChange={setView} report={report} />
      {view === 'executive' ? (
        <GroupExecutiveSection
          report={report}
          onOpenConsolidated={() => setView('consolidated')}
        />
      ) : view === 'resources' ? (
        <GroupResourcesReport report={report} />
      ) : view === 'technical' ? (
        <GroupTechnicalReport report={report} />
      ) : (
        <GroupConsolidatedReport report={report} />
      )}
    </div>
  );
}

export default GroupReportContent;
