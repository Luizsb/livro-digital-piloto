import type { GroupReport } from './types';
import { formatDuration, formatWouldUseAgain, getWouldUseAgainColor } from './reportExtractors';
import { pluralSessao, pluralValida, pluralParticipante } from '@shared/lib/pluralizePt';
import { GroupAdvancedSection } from './GroupAdvancedSection';
import {
  DeviceTypeCards,
  DimensionScoreBars,
  DonutChart,
  EngagementRateChart,
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

export function GroupReportContent({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const {
    summary,
    page_analytics,
    resource_analytics,
    engagement_analytics,
    feedback_analytics,
    technical_analytics,
    focus_analytics,
    advanced_analytics,
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
            hint={`${data_quality.reliable_session_count}/${n} ≥ ${data_quality.reliable_quality_threshold} · ver detalhes abaixo`}
          />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Status do capítulo"
          subtitle="Com base em páginas visualizadas e tempo mínimo de permanência em cada uma."
        >
          <DonutChart
            segments={chapterStatusSegments}
            centerLabel="sessões"
            centerValue={String(n)}
          />
        </Section>

        <Section
          title="Engajamento com recursos"
          subtitle="Percentual de sessões que interagiram com cada recurso digital."
        >
          <EngagementRateChart
            items={[
              {
                label: 'Vídeo Escola Digital (iniciou)',
                pct: engagement_analytics.sessions_with_video_pct,
                detail:
                  resource_analytics.avg_video_watch_seconds !== null
                    ? `média ${formatDuration(Math.round(resource_analytics.avg_video_watch_seconds))} assistido`
                    : undefined,
              },
              {
                label: 'Vídeo concluído',
                pct: engagement_analytics.sessions_with_video_completed_pct,
              },
              {
                label: 'ODA aberto',
                pct: engagement_analytics.sessions_with_oda_pct,
                detail: [
                  `média ${resource_analytics.avg_oda_opened} abert./sessão`,
                  resource_analytics.avg_oda_engagement_seconds !== null
                    ? `${formatDuration(Math.round(resource_analytics.avg_oda_engagement_seconds))} no modal`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
              },
              {
                label: 'Botão do professor',
                pct: engagement_analytics.sessions_with_teacher_pct,
                detail: `média ${engagement_analytics.avg_teacher_button_opens.toFixed(1)} aberturas`,
              },
              {
                label: 'Zoom em imagens',
                pct: engagement_analytics.sessions_with_image_zoom_pct,
                detail: `média ${resource_analytics.avg_image_zoom_total} zooms`,
              },
            ]}
          />
        </Section>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Profundidade de leitura">
          <HorizontalBarChart items={summary.reading_depth_distribution} total={n} />
        </Section>

        <Section title="Recursos digitais (detalhe)">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <dt className="text-slate-500">Recursos abertos (média)</dt>
              <dd className="mt-1 text-xl font-bold text-[#80298F]">
                {resource_analytics.avg_resources_opened}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <dt className="text-slate-500">Zoom em imagens (média)</dt>
              <dd className="mt-1 text-xl font-bold text-[#80298F]">
                {resource_analytics.avg_image_zoom_total}{' '}
                <span className="text-sm font-normal text-slate-500">
                  total · {resource_analytics.avg_image_zoom_unique} únicas
                </span>
              </dd>
            </div>
            {resource_analytics.avg_oda_engagement_seconds !== null ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-slate-500">Tempo em ODA (média)</dt>
                <dd className="mt-1 text-xl font-bold text-[#80298F]">
                  {formatDuration(Math.round(resource_analytics.avg_oda_engagement_seconds))}
                </dd>
              </div>
            ) : null}
            {resource_analytics.avg_video_max_progress_pct !== null ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-slate-500">Progresso máx. no vídeo (média)</dt>
                <dd className="mt-1 text-xl font-bold text-[#80298F]">
                  {Math.round(resource_analytics.avg_video_max_progress_pct)}%
                </dd>
              </div>
            ) : null}
            {resource_analytics.avg_video_watch_seconds !== null ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:col-span-2">
                <dt className="text-slate-500">Tempo de vídeo assistido (média)</dt>
                <dd className="mt-1 text-xl font-bold text-[#80298F]">
                  {formatDuration(Math.round(resource_analytics.avg_video_watch_seconds))}
                </dd>
              </div>
            ) : null}
          </dl>
        </Section>
      </div>

      <Section
        title="Ambiente de acesso"
        subtitle="Dispositivos, sistemas operacionais e navegadores usados pelos participantes."
      >
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Tipo de dispositivo</h3>
            <DeviceTypeCards
              distribution={technical_analytics.device_type_distribution}
              total={n}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Sistema operacional</h3>
              <HorizontalBarChart
                items={technical_analytics.os_distribution}
                total={n}
                emptyLabel="SO não registrado neste lote."
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Navegador</h3>
              <HorizontalBarChart
                items={technical_analytics.browser_distribution}
                total={n}
                emptyLabel="Navegador não registrado neste lote."
              />
            </div>
          </div>

          {Object.keys(technical_analytics.device_distribution).length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Detalhe do dispositivo</h3>
              <HorizontalBarChart items={technical_analytics.device_distribution} total={n} />
            </div>
          ) : null}

          <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Alertas técnicos</p>
              <p className="text-lg font-bold text-[#80298F]">
                {technical_analytics.sessions_with_technical_issues} ({technical_analytics.technical_issues_pct}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Erros de runtime</p>
              <p className="text-lg font-bold text-[#80298F]">
                {technical_analytics.total_runtime_errors}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Erros de carregamento</p>
              <p className="text-lg font-bold text-[#80298F]">
                {technical_analytics.total_asset_load_errors}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Erros de renderização</p>
              <p className="text-lg font-bold text-[#80298F]">
                {technical_analytics.total_render_errors}
              </p>
            </div>
          </div>
        </div>
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

      <GroupAdvancedSection analytics={advanced_analytics} sessionCount={n} />

      <Section title="Qualidade da coleta">
        <p className="mb-4 text-sm text-slate-600">
          O score não precisa ser 100% para a sessão ser útil. Penaliza eventos duplicados (ex.{' '}
          <code className="text-xs">events_exported</code> registrado duas vezes ao exportar manual
          e automático), inconsistências ou avisos na integridade dos eventos.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs text-slate-500">Score médio</p>
            <p className="mt-1 text-2xl font-bold text-[#80298F]">
              {data_quality.avg_data_quality_score ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs text-slate-500">
              Sessões confiáveis (≥ {data_quality.reliable_quality_threshold})
            </p>
            <p className="mt-1 text-2xl font-bold text-[#80298F]">
              {data_quality.reliable_session_count}/{n}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs text-slate-500">Duplicadas ignoradas</p>
            <p className="mt-1 text-2xl font-bold text-[#80298F]">
              {data_quality.duplicate_session_ids.length}
            </p>
          </div>
        </div>
        {data_quality.session_quality_issues.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-sm font-semibold text-amber-900">Sessões com score abaixo de 100</p>
            <ul className="mt-2 space-y-2 text-sm text-amber-800">
              {data_quality.session_quality_issues.map((issue) => (
                <li key={`${issue.participant_id}:${issue.file_name}`}>
                  <span className="font-semibold">{issue.participant_id}</span> ({issue.file_name}) —{' '}
                  score {issue.score}
                  {issue.warnings.length > 0 ? (
                    <span className="block text-xs text-amber-700">{issue.warnings.join(' ')}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-700">
            Todas as sessões deste lote têm score 100 — sem eventos duplicados ou inconsistências.
          </p>
        )}
      </Section>

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

export default GroupReportContent;
