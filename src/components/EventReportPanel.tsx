import { useMemo, useState, type ReactNode } from 'react';
import type { AnalyticsEvent } from '../analytics/eventTypes';
import {
  buildContentInteractionsSummary,
  type ContentInteractionsSummary,
} from '../analytics/contentInteractionsSummary';
import { buildFeedbackSummary, type FeedbackSummary } from '../analytics/feedbackSummary';
import {
  buildReadingJourneySummary,
  type ReadingJourneySummary,
} from '../analytics/readingJourneySummary';
import { sortAnalyticsEventsNewestFirst } from '../analytics/sortAnalyticsEvents';
import {
  EVENT_CATALOG,
  buildEventBadges,
  formatMetadataForDisplay,
  getActiveEventCatalog,
  getEventDisplayInfo,
  type EventBadge,
} from '../analytics/eventLabels';
import { getEventVisualStyle, getEventVisualStyleByBadgeKey } from '../analytics/eventVisualStyle';
import { formatDateTimeBr } from '../lib/formatDateTimeBr';

interface EventReportPanelProps {
  events: AnalyticsEvent[];
  onClose: () => void;
}

function buildCompactSummaryLine(
  journey: ReadingJourneySummary,
  content: ContentInteractionsSummary,
  feedback: FeedbackSummary,
): string {
  const parts: string[] = [];

  if (journey.pages_viewed_count > 0) {
    parts.push(`Págs. ${journey.pages_viewed_count} (${journey.completion_rate}% concl.)`);
  }
  if (content.images_viewed_count > 0) {
    parts.push(`Img. ${content.images_viewed_count}`);
  }
  if (content.escola_digital_opened_count > 0) {
    parts.push(`Escola Digital ${content.escola_digital_opened_count}×`);
  }
  if (content.escola_digital_video_play_count > 0) {
    parts.push(
      `Vídeo ${content.escola_digital_video_max_progress_percent}%${
        content.escola_digital_video_watched_to_end ? ' · fim' : ''
      }`,
    );
  }
  if (content.oda_opened_count > 0) {
    parts.push(`ODA ${content.oda_opened_count}×`);
  }
  if (feedback.submitted) {
    parts.push(`Feedback ${feedback.rating}/5`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sem métricas consolidadas ainda.';
}

function SummaryToggleButton({
  expanded,
  onClick,
  children,
}: {
  expanded: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 py-1 text-left text-xs font-semibold text-[#80298F] hover:underline"
      aria-expanded={expanded}
    >
      <span>{children}</span>
      <span className="shrink-0 text-slate-400" aria-hidden>
        {expanded ? '▾' : '▸'}
      </span>
    </button>
  );
}

function CollectionSummary({
  journey,
  content,
  feedback,
  eventBadges,
}: {
  journey: ReadingJourneySummary;
  content: ContentInteractionsSummary;
  feedback: FeedbackSummary;
  eventBadges: EventBadge[];
}) {
  const hasJourney = journey.pages_viewed_count > 0 || journey.pages_completed_count > 0;
  const hasImages = content.images_viewed_count > 0 || content.image_zoom_total > 0;
  const hasResources =
    content.resources_opened_total > 0 ||
    content.oda_opened_count > 0 ||
    content.escola_digital_opened_count > 0;

  return (
    <div className="space-y-0 divide-y divide-slate-100">
      {hasJourney ? (
        <div className="bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">Jornada de leitura</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <dt className="text-slate-500">Páginas visualizadas</dt>
              <dd className="font-semibold text-[#80298F]">
                {journey.pages_viewed_count}
                {journey.pages_viewed.length > 0 ? ` (${journey.pages_viewed.join(', ')})` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Páginas concluídas</dt>
              <dd className="font-semibold text-[#80298F]">
                {journey.pages_completed_count}
                {journey.pages_completed.length > 0
                  ? ` (${journey.pages_completed.join(', ')})`
                  : ''}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Taxa de conclusão</dt>
              <dd className="font-semibold text-[#80298F]">{journey.completion_rate}%</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {hasImages ? (
        <div className="bg-white px-4 py-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">Imagens no capítulo</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <dt className="text-slate-500">Imagens expostas</dt>
              <dd className="font-semibold text-[#80298F]">{content.images_viewed_count}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Imagens com interação (zoom)</dt>
              <dd className="font-semibold text-[#80298F]">
                {content.image_zoom_unique_count} · {content.image_zoom_total} zoom(s)
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {hasResources ? (
        <div className="bg-white px-4 py-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">Recursos digitais</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <dt className="text-slate-500">ODA aberto</dt>
              <dd className="font-semibold text-[#80298F]">
                {content.oda_opened_count}× · {content.oda_engagement_total_seconds}s no total
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Escola Digital aberta</dt>
              <dd className="font-semibold text-[#80298F]">
                {content.escola_digital_opened_count}× ·{' '}
                {content.escola_digital_engagement_total_seconds}s no modal
              </dd>
            </div>
            {content.escola_digital_video_play_count > 0 ||
            content.escola_digital_video_max_progress_percent > 0 ? (
              <div className="col-span-2">
                <dt className="text-slate-500">Vídeo Escola Digital</dt>
                <dd className="font-semibold text-[#80298F]">
                  Play: {content.escola_digital_video_play_count}× · até o fim:{' '}
                  {content.escola_digital_video_watched_to_end ? 'sim' : 'não'} · progresso máx.:{' '}
                  {content.escola_digital_video_max_progress_percent}%
                </dd>
              </div>
            ) : null}
            <div className="col-span-2">
              <dt className="text-slate-500">Outros recursos (externos / QR)</dt>
              <dd className="font-semibold text-[#80298F]">
                {content.other_resources_opened_total} abertura(s) ·{' '}
                {content.other_resources_opened_unique_count} id(s) único(s)
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {feedback.submitted ? (
        <div className="bg-[#F9DDFF]/40 px-4 py-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">Feedback do participante</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <dt className="text-slate-500">Avaliação geral</dt>
              <dd className="font-semibold text-[#80298F]">{feedback.rating}/5</dd>
            </div>
            <div>
              <dt className="text-slate-500">Usaria novamente</dt>
              <dd className="font-semibold capitalize text-[#80298F]">{feedback.would_use_again}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Navegação</dt>
              <dd className="font-semibold text-[#80298F]">{feedback.navigation_clarity}/5</dd>
            </div>
            <div>
              <dt className="text-slate-500">Conforto visual</dt>
              <dd className="font-semibold text-[#80298F]">{feedback.visual_comfort}/5</dd>
            </div>
            <div>
              <dt className="text-slate-500">Recursos digitais</dt>
              <dd className="font-semibold text-[#80298F]">{feedback.resource_usefulness}/5</dd>
            </div>
            {feedback.comment ? (
              <div className="col-span-2">
                <dt className="text-slate-500">Comentário</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-800">
                  {feedback.comment}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {eventBadges.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {eventBadges.map((badge) => {
            const style = getEventVisualStyleByBadgeKey(badge.key);
            return (
              <span
                key={badge.key}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badgeClass}`}
                title={badge.description}
              >
                <span aria-hidden="true">{style.icon}</span>
                {badge.label}: {badge.count}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function EventReportPanel({ events, onClose }: EventReportPanelProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const journey = useMemo(() => buildReadingJourneySummary(events), [events]);
  const content = useMemo(() => buildContentInteractionsSummary(events), [events]);
  const feedback = useMemo(() => buildFeedbackSummary(events), [events]);
  const sortedEvents = useMemo(() => sortAnalyticsEventsNewestFirst(events), [events]);
  const eventBadges = useMemo(() => buildEventBadges(events), [events]);
  const activeCatalog = useMemo(() => getActiveEventCatalog(), []);
  const compactSummary = useMemo(
    () => buildCompactSummaryLine(journey, content, feedback),
    [journey, content, feedback],
  );

  const hasSummaryContent =
    journey.pages_viewed_count > 0 ||
    journey.pages_completed_count > 0 ||
    content.images_viewed_count > 0 ||
    content.image_zoom_total > 0 ||
    content.resources_opened_total > 0 ||
    content.oda_opened_count > 0 ||
    content.escola_digital_opened_count > 0 ||
    feedback.submitted ||
    eventBadges.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Fechar painel de eventos"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md min-h-0 flex-col bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="events-panel-title"
      >
        <header className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 id="events-panel-title" className="text-base font-semibold text-slate-900">
              Eventos em tempo real
            </h2>
            <p className="text-xs text-slate-500">
              {events.length} evento(s) coletado(s)
              {import.meta.env.DEV ? ' · dados zerados a cada reinício do servidor' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Fechar
          </button>
        </header>

        <div className="shrink-0 border-b border-slate-100 px-4 py-2">
          <button
            type="button"
            onClick={() => setShowCatalog((open) => !open)}
            className="text-xs font-semibold text-[#80298F] hover:underline"
          >
            {showCatalog ? 'Ocultar catálogo' : 'O que está sendo coletado?'}
          </button>
          {showCatalog ? (
            <ul className="mt-2 max-h-32 space-y-2 overflow-y-auto text-xs text-slate-600">
              {activeCatalog.map((entry) => (
                <li key={entry.label}>
                  <span className="font-semibold text-slate-800">{entry.label}</span>
                  <span className="text-slate-500"> — {entry.description}</span>
                </li>
              ))}
              <li className="pt-1 text-slate-400">
                Em breve:{' '}
                {Object.entries(EVENT_CATALOG)
                  .filter(([, entry]) => !entry.active)
                  .map(([, entry]) => entry.label)
                  .join(', ')}
                .
              </li>
            </ul>
          ) : null}
        </div>

        {hasSummaryContent ? (
          <div className="shrink-0 border-b border-slate-100">
            <div className="px-4 py-2">
              <SummaryToggleButton
                expanded={summaryExpanded}
                onClick={() => setSummaryExpanded((open) => !open)}
              >
                {summaryExpanded ? 'Minimizar resumo' : 'Expandir resumo da coleta'}
              </SummaryToggleButton>
              {!summaryExpanded ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{compactSummary}</p>
              ) : null}
            </div>
            {summaryExpanded ? (
              <div className="max-h-[38vh] overflow-y-auto border-t border-slate-100">
                <CollectionSummary
                  journey={journey}
                  content={content}
                  feedback={feedback}
                  eventBadges={eventBadges}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-100 px-4 py-2">
            <p className="text-xs font-semibold text-slate-800">
              Log de eventos ({sortedEvents.length})
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {sortedEvents.length === 0 ? (
              <li className="py-8 text-center text-sm text-slate-500">
                Nenhum evento registrado ainda. Interaja com o livro para ver a coleta aqui.
              </li>
            ) : (
              sortedEvents.map((event) => {
                const meta = formatMetadataForDisplay(event.metadata);
                const display = getEventDisplayInfo(event);
                const style = getEventVisualStyle(event);
                return (
                  <li
                    key={event.event_id}
                    className={`mb-3 rounded-lg border border-slate-200 border-l-4 px-3 py-2 text-sm ${style.borderClass} ${style.bgClass}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 gap-2">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold leading-none ${style.iconWrapClass}`}
                          aria-hidden="true"
                        >
                          {style.icon}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-semibold ${style.titleClass}`}>
                            {display.label}
                          </span>
                          {display.description ? (
                            <p className="mt-0.5 text-xs text-slate-500">{display.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <time className="shrink-0 text-right text-[10px] leading-tight text-slate-500 sm:text-xs" dateTime={event.timestamp}>
                        {formatDateTimeBr(event.timestamp)}
                      </time>
                    </div>
                    {meta ? <p className="mt-1 pl-9 text-xs text-slate-600">{meta}</p> : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default EventReportPanel;
