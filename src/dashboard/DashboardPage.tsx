import { useRef, useState } from 'react';
import { getChapterTotalPages, resolveChapterPageBounds } from '../analytics/chapterPageConfig';
import { parseReportFile, ReportParseError } from './parseReport';
import type { ParsedDashboardReport } from './types';
import {
  buildChapterStatusInsight,
  buildHealthChecks,
  buildInterpretationAlerts,
  buildSessionInsight,
  buildTechnicalAlerts,
} from './reportInsights';
import {
  buildPageJourney,
  extractSessionDurationSeconds,
  extractZoomedImageIds,
  formatDuration,
  formatExportedAt,
  formatWouldUseAgain,
  getChapterStatusBadgeClass,
  getChapterStatusLabel,
  getParticipantLabel,
  type ChapterStatusLabel,
} from './reportExtractors';

function StatusMetricCard({ status }: { status: ChapterStatusLabel }) {
  return (
    <div className="flex min-h-[6.75rem] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500">
        Status do capítulo
      </p>
      <div className="mt-3">
        <span
          className={`inline-block rounded-full border px-3 py-1.5 text-sm font-semibold leading-snug ${getChapterStatusBadgeClass(status)}`}
        >
          {status}
        </span>
      </div>
      <span className="mt-auto" aria-hidden />
    </div>
  );
}

function InsightIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionInsightBlock({
  text,
  eventCount,
  exportedAt,
}: {
  text: string;
  eventCount: number;
  exportedAt: string;
}) {
  return (
    <section className="rounded-2xl border-2 border-[#80298F]/20 bg-gradient-to-br from-[#F9DDFF]/60 via-white to-white p-6 shadow-md">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#80298F] text-white shadow-sm">
          <InsightIcon />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Resumo interpretativo</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Leitura executiva da sessão — comportamento de uso, não validação técnica.
          </p>
        </div>
      </div>
      <p className="text-base leading-relaxed text-slate-800">{text}</p>
      <p className="mt-4 text-xs text-slate-500">
        {eventCount} evento(s) · exportado em {formatExportedAt(exportedAt)}
      </p>
    </section>
  );
}

