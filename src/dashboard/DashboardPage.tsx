import { useMemo, useRef, useState } from 'react';
import { getChapterTotalPages, resolveChapterPageBounds } from '../ld/chapterPageConfig';
import { parseReportFile, parseMultipleReportFiles, ReportParseError } from './parseReport';
import type { DashboardViewMode, ParsedDashboardReport } from './types';
import { buildGroupTestReport } from './buildGroupReport';
import GroupReportContent from './GroupReportContent';
import {
  buildChapterStatusInsight,
  buildHealthChecks,
  buildInterpretationAlerts,
  buildQualityChecksByCategory,
  buildSessionInsight,
  buildTechnicalAlerts,
  getIntegrityStatusClass,
  getIntegrityStatusLabel,
  QUALITY_CATEGORY_LABELS,
} from './reportInsights';
import {
  buildPageJourney,
  extractSessionDurationSeconds,
  extractSessionHiddenSeconds,
  extractSessionVisibleSeconds,
  extractVisibleTimeRatio,
  extractZoomedImageIds,
  formatDuration,
  formatCoverageRate,
  formatVisibleTimePercent,
  formatExportedAt,
  formatBytes,
  formatLoadTimeMs,
  getLoadTimeRating,
  formatWouldUseAgain,
  getChapterStatusBadgeClass,
  getChapterStatusLabel,
  getParticipantLabel,
  PAGE_JOURNEY_LABELS,
  type ChapterStatusLabel,
} from './reportExtractors';
import {
  formatBrowserLabel,
  formatScreenResolution,
} from '../ld/deviceContext';
import { MetricTerm, TECHNICAL_HEALTH_HINTS } from './InfoHint';
import {
  MODAL_TIME_LABEL,
  PAGE_COMPLETION_RATE_LABEL,
  READING_DEPTH_EXPLANATION,
  READING_DEPTH_LABEL,
  VIDEO_COMPLETED_LABEL,
  VIDEO_MAX_PROGRESS_LABEL,
  VIDEO_WATCH_TIME_LABEL,
} from '../ld/metricDisplayLabels';

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

