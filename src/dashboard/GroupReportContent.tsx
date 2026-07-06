import type { GroupReport } from './types';
import { formatDuration, formatWouldUseAgain } from './reportExtractors';
import { PAGE_COMPLETION_RATE_LABEL } from '@analytics/metricDisplayLabels';

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[6.75rem] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#80298F]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : <span className="mt-auto" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function DistributionList({
  items,
  total,
}: {
  items: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados neste lote.</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map(([label, count]) => (
        <li key={label} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">{label}</span>
          <span className="font-semibold text-[#80298F]">
            {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeatmapBar({ pct, tone }: { pct: number; tone: 'viewed' | 'completed' | 'abandon' }) {
  const color =
    tone === 'viewed'
      ? 'bg-[#80298F]'
      : tone === 'completed'
        ? 'bg-emerald-500'
        : 'bg-amber-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GroupReportContent({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const { summary, page_analytics, resource_analytics, feedback_analytics, technical_analytics, data_quality } =
    report;

  return (
    <div className="space-y-6">
      {(report.warnings.length > 0 || report.load_errors.length > 0) && (
        <div className="space-y-2">
          {data_quality.mixed_book_or_chapter ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
              Arquivos de livros ou capítulos diferentes detectados — revise o lote antes de
              interpretar os indicadores agregados.
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
      )}

      <Section title="Visão geral do grupo">
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
            label={PAGE_COMPLETION_RATE_LABEL}
            value={`${summary.avg_completion_rate}%`}
            hint="Média do grupo"
          />
          <MetricCard
            label="Capítulo finalizado"
            value={`${summary.chapter_finished_pct}%`}
            hint="Clicou em Finalizar teste"
          />
          <MetricCard
            label="Capítulo concluído"
            value={`${summary.chapter_completed_pct}%`}
            hint="Critério pedagógico mínimo"
          />
          <MetricCard
            label="Abandonou antes do fim"
            value={`${summary.abandonment_pct}%`}
            hint="Não visualizou todas as páginas"
          />
          <MetricCard
            label="Tempo visível (média)"
            value={formatDuration(summary.avg_visible_time_seconds)}
          />
          {summary.avg_idle_time_seconds !== null ? (
            <MetricCard
              label="Tempo inativo (média)"
              value={formatDuration(Math.round(summary.avg_idle_time_seconds))}
            />
          ) : null}
          <MetricCard
            label="Qualidade da coleta (média)"
            value={data_quality.avg_data_quality_score !== null ? String(data_quality.avg_data_quality_score) : '—'}
            hint={`${data_quality.reliable_session_count}/${n} sessões ≥ ${data_quality.reliable_quality_threshold}`}
          />
        </div>
      </Section>

      <Section title="Jornada por página">
        <p className="mb-4 text-sm text-slate-600">
          Percentual de sessões em que cada página foi visualizada, concluída ou foi o ponto de
          abandono. Útil para identificar onde o capítulo perde participantes.
        </p>
        <div className="space-y-4">
          {page_analytics.heatmap.map((item) => (
            <div key={item.page} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">Pág. {item.page}</span>
                <span className="text-slate-500">
                  {item.viewedCount}/{n} vistas · {item.completedCount} concluídas
                  {item.abandonmentCount > 0 ? ` · ${item.abandonmentCount} abandono` : ''}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Visualizada ({item.viewedPct}%)
                  </p>
                  <HeatmapBar pct={item.viewedPct} tone="viewed" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Concluída ({item.completedPct}%)
                  </p>
                  <HeatmapBar pct={item.completedPct} tone="completed" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Abandono ({n > 0 ? Math.round((item.abandonmentCount / n) * 100) : 0}%)
                  </p>
                  <HeatmapBar
                    pct={n > 0 ? Math.round((item.abandonmentCount / n) * 100) : 0}
                    tone="abandon"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Profundidade de leitura">
          <DistributionList items={summary.reading_depth_distribution} total={n} />
        </Section>
        <Section title="Recursos digitais">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Recursos abertos (média)</dt>
              <dd className="font-semibold text-[#80298F]">{resource_analytics.avg_resources_opened}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sessões com ODA</dt>
              <dd className="font-semibold text-[#80298F]">{resource_analytics.sessions_with_oda_pct}%</dd>
            </div>
            <div>
              <dt className="text-slate-500">ODAs abertas (média)</dt>
              <dd className="font-semibold text-[#80298F]">{resource_analytics.avg_oda_opened}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Zoom em imagens (média)</dt>
              <dd className="font-semibold text-[#80298F]">
                {resource_analytics.avg_image_zoom_total} total ·{' '}
                {resource_analytics.avg_image_zoom_unique} únicas
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Vídeos iniciados</dt>
              <dd className="font-semibold text-[#80298F]">
                {resource_analytics.sessions_with_video_play_pct}% das sessões
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Vídeos concluídos</dt>
              <dd className="font-semibold text-[#80298F]">
                {resource_analytics.sessions_with_video_completed_pct}% das sessões
              </dd>
            </div>
            {resource_analytics.avg_video_watch_seconds !== null ? (
              <div>
                <dt className="text-slate-500">Tempo de vídeo (média)</dt>
                <dd className="font-semibold text-[#80298F]">
                  {formatDuration(Math.round(resource_analytics.avg_video_watch_seconds))}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-slate-500">Botão do professor</dt>
              <dd className="font-semibold text-[#80298F]">{resource_analytics.teacher_button_usage_pct}%</dd>
            </div>
          </dl>
        </Section>
      </div>

      {feedback_analytics.feedback_count > 0 ? (
        <Section title="Feedback">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Respostas</dt>
              <dd className="font-semibold text-[#80298F]">
                {feedback_analytics.feedback_count}/{n} ({feedback_analytics.feedback_rate_pct}%)
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Nota geral (média)</dt>
              <dd className="font-semibold text-[#80298F]">
                {feedback_analytics.avg_rating?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Clareza da navegação</dt>
              <dd className="font-semibold text-[#80298F]">
                {feedback_analytics.avg_navigation_clarity?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Conforto visual</dt>
              <dd className="font-semibold text-[#80298F]">
                {feedback_analytics.avg_visual_comfort?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Utilidade dos recursos</dt>
              <dd className="font-semibold text-[#80298F]">
                {feedback_analytics.avg_resource_usefulness?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
          </dl>
          {Object.keys(feedback_analytics.would_use_again_distribution).length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Usaria novamente</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {Object.entries(feedback_analytics.would_use_again_distribution).map(([key, count]) => (
                  <li key={key}>
                    {formatWouldUseAgain(key)}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : (
        <Section title="Feedback">
          <p className="text-sm text-slate-500">Nenhum feedback enviado neste lote.</p>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Ambiente técnico">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Dispositivos</p>
              <DistributionList items={technical_analytics.device_distribution} total={n} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Navegadores</p>
              <DistributionList items={technical_analytics.browser_distribution} total={n} />
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Sessões com alerta técnico</dt>
                <dd className="font-semibold text-[#80298F]">
                  {technical_analytics.sessions_with_technical_issues} ({technical_analytics.technical_issues_pct}%)
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Erros de runtime</dt>
                <dd className="font-semibold text-[#80298F]">{technical_analytics.total_runtime_errors}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Erros de carregamento</dt>
                <dd className="font-semibold text-[#80298F]">{technical_analytics.total_asset_load_errors}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Erros de renderização</dt>
                <dd className="font-semibold text-[#80298F]">{technical_analytics.total_render_errors}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section title="Qualidade da coleta">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Score médio</dt>
              <dd className="font-semibold text-[#80298F]">
                {data_quality.avg_data_quality_score ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sessões confiáveis (≥ {data_quality.reliable_quality_threshold})</dt>
              <dd className="font-semibold text-[#80298F]">
                {data_quality.reliable_session_count}/{n}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sessões duplicadas ignoradas</dt>
              <dd className="font-semibold text-[#80298F]">
                {data_quality.duplicate_session_ids.length}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Arquivos com erro de carga</dt>
              <dd className="font-semibold text-[#80298F]">{data_quality.load_error_count}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Avisos por sessão</dt>
              <dd className="font-semibold text-[#80298F]">{data_quality.per_session_warnings_count}</dd>
            </div>
          </dl>
        </Section>
      </div>

      <section className="rounded-2xl border-2 border-[#80298F]/20 bg-gradient-to-br from-[#F9DDFF]/60 via-white to-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-900">Insights automáticos</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Leitura executiva agregada — padrões de uso, não aprendizagem.
        </p>
        <ul className="mt-4 space-y-3">
          {report.insights.map((insight) => (
            <li key={insight} className="flex gap-2 text-base leading-relaxed text-slate-800">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#80298F]" aria-hidden />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </section>

      <Section title="Sessões do grupo">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Participante</th>
                <th className="pb-2 pr-4 font-medium">Páginas</th>
                <th className="pb-2 pr-4 font-medium">Conclusão</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
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
                    {formatDuration(row.visibleTimeSeconds)}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.dataQualityScore ?? '—'}
                  </td>
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

export default GroupReportContent;