function InterpretationAlertsBlock({ alerts }: { alerts: ReturnType<typeof buildInterpretationAlerts> }) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nenhum alerta de interpretação para esta sessão.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
            alert.severity === 'warning'
              ? 'bg-amber-50 text-amber-950'
              : 'bg-blue-50 text-blue-950'
          }`}
        >
          <span className="shrink-0 font-semibold" aria-hidden>
            {alert.severity === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  );
}
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
      <p className="mt-2 break-words text-base font-bold leading-snug text-[#80298F] sm:text-lg">
        {value}
      </p>
      {hint ? (
        <p className="mt-auto pt-1 text-xs text-slate-500">{hint}</p>
      ) : (
        <span className="mt-auto" aria-hidden />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function DashboardContent({ parsed }: { parsed: ParsedDashboardReport }) {
  const { report, summary, events, feedbackComments, warnings } = parsed;
  const [showComment, setShowComment] = useState(false);
  const totalPages =
    summary.chapter_total_pages ?? getChapterTotalPages(resolveChapterPageBounds(summary));
  const duration = extractSessionDurationSeconds(events);
  const pageJourney = buildPageJourney(summary);
  const zoomedImages = extractZoomedImageIds(events);
  const healthChecks = buildHealthChecks(summary);
  const interpretationAlerts = buildInterpretationAlerts(summary);
  const technicalAlerts = buildTechnicalAlerts(summary);
  const chapterStatus = getChapterStatusLabel(summary);
  const sessionInsight = buildSessionInsight(parsed);
  const commentText = feedbackComments[0]?.comment;

  return (
    <div className="space-y-6">
      {warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {warning}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Participante" value={getParticipantLabel(summary)} />
        <MetricCard label="Duração da sessão" value={formatDuration(duration)} />
        <MetricCard
          label="Páginas visualizadas"
          value={`${summary.pages_viewed_count}/${totalPages}`}
        />
        <MetricCard
          label="Páginas concluídas"
          value={`${summary.pages_completed_count}/${totalPages}`}
          hint={`${summary.completion_rate}%`}
        />
        <StatusMetricCard status={chapterStatus} />
        <MetricCard
          label="Profundidade de leitura"
          value={summary.reading_depth_label ?? '—'}
        />
        <MetricCard
          label="Feedback geral"
          value={
            summary.feedback.submitted && summary.feedback.rating
              ? `${summary.feedback.rating}/5`
              : 'Sem feedback'
          }
        />
        <MetricCard
          label="Usaria novamente"
          value={formatWouldUseAgain(summary.feedback.would_use_again)}
        />
      </div>

      <SessionInsightBlock
        text={sessionInsight}
        eventCount={report.event_count}
        exportedAt={report.exported_at}
      />

      <Section title="Jornada de leitura">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-emerald-700">✓</span>
            <span>Concluída</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-[#80298F]">•</span>
            <span>Apenas visualizada</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">○</span>
            <span>Não visualizada</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {pageJourney.map((item) => (
            <div
              key={item.page}
              className={`rounded-lg border px-2 py-3 text-center text-sm font-semibold ${
                item.status === 'completed'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : item.status === 'viewed'
                    ? 'border-[#80298F]/30 bg-[#F9DDFF]/40 text-[#80298F]'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <div className="text-lg">{item.page}</div>
              <div className="mt-1 text-[10px] font-normal">
                {item.status === 'completed'
                  ? '✓ Concluída'
                  : item.status === 'viewed'
                    ? '• Apenas visualizada'
                    : '○ Não visualizada'}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium">Visualizadas:</span>{' '}
          {summary.pages_viewed.join(', ') || '—'}
          <br />
          <span className="font-medium">Concluídas:</span>{' '}
          {summary.pages_completed.join(', ') || '—'}
        </p>
      </Section>

      <Section title="Status do capítulo">
        <div className="mb-4">
          <span
            className={`inline-block rounded-full border px-3 py-1.5 text-sm font-semibold ${getChapterStatusBadgeClass(chapterStatus)}`}
          >
            {chapterStatus}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {buildChapterStatusInsight(summary)}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Taxa de conclusão</dt>
            <dd className="font-semibold text-[#80298F]">{summary.completion_rate}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">Capítulo finalizado</dt>
            <dd className="font-semibold text-[#80298F]">
              {summary.chapter_finished_count > 0 ? 'Sim' : 'Não'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Capítulo concluído (critério)</dt>
            <dd className="font-semibold text-[#80298F]">
              {summary.chapter_completed_count > 0 ? 'Sim' : 'Não'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Profundidade</dt>
            <dd className="font-semibold text-[#80298F]">
              {summary.reading_depth_label ?? '—'}
            </dd>
          </div>
        </dl>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Imagens no capítulo">
          <p className="mb-4 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Exposição</span> indica que a imagem
            entrou na tela; <span className="font-medium text-slate-700">interação</span> registra
            ação intencional (zoom).
          </p>
          <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Imagens expostas na leitura</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.images_viewed_unique_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Imagens com interação</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.image_zoom_unique_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Zooms realizados</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.image_zoom_total}
              </dd>
            </div>
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Imagens expostas</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {summary.images_viewed_unique.length > 0 ? (
                  summary.images_viewed_unique.map((id) => (
                    <li key={id} className="rounded bg-slate-50 px-2 py-1 font-mono text-xs">
                      {id}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">Nenhuma</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Interações intencionais</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {zoomedImages.length > 0 ? (
                  zoomedImages.map((id) => (
                    <li key={id} className="rounded bg-slate-50 px-2 py-1 font-mono text-xs">
                      {id}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">Nenhuma</li>
                )}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Recursos externos">
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Recursos abertos</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.resources_opened_total}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Recursos únicos</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.resources_opened_unique_count}
              </dd>
            </div>
          </dl>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#80298F]/20 bg-[#F9DDFF]/30 p-4">
              <h3 className="font-semibold text-[#80298F]">Escola Digital</h3>
              <p className="mt-2 text-sm text-slate-700">
                Modal aberto: {summary.escola_digital_opened_count}×
              </p>
              <p className="text-sm text-slate-700">
                Tempo no modal: {summary.escola_digital_engagement_total_seconds}s
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Play no vídeo: {summary.escola_digital_video_play_count}×
              </p>
              <p className="text-sm text-slate-700">
                Conclusão até o fim:{' '}
                {summary.escola_digital_video_watched_to_end ? 'Sim' : 'Não'}
                {summary.escola_digital_video_completed_count > 0
                  ? ` (${summary.escola_digital_video_completed_count}×)`
                  : ''}
              </p>
              {summary.escola_digital_video_max_progress_percent > 0 ? (
                <p className="text-sm text-slate-700">
                  Progresso máximo: {summary.escola_digital_video_max_progress_percent}%
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-[#80298F]/20 bg-[#F9DDFF]/30 p-4">
              <h3 className="font-semibold text-[#80298F]">ODA</h3>
              <p className="mt-2 text-sm text-slate-700">
                Aberto: {summary.oda_opened_count}×
              </p>
              <p className="text-sm text-slate-700">
                Tempo: {summary.oda_engagement_total_seconds}s
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Botão do professor">
        {summary.teacher_button_opened_count > 0 ? (
          <>
            <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-500">Aberturas totais</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.teacher_button_opened_count}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Botões diferentes abertos</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.teacher_button_unique_count}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Tempo total aberto</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.teacher_button_total_seconds}s
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Botão mais acessado</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.most_opened_teacher_section ? (
                    <>
                      Página {summary.most_opened_teacher_section.page} —{' '}
                      {summary.most_opened_teacher_section.open_count}{' '}
                      {summary.most_opened_teacher_section.open_count === 1
                        ? 'abertura'
                        : 'aberturas'}
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Página</th>
                    <th className="px-4 py-3">Seção</th>
                    <th className="px-4 py-3">Aberturas</th>
                    <th className="px-4 py-3">Tempo total</th>
                    <th className="px-4 py-3">Média</th>
                    <th className="px-4 py-3">Repetiu?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.teacher_button_usage_by_section.map((row) => (
                    <tr key={row.section_id} className="text-slate-700">
                      <td className="px-4 py-3 font-medium">{row.page}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.section_id}</td>
                      <td className="px-4 py-3">{row.open_count}</td>
                      <td className="px-4 py-3">{row.total_seconds}s</td>
                      <td className="px-4 py-3">
                        {row.avg_seconds.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })}
                        s
                      </td>
                      <td className="px-4 py-3">
                        {row.opened_more_than_once ? 'Sim' : 'Não'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Botão do professor não foi aberto nesta sessão.
          </p>
        )}
      </Section>

      <Section title="Feedback">
        {summary.feedback.submitted ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-slate-500">Nota geral</dt>
              <dd className="font-semibold text-[#80298F]">{summary.feedback.rating}/5</dd>
            </div>
            <div>
              <dt className="text-slate-500">Clareza da navegação</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.feedback.navigation_clarity}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Conforto visual</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.feedback.visual_comfort}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Utilidade dos recursos</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.feedback.resource_usefulness}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Usaria novamente</dt>
              <dd className="font-semibold text-[#80298F]">
                {formatWouldUseAgain(summary.feedback.would_use_again)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Comentário enviado</dt>
              <dd className="font-semibold text-[#80298F]">
                {summary.feedback.has_comment ? 'Sim' : 'Não'}
              </dd>
            </div>
            {summary.feedback.comment_length ? (
              <div>
                <dt className="text-slate-500">Tamanho do comentário</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.feedback.comment_length} caracteres
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-slate-600">Nenhum feedback enviado nesta sessão.</p>
        )}

        {commentText ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {!showComment ? (
              <button
                type="button"
                onClick={() => setShowComment(true)}
                className="rounded-lg border border-[#80298F] px-4 py-2 text-sm font-semibold text-[#80298F] transition hover:bg-[#F9DDFF]"
              >
                Ver comentário
              </button>
            ) : (
              <div className="space-y-3">
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Comentário aberto pode conter informações pessoais. Exibir apenas em contexto
                  de validação interna.
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                  {commentText}
                </p>
                <button
                  type="button"
                  onClick={() => setShowComment(false)}
                  className="text-sm text-slate-600 underline"
                >
                  Ocultar comentário
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Saúde da coleta">
          <p className="mb-4 text-sm text-slate-600">
            Validação técnica dos eventos registrados na sessão.
          </p>
          <ul className="space-y-2">
            {healthChecks.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className={item.ok ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.ok ? '✓' : '○'}
                </span>
                <span className={item.ok ? 'text-slate-800' : 'text-slate-500'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          {technicalAlerts.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Problemas técnicos</h3>
              {technicalAlerts.map((alert) => (
                <p
                  key={alert.id}
                  className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  <span className="shrink-0 font-semibold" aria-hidden>
                    ⚠
                  </span>
                  <span>{alert.message}</span>
                </p>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Alertas de interpretação">
          <p className="mb-4 text-sm text-slate-600">
            Sinais de comportamento de leitura — não indicam falha na coleta de eventos.
          </p>
          <InterpretationAlertsBlock alerts={interpretationAlerts} />
        </Section>
      </div>
    </div>
  );
}

function DashboardPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedDashboardReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const result = await parseReportFile(file);
      setParsed(result);
      setFileName(file.name);
    } catch (err) {
      setParsed(null);
      setFileName(null);
      setError(
        err instanceof ReportParseError
          ? err.message
          : 'Não foi possível carregar o relatório.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <header className="border-b border-[#80298F]/20 bg-gradient-to-r from-[#80298F] to-[#9B4DAB] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              LD Insights
            </p>
            <h1 className="text-2xl font-bold">Dashboard do Livro Digital</h1>
            {parsed ? (
              <p className="mt-1 text-sm text-white/90">
                {parsed.report.book_id} · {parsed.report.chapter_id}
                {parsed.report.exported_at
                  ? ` · ${formatExportedAt(parsed.report.exported_at)}`
                  : ''}
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/90">
                Carregue um relatório JSON exportado pelo piloto
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow transition hover:bg-[#F9DDFF]"
            >
              {fileName ? 'Trocar JSON' : 'Carregar relatório JSON'}
            </button>
            <a
              href="#/"
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voltar ao livro
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-800">
            {error}
          </div>
        ) : null}

        {!parsed && !error ? (
          <div className="rounded-2xl border-2 border-dashed border-[#80298F]/30 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-800">
              Nenhum relatório carregado
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Exporte os eventos no piloto (botão &quot;Exportar eventos JSON&quot;) e carregue o
              arquivo aqui para visualizar indicadores de uso, leitura e feedback.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-full bg-[#80298F] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6b2278]"
            >
              Selecionar arquivo .json
            </button>
          </div>
        ) : null}

        {parsed ? <DashboardContent parsed={parsed} /> : null}
      </main>
    </div>
  );
}

export default DashboardPage;