function ChapterCoverageSection({ summary }: { summary: ParsedDashboardReport['summary'] }) {
  if (typeof summary.expected_pages_count !== 'number') {
    return (
      <Section title="Cobertura do capítulo">
        <p className="text-sm text-slate-500">
          Manifest do capítulo indisponível para este relatório.
        </p>
      </Section>
    );
  }

  const coverageRows = [
    {
      label: 'Páginas visualizadas',
      expected: summary.expected_pages_count,
      rate: summary.pages_viewed_coverage_rate,
      missing: summary.pages_not_viewed?.map((page) => `Pág. ${page}`) ?? [],
    },
    {
      label: 'Imagens expostas',
      expected: summary.expected_images_count ?? 0,
      rate: summary.image_exposure_coverage_rate,
      missing: summary.images_not_exposed ?? [],
    },
    {
      label: 'Recursos abertos',
      expected: summary.expected_resources_count ?? 0,
      rate: summary.resource_open_coverage_rate,
      missing: summary.resources_not_opened ?? [],
    },
    {
      label: 'Seções do professor usadas',
      expected: summary.expected_teacher_buttons_count ?? 0,
      rate: summary.teacher_button_usage_coverage_rate,
      missing: summary.teacher_buttons_not_used ?? [],
    },
    {
      label: 'Atividades iniciadas',
      expected: summary.expected_activities_count ?? 0,
      rate: summary.activity_start_coverage_rate,
      missing: summary.activities_not_started ?? [],
    },
  ];

  return (
    <Section title="Cobertura do capítulo">
      <p className="mb-4 text-sm text-slate-600">
        Compara o que foi coletado com o inventário esperado do capítulo (manifest). Evita
        interpretar &quot;nada aconteceu&quot; quando o capítulo simplesmente não tinha aquele
        elemento.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coverageRows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {row.label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#80298F]">
              {row.expected > 0 ? formatCoverageRate(row.rate) : 'N/A'}
            </dd>
            <dd className="mt-1 text-sm text-slate-600">
              {row.expected > 0
                ? `Inventário: ${row.expected} · Faltando: ${row.missing.length}`
                : 'Não previsto nesta versão do capítulo'}
            </dd>
            {row.missing.length > 0 ? (
              <dd className="mt-2 text-xs text-amber-800">
                {row.missing.join(', ')}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </Section>
  );
}

function QualityWarningGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950"
          >
            <span className="shrink-0 font-semibold" aria-hidden>
              ⚠
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
  const visibleDuration = extractSessionVisibleSeconds(events, summary);
  const hiddenDuration = extractSessionHiddenSeconds(events, summary);
  const visibleRatio = extractVisibleTimeRatio(events, summary);
  const pageJourney = buildPageJourney(summary);
  const zoomedImages = extractZoomedImageIds(events);
  const healthChecks = buildHealthChecks(summary);
  const qualityByCategory = buildQualityChecksByCategory(events, summary);
  const interpretationAlerts = buildInterpretationAlerts(summary);
  const technicalAlerts = buildTechnicalAlerts(summary);
  const chapterStatus = getChapterStatusLabel(summary);
  const sessionInsight = buildSessionInsight(parsed);
  const commentText = feedbackComments[0]?.comment;
  const loadTimeRating = getLoadTimeRating(summary.page_load_time_ms);

  const deviceEmoji =
    summary.device_type === 'mobile'
      ? '📱'
      : summary.device_type === 'tablet'
        ? '📲'
        : summary.device_type === 'desktop'
          ? '🖥️'
          : null;

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
        {hiddenDuration !== null && hiddenDuration > 0 ? (
          <>
            <MetricCard
              label="Tempo visível no livro"
              value={formatDuration(visibleDuration)}
              hint="Com a aba do livro em foco"
            />
            <MetricCard
              label="Tempo fora da aba"
              value={formatDuration(hiddenDuration)}
              hint="Participante em outra guia ou aplicativo"
            />
            <MetricCard
              label="Duração da sessão"
              value={formatDuration(duration)}
              hint="Tempo visível + tempo fora da aba"
            />
            <MetricCard
              label="Tempo visível (%)"
              value={formatVisibleTimePercent(visibleRatio)}
            />
          </>
        ) : (
          <MetricCard
            label="Tempo no livro"
            value={formatDuration(visibleDuration)}
            hint="Sessão inteira com a aba do livro em foco"
          />
        )}
        <MetricCard
          label="Páginas visualizadas"
          value={`${summary.pages_viewed_count}/${totalPages}`}
        />
        <MetricCard
          label="Páginas concluídas"
          value={`${summary.pages_completed_count}/${totalPages}`}
        />
        <MetricCard
          label={PAGE_COMPLETION_RATE_LABEL}
          value={`${summary.completion_rate}%`}
        />
        <StatusMetricCard status={chapterStatus} />
        <MetricCard
          label={READING_DEPTH_LABEL}
          value={summary.reading_depth_label ?? '—'}
          hint={READING_DEPTH_EXPLANATION}
        />
        {typeof summary.idle_time_seconds === 'number' && summary.idle_time_seconds > 0 ? (
          <MetricCard
            label="Tempo inativo"
            value={formatDuration(summary.idle_time_seconds)}
            hint="Sem mouse, teclado, scroll ou toque com a aba visível"
          />
        ) : null}
      </div>

      <SessionInsightBlock
        text={sessionInsight}
        eventCount={report.event_count}
        exportedAt={report.exported_at}
      />

      {summary.device_type_label ? (
        <Section title="Ambiente de acesso">
          <p className="mb-4 text-sm text-slate-600">
            Registrado no início da sessão — útil para entender em qual dispositivo o participante
            usou o livro digital.
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Dispositivo</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {deviceEmoji ? `${deviceEmoji} ` : ''}
                {summary.device_type_label}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sistema operacional</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">{summary.os_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Navegador</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {formatBrowserLabel(summary.browser_name, summary.browser_version)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Resolução da tela</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {formatScreenResolution(summary.screen_width, summary.screen_height)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Janela do navegador</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {formatScreenResolution(summary.viewport_width, summary.viewport_height)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Tela touch</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {summary.is_touch_device ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Idioma do app</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">{summary.app_language ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Idioma do navegador</dt>
              <dd className="mt-1 font-semibold text-[#80298F]">
                {summary.browser_language ?? '—'}
              </dd>
            </div>
          </dl>
        </Section>
      ) : null}

      <Section title="Saúde técnica na navegação">
        <p className="mb-4 text-sm text-slate-600">
          Problemas e tempos observados durante o uso real do livro — sem varredura automática do
          conteúdo. O peso em bytes reflete apenas o que foi carregado nesta sessão (páginas
          visitadas); cache local pode zerar a transferência de rede.
        </p>
        {!summary.has_technical_issues &&
        summary.page_load_time_ms == null &&
        summary.session_bytes_transferred == null ? (
          <p className="text-sm text-slate-500">
            Nenhum problema técnico registrado nesta sessão.
          </p>
        ) : null}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Tempo de carregamento"
                hint={TECHNICAL_HEALTH_HINTS.loadTime}
              />
            </dt>
            <dd className="mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#80298F]">
                  {formatLoadTimeMs(summary.page_load_time_ms)}
                </span>
                {loadTimeRating ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${loadTimeRating.badgeClass}`}
                  >
                    {loadTimeRating.label}
                  </span>
                ) : null}
              </div>
              {loadTimeRating ? (
                <p className="mt-1 text-xs text-slate-500">{loadTimeRating.hint}</p>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="DOM pronto" hint={TECHNICAL_HEALTH_HINTS.domReady} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatLoadTimeMs(summary.dom_content_loaded_ms)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="TTFB" hint={TECHNICAL_HEALTH_HINTS.ttfb} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatLoadTimeMs(summary.ttfb_ms)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Peso observado (sessão)"
                hint={TECHNICAL_HEALTH_HINTS.sessionWeight}
              />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatBytes(summary.session_bytes_transferred)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Peso de imagens (sessão)"
                hint={TECHNICAL_HEALTH_HINTS.imageWeight}
              />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatBytes(summary.session_image_bytes_transferred)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Recursos carregados"
                hint={TECHNICAL_HEALTH_HINTS.resourcesLoaded}
              />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {typeof summary.resources_loaded_count === 'number'
                ? summary.resources_loaded_count
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Erros de script" hint={TECHNICAL_HEALTH_HINTS.scriptErrors} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.runtime_errors_count ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Falhas de renderização"
                hint={TECHNICAL_HEALTH_HINTS.renderErrors}
              />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.render_errors_count ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Assets não carregados" hint={TECHNICAL_HEALTH_HINTS.missingAssets} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.asset_load_errors_count ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Imagens com erro" hint={TECHNICAL_HEALTH_HINTS.brokenImages} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.images_with_errors.length}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm
                label="Links internos quebrados"
                hint={TECHNICAL_HEALTH_HINTS.brokenLinks}
              />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.links_open_failed_count ?? 0}
            </dd>
          </div>
        </dl>
        {summary.bytes_from_cache_only ? (
          <p className="mt-3 text-xs text-slate-500">
            Os recursos desta sessão vieram principalmente do cache do navegador — o peso em bytes
            pode aparecer como 0 B mesmo com imagens exibidas.
          </p>
        ) : null}
        {summary.images_with_errors.length > 0 ? (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium">Imagens quebradas:</span>{' '}
            {summary.images_with_errors.join(', ')}
          </p>
        ) : null}
        {summary.runtime_error_messages?.length ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Mensagens de erro (script)</p>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {summary.runtime_error_messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.render_error_boundaries?.length ? (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium">Áreas com falha de renderização:</span>{' '}
            {summary.render_error_boundaries.join(', ')}
            {summary.render_error_pages?.length ? (
              <>
                {' '}
                (páginas: {summary.render_error_pages.join(', ')})
              </>
            ) : null}
          </p>
        ) : null}
        {summary.links_open_failed?.length ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Links internos que falharam</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {summary.links_open_failed.map((failure) => (
                <li key={failure.link_id}>
                  <span className="font-medium">{failure.link_id}</span> (p. {failure.page}) —{' '}
                  {failure.href}
                  {failure.http_status != null ? ` [HTTP ${failure.http_status}]` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.asset_load_failures?.length ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Assets que falharam</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {summary.asset_load_failures.map((failure) => (
                <li key={`${failure.asset_type}:${failure.src}`}>
                  <span className="font-medium">{failure.asset_type}</span> — {failure.src}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section title="Jornada de leitura">
        <p className="mb-4 text-sm text-slate-600">
          Páginas do livro percorridas nesta sessão
          {pageJourney.length > 0 ? (
            <>
              {' '}
              (pág. {pageJourney[0].page} a pág. {pageJourney[pageJourney.length - 1].page})
            </>
          ) : null}
          . O emoji em cada cartão indica o status (legenda).
        </p>
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {(Object.keys(PAGE_JOURNEY_LABELS) as Array<keyof typeof PAGE_JOURNEY_LABELS>).map(
            (status) => (
              <span key={status} className="flex items-center gap-2">
                <span className="text-base leading-none" aria-hidden>
                  {PAGE_JOURNEY_LABELS[status].emoji}
                </span>
                <span>{PAGE_JOURNEY_LABELS[status].legend}</span>
              </span>
            ),
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {pageJourney.map((item) => {
            const statusLabel = PAGE_JOURNEY_LABELS[item.status];
            return (
              <div
                key={item.page}
                title={`Página ${item.page} — ${statusLabel.legend}`}
                aria-label={`Página ${item.page} do livro: ${statusLabel.legend}`}
                className={`rounded-lg border px-2 py-2.5 text-center text-sm font-semibold ${
                  item.status === 'completed'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : item.status === 'viewed'
                      ? 'border-[#80298F]/30 bg-[#F9DDFF]/40 text-[#80298F]'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="text-lg leading-none" aria-hidden>
                  {statusLabel.emoji}
                </div>
                <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
                  Pág.
                </div>
                <div className="text-lg font-bold leading-tight">{item.page}</div>
              </div>
            );
          })}
        </div>
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
            <dt className="text-slate-500">{PAGE_COMPLETION_RATE_LABEL}</dt>
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
            <dt className="text-slate-500">{READING_DEPTH_LABEL}</dt>
            <dd className="font-semibold text-[#80298F]">
              {summary.reading_depth_label ?? '—'}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">{READING_DEPTH_EXPLANATION}</dd>
          </div>
          {summary.last_page_viewed != null ? (
            <div>
              <dt className="text-slate-500">Última página vista</dt>
              <dd className="font-semibold text-[#80298F]">Pág. {summary.last_page_viewed}</dd>
            </div>
          ) : null}
          {summary.abandoned_before_end ? (
            <div>
              <dt className="text-slate-500">Abandonou antes do fim</dt>
              <dd className="font-semibold text-amber-700">
                Sim
                {summary.abandonment_page != null
                  ? ` (pág. ${summary.abandonment_page})`
                  : ''}
              </dd>
            </div>
          ) : null}
        </dl>
      </Section>

      <ChapterCoverageSection summary={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Imagens no capítulo">
          <p className="mb-4 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Imagem exposta</span> (`image_viewed`)
            indica presença na viewport — não representa atenção.{' '}
            <span className="font-medium text-slate-700">Interação</span> (zoom) registra ação
            intencional.
          </p>
          <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Imagens expostas na leitura</dt>
              <dd className="font-semibold text-[#80298F]">
                {typeof summary.expected_images_count === 'number' && summary.expected_images_count > 0
                  ? `${summary.images_viewed_unique_count}/${summary.expected_images_count}`
                  : summary.images_viewed_unique_count}
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
                {MODAL_TIME_LABEL}: {summary.escola_digital_engagement_total_seconds}s
              </p>
              {summary.escola_digital_video_play_count > 0 ||
              summary.escola_digital_video_max_progress_percent > 0 ||
              summary.escola_digital_video_watch_total_seconds > 0 ? (
                <div className="mt-3 border-t border-[#80298F]/15 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vídeo no modal
                  </p>
                  {summary.escola_digital_video_watch_total_seconds > 0 ? (
                    <p className="mt-1 text-sm text-slate-700">
                      {VIDEO_WATCH_TIME_LABEL}: {summary.escola_digital_video_watch_total_seconds}s
                    </p>
                  ) : null}
                  {summary.escola_digital_video_max_progress_percent > 0 ? (
                    <p className="text-sm text-slate-700">
                      {VIDEO_MAX_PROGRESS_LABEL}:{' '}
                      {summary.escola_digital_video_max_progress_percent}%
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-700">
                    {VIDEO_COMPLETED_LABEL}:{' '}
                    {summary.escola_digital_video_watched_to_end ? 'Sim' : 'Não'}
                    {summary.escola_digital_video_completed_count > 0
                      ? ` (${summary.escola_digital_video_completed_count}×)`
                      : ''}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-[#80298F]/20 bg-[#F9DDFF]/30 p-4">
              <h3 className="font-semibold text-[#80298F]">ODA</h3>
              <p className="mt-2 text-sm text-slate-700">
                Aberto: {summary.oda_opened_count}×
              </p>
              <p className="text-sm text-slate-700">
                {MODAL_TIME_LABEL}: {summary.oda_engagement_total_seconds}s
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Botão do professor">
        {summary.teacher_button_opened_count > 0 ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              O detalhamento por seção (`teacher_button_usage_by_section`) é a visão principal —
              inclui repetições na mesma página, tempo total e médio por abertura.
            </p>
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
        <Section title="Qualidade da coleta">
          <p className="mb-4 text-sm text-slate-600">
            Antes de interpretar os dados, valide se a sessão está confiável para relatórios.
          </p>

          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Score de qualidade
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums text-[#80298F]">
                {summary.data_quality_score ?? '—'}
              </p>
            </div>
            {summary.event_integrity_status ? (
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${getIntegrityStatusClass(summary.event_integrity_status)}`}
              >
                {getIntegrityStatusLabel(summary.event_integrity_status)}
              </span>
            ) : null}
          </div>

          {(Object.keys(QUALITY_CATEGORY_LABELS) as Array<keyof typeof QUALITY_CATEGORY_LABELS>).map(
            (category) => {
              const items = qualityByCategory[category];
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    {QUALITY_CATEGORY_LABELS[category]}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 shrink-0 ${item.ok ? 'text-emerald-600' : item.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}
                        >
                          {item.ok ? '✓' : '✗'}
                        </span>
                        <span className={item.ok ? 'text-slate-800' : 'text-slate-600'}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}

          {(summary.missing_expected_events?.length ?? 0) > 0 ||
          (summary.duplicate_event_warnings?.length ?? 0) > 0 ||
          (summary.inconsistent_event_warnings?.length ?? 0) > 0 ||
          (summary.unexpected_event_warnings?.length ?? 0) > 0 ? (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              {summary.missing_expected_events && summary.missing_expected_events.length > 0 ? (
                <QualityWarningGroup
                  title="Eventos esperados ausentes"
                  items={summary.missing_expected_events}
                />
              ) : null}
              {summary.duplicate_event_warnings && summary.duplicate_event_warnings.length > 0 ? (
                <QualityWarningGroup
                  title="Possíveis duplicatas"
                  items={summary.duplicate_event_warnings}
                />
              ) : null}
              {summary.inconsistent_event_warnings &&
              summary.inconsistent_event_warnings.length > 0 ? (
                <QualityWarningGroup
                  title="Inconsistências"
                  items={summary.inconsistent_event_warnings}
                />
              ) : null}
              {summary.unexpected_event_warnings && summary.unexpected_event_warnings.length > 0 ? (
                <QualityWarningGroup
                  title="Eventos inesperados"
                  items={summary.unexpected_event_warnings}
                />
              ) : null}
            </div>
          ) : null}
        </Section>

        <Section title="Saúde da coleta">
          <p className="mb-4 text-sm text-slate-600">
            Checklist rápido do ciclo de vida da sessão exportada.
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
  const [mode, setMode] = useState<DashboardViewMode>('single');
  const [parsed, setParsed] = useState<ParsedDashboardReport | null>(null);
  const [groupSessions, setGroupSessions] = useState<ParsedDashboardReport[]>([]);
  const [groupLoadErrors, setGroupLoadErrors] = useState<{ fileName: string; message: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  const groupReport = useMemo(
    () => buildGroupTestReport(groupSessions, groupLoadErrors),
    [groupSessions, groupLoadErrors],
  );

  const handleSingleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const result = await parseReportFile(file);
      setParsed(result);
      setGroupSessions([]);
      setGroupLoadErrors([]);
      setFileLabel(file.name);
    } catch (err) {
      setParsed(null);
      setFileLabel(null);
      setError(
        err instanceof ReportParseError
          ? err.message
          : 'Não foi possível carregar o relatório.',
      );
    }
  };

  const handleGroupFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const result = await parseMultipleReportFiles([...files]);
    setGroupSessions(result.sessions);
    setGroupLoadErrors(result.loadErrors);
    setParsed(null);

    if (result.sessions.length === 0) {
      setFileLabel(null);
      setError(
        result.loadErrors.length > 0
          ? 'Nenhum JSON válido no lote. Verifique os arquivos selecionados.'
          : 'Selecione ao menos um arquivo JSON.',
      );
      return;
    }

    setFileLabel(
      result.sessions.length === 1
        ? result.sessions[0].sourceFileName ?? '1 sessão'
        : `${result.sessions.length} sessões`,
    );
  };

  const handleFileInput = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (mode === 'single') {
      void handleSingleFile(files[0] ?? null);
      return;
    }
    void handleGroupFiles(files);
  };

  const switchMode = (next: DashboardViewMode) => {
    setMode(next);
    setError(null);
    setParsed(null);
    setGroupSessions([]);
    setGroupLoadErrors([]);
    setFileLabel(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const hasContent = mode === 'single' ? parsed !== null : groupSessions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <header className="border-b border-[#80298F]/20 bg-gradient-to-r from-[#80298F] to-[#9B4DAB] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              LD Insights
            </p>
            <h1 className="text-2xl font-bold">Dashboard do Livro Digital</h1>
            {hasContent ? (
              <p className="mt-1 text-sm text-white/90">
                {mode === 'group' ? (
                  <>
                    Grupo de teste · {groupReport.bookId} · {groupReport.chapterId} ·{' '}
                    {groupReport.sessionCount} sessão
                    {groupReport.sessionCount === 1 ? '' : 'ões'}
                  </>
                ) : (
                  <>
                    {parsed!.report.book_id} · {parsed!.report.chapter_id}
                    {parsed!.report.exported_at
                      ? ` · ${formatExportedAt(parsed!.report.exported_at)}`
                      : ''}
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/90">
                {mode === 'group'
                  ? 'Carregue vários JSONs para o relatório do grupo de teste'
                  : 'Carregue um relatório JSON exportado pelo piloto'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-white/30 p-0.5">
              <button
                type="button"
                onClick={() => switchMode('single')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  mode === 'single' ? 'bg-white text-[#80298F]' : 'text-white hover:bg-white/10'
                }`}
              >
                1 sessão
              </button>
              <button
                type="button"
                onClick={() => switchMode('group')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  mode === 'group' ? 'bg-white text-[#80298F]' : 'text-white hover:bg-white/10'
                }`}
              >
                Grupo de teste
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              multiple={mode === 'group'}
              className="hidden"
              onChange={(e) => handleFileInput(e.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow transition hover:bg-[#F9DDFF]"
            >
              {fileLabel
                ? mode === 'group'
                  ? 'Trocar lote'
                  : 'Trocar JSON'
                : mode === 'group'
                  ? 'Carregar JSONs do grupo'
                  : 'Carregar relatório JSON'}
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

        {!hasContent && !error ? (
          <div className="rounded-2xl border-2 border-dashed border-[#80298F]/30 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-800">
              {mode === 'group' ? 'Nenhum lote carregado' : 'Nenhum relatório carregado'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {mode === 'group' ? (
                <>
                  Exporte um JSON por participante no piloto e selecione todos os arquivos de uma
                  vez para gerar o relatório consolidado da turma.
                </>
              ) : (
                <>
                  Exporte os eventos no piloto (botão &quot;Exportar eventos JSON&quot;) e carregue o
                  arquivo aqui para visualizar indicadores de uso, leitura e feedback.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-full bg-[#80298F] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6b2278]"
            >
              {mode === 'group' ? 'Selecionar JSONs (.json)' : 'Selecionar arquivo .json'}
            </button>
          </div>
        ) : null}

        {mode === 'single' && parsed ? <DashboardContent parsed={parsed} /> : null}
        {mode === 'group' && groupSessions.length > 0 ? (
          <GroupReportContent report={groupReport} />
        ) : null}
      </main>
    </div>
  );
}

export default DashboardPage;
