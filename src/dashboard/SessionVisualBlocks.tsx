import type { EventSummary } from '@analytics/sessionSummary';
import type { FeedbackCommentRecord } from '@analytics/feedbackComments';
import type { DeviceType } from '@analytics/deviceContext';
import {
  buildPageJourney,
  classifyChapterProgress,
  formatDuration,
  formatWouldUseAgain,
  getChapterProgressLabel,
  PAGE_JOURNEY_LABELS,
} from './reportExtractors';
import {
  MODAL_TIME_LABEL,
  VIDEO_COMPLETED_LABEL,
  VIDEO_MAX_PROGRESS_LABEL,
  VIDEO_WATCH_TIME_LABEL,
} from '@analytics/metricDisplayLabels';
import { DimensionScoreBars } from './groupCharts';

function ResourceCard({
  title,
  active,
  metrics,
}: {
  title: string;
  active: boolean;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? 'border-[#80298F]/25 bg-[#F9DDFF]/30'
          : 'border-slate-100 bg-slate-50/50 opacity-60'
      }`}
    >
      <h3 className={`font-semibold ${active ? 'text-[#80298F]' : 'text-slate-500'}`}>{title}</h3>
      {active ? (
        <dl className="mt-3 space-y-2 text-sm">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between gap-3">
              <dt className="text-slate-600">{metric.label}</dt>
              <dd className="shrink-0 font-semibold text-slate-800">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Não utilizado nesta sessão</p>
      )}
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

const PROGRESS_STYLES = {
  full_completion: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  viewed_all_incomplete: 'border-amber-200 bg-amber-50 text-amber-900',
  partial_view: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

const DEVICE_ICONS: Record<DeviceType, string> = {
  desktop: '🖥️',
  mobile: '📱',
  tablet: '📲',
};

export function SessionChapterProgressSection({
  summary,
  totalPages,
}: {
  summary: EventSummary;
  totalPages: number;
}) {
  const progress = classifyChapterProgress(
    summary.pages_viewed_count,
    summary.pages_completed_count,
    totalPages,
  );
  const incompletePages = summary.pages_viewed.filter(
    (page) => !summary.pages_completed.includes(page),
  );

  return (
    <Section
      title="Progresso no capítulo"
      subtitle="Com base em páginas visualizadas e tempo mínimo de permanência em cada uma."
    >
      <div
        className={`rounded-xl border px-4 py-4 text-center ${PROGRESS_STYLES[progress]}`}
      >
        <p className="text-lg font-bold">{getChapterProgressLabel(progress)}</p>
        <p className="mt-1 text-sm opacity-90">
          {summary.pages_completed_count}/{totalPages} páginas concluídas ·{' '}
          {summary.pages_viewed_count}/{totalPages} visualizadas · {summary.completion_rate}% de
          conclusão
        </p>
      </div>
      {progress === 'viewed_all_incomplete' && incompletePages.length > 0 ? (
        <p className="mt-4 text-sm text-amber-800">
          Páginas vistas sem tempo suficiente:{' '}
          <span className="font-semibold">{incompletePages.join(', ')}</span>
        </p>
      ) : null}
      {summary.reading_depth_label ? (
        <p className="mt-3 text-sm text-slate-600">
          Profundidade de leitura:{' '}
          <span className="font-semibold text-[#80298F]">{summary.reading_depth_label}</span>
        </p>
      ) : null}
    </Section>
  );
}

export function SessionPageJourneySection({ summary }: { summary: EventSummary }) {
  const pageJourney = buildPageJourney(summary);

  return (
    <Section
      title="Jornada por página"
      subtitle="Status de cada página nesta sessão — o que foi visualizado e o que atingiu o tempo mínimo."
    >
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
              aria-label={`Página ${item.page}: ${statusLabel.legend}`}
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
      {summary.abandonment_page != null ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
          Último ponto de parada antes de encerrar:{' '}
          <span className="font-semibold">pág. {summary.abandonment_page}</span>
        </p>
      ) : null}
    </Section>
  );
}

export function SessionDeviceSection({ summary }: { summary: EventSummary }) {
  if (!summary.device_type_label && !summary.device_type) return null;

  const deviceType = summary.device_type as DeviceType | undefined;
  const icon =
    deviceType && deviceType in DEVICE_ICONS ? DEVICE_ICONS[deviceType] : '💻';

  return (
    <Section
      title="Ambiente de acesso"
      subtitle="Dispositivo e navegador registrados no início desta sessão."
    >
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-[#80298F]/25 bg-[#F9DDFF]/30 p-5">
        <span className="text-4xl" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="text-lg font-bold text-slate-900">{summary.device_type_label ?? '—'}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {[summary.os_name, summary.browser_name, summary.browser_version]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <dt className="text-slate-500">Sistema operacional</dt>
          <dd className="mt-1 font-semibold text-[#80298F]">{summary.os_name ?? '—'}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <dt className="text-slate-500">Navegador</dt>
          <dd className="mt-1 font-semibold text-[#80298F]">
            {summary.browser_name ?? '—'}
            {summary.browser_version ? ` ${summary.browser_version}` : ''}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <dt className="text-slate-500">Resolução da tela</dt>
          <dd className="mt-1 font-semibold text-[#80298F]">
            {summary.screen_width && summary.screen_height
              ? `${summary.screen_width}×${summary.screen_height}`
              : '—'}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <dt className="text-slate-500">Janela do navegador</dt>
          <dd className="mt-1 font-semibold text-[#80298F]">
            {summary.viewport_width && summary.viewport_height
              ? `${summary.viewport_width}×${summary.viewport_height}`
              : '—'}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <dt className="text-slate-500">Tela touch</dt>
          <dd className="mt-1 font-semibold text-[#80298F]">
            {summary.is_touch_device ? 'Sim' : 'Não'}
          </dd>
        </div>
      </dl>
    </Section>
  );
}

export function SessionEngagementSection({ summary }: { summary: EventSummary }) {
  const hasEscola =
    summary.escola_digital_opened_count > 0 || summary.escola_digital_video_play_count > 0;
  const hasOda = summary.oda_opened_count > 0 || summary.oda_engagement_total_seconds > 0;
  const hasTeacher =
    summary.teacher_button_opened_count > 0 || summary.teacher_button_total_seconds > 0;
  const hasZoom = summary.image_zoom_total > 0;

  const escolaMetrics: Array<{ label: string; value: string }> = [];
  if (summary.escola_digital_opened_count > 0) {
    escolaMetrics.push({
      label: 'Aberturas do modal',
      value: `${summary.escola_digital_opened_count}×`,
    });
  }
  if (summary.escola_digital_engagement_total_seconds > 0) {
    escolaMetrics.push({
      label: MODAL_TIME_LABEL,
      value: formatDuration(summary.escola_digital_engagement_total_seconds),
    });
  }
  if (summary.escola_digital_video_play_count > 0) {
    if (summary.escola_digital_video_watch_total_seconds > 0) {
      escolaMetrics.push({
        label: VIDEO_WATCH_TIME_LABEL,
        value: formatDuration(summary.escola_digital_video_watch_total_seconds),
      });
    }
    if (summary.escola_digital_video_max_progress_percent > 0) {
      escolaMetrics.push({
        label: VIDEO_MAX_PROGRESS_LABEL,
        value: `${summary.escola_digital_video_max_progress_percent}%`,
      });
    }
    escolaMetrics.push({
      label: VIDEO_COMPLETED_LABEL,
      value: summary.escola_digital_video_watched_to_end
        ? `Sim${summary.escola_digital_video_completed_count > 0 ? ` (${summary.escola_digital_video_completed_count}×)` : ''}`
        : 'Não',
    });
  }

  const odaMetrics: Array<{ label: string; value: string }> = [];
  if (summary.oda_opened_count > 0) {
    odaMetrics.push({
      label: 'Aberturas',
      value: `${summary.oda_opened_count}×`,
    });
  }
  if (summary.oda_engagement_total_seconds > 0) {
    odaMetrics.push({
      label: MODAL_TIME_LABEL,
      value: formatDuration(summary.oda_engagement_total_seconds),
    });
  }

  const teacherMetrics: Array<{ label: string; value: string }> = [];
  if (summary.teacher_button_opened_count > 0) {
    teacherMetrics.push({
      label: 'Aberturas',
      value: `${summary.teacher_button_opened_count}×`,
    });
  }
  if (summary.teacher_button_unique_count > 0) {
    teacherMetrics.push({
      label: 'Seções diferentes',
      value: String(summary.teacher_button_unique_count),
    });
  }
  if (summary.teacher_button_total_seconds > 0) {
    teacherMetrics.push({
      label: 'Tempo total aberto',
      value: formatDuration(summary.teacher_button_total_seconds),
    });
  }

  return (
    <Section
      title="Engajamento com recursos"
      subtitle="Aberturas e tempo de permanência em cada recurso digital — métricas combinadas da sessão."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ResourceCard title="Escola Digital" active={hasEscola} metrics={escolaMetrics} />
        <ResourceCard title="ODA" active={hasOda} metrics={odaMetrics} />
        <ResourceCard title="Botão do professor" active={hasTeacher} metrics={teacherMetrics} />
        <ResourceCard
          title="Zoom em imagens"
          active={hasZoom}
          metrics={
            hasZoom
              ? [
                  { label: 'Total de zooms', value: String(summary.image_zoom_total) },
                  {
                    label: 'Imagens ampliadas',
                    value: String(summary.image_zoom_unique_count),
                  },
                ]
              : []
          }
        />
      </div>
    </Section>
  );
}

export function SessionFeedbackVisualSection({
  summary,
  feedbackComments,
}: {
  summary: EventSummary;
  feedbackComments: FeedbackCommentRecord[];
}) {
  const commentText = feedbackComments[0]?.comment?.trim();

  if (!summary.feedback.submitted && !commentText) {
    return (
      <Section title="Feedback">
        <p className="text-sm text-slate-500">Nenhum feedback enviado nesta sessão.</p>
      </Section>
    );
  }

  return (
    <Section title="Feedback do participante">
      {summary.feedback.submitted ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Nota geral</p>
            <p className="mt-1 text-4xl font-bold text-[#80298F]">
              {summary.feedback.rating}
              <span className="text-lg font-normal text-slate-400">/5</span>
            </p>
            {summary.feedback.would_use_again ? (
              <p className="mt-3 text-sm text-slate-600">
                Usaria novamente:{' '}
                <span className="font-semibold text-[#80298F]">
                  {formatWouldUseAgain(summary.feedback.would_use_again)}
                </span>
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Dimensões</h3>
            <DimensionScoreBars
              dimensions={[
                {
                  label: 'Clareza da navegação',
                  value: summary.feedback.navigation_clarity,
                },
                { label: 'Conforto visual', value: summary.feedback.visual_comfort },
                {
                  label: 'Utilidade dos recursos',
                  value: summary.feedback.resource_usefulness,
                },
              ]}
            />
          </div>
        </div>
      ) : null}
      {commentText ? (
        <div className={summary.feedback.submitted ? 'mt-8 border-t border-slate-100 pt-6' : ''}>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Comentário escrito</h3>
          <p className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
            {commentText}
          </p>
        </div>
      ) : null}
    </Section>
  );
}
