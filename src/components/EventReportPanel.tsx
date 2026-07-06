import { useMemo, useState, type ReactNode } from 'react';
import type { AnalyticsEvent } from '../ld/sessionTypes';
import {
  buildContentInteractionsSummary,
  type ContentInteractionsSummary,
} from '../ld/contentInteractionsSummary';
import { buildFeedbackSummary, type FeedbackSummary } from '../ld/feedbackSummary';
import { loadFeedbackComments } from '../ld/feedbackComments';
import {
  buildReadingJourneySummary,
  type ReadingJourneySummary,
} from '../ld/readingJourneySummary';
import { sortAnalyticsEventsNewestFirst } from '../ld/sortAnalyticsEvents';
import {
  EVENT_CATALOG,
  buildEventBadges,
  formatMetadataForDisplay,
  getActiveEventCatalog,
  getEventDisplayInfo,
  type EventBadge,
} from '../ld/sessionLabels';
import { getEventVisualStyle, getEventVisualStyleByBadgeKey } from '../ld/sessionVisualStyle';
import { useLiveSessionDuration, useIsSessionTimerPaused } from '../ld/useLiveSessionDuration';
import { getSessionStatus } from '../ld/sessionStatus';
import { formatDurationClock } from '../lib/formatDuration';
import { formatDateTimeBr } from '../lib/formatDateTimeBr';
import {
  MODAL_TIME_LABEL,
  PAGE_COMPLETION_RATE_LABEL,
  VIDEO_COMPLETED_LABEL,
  VIDEO_MAX_PROGRESS_LABEL,
  VIDEO_WATCH_TIME_LABEL,
} from '../ld/metricDisplayLabels';
import { ClosePillButton } from './ClosePillButton';

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
    parts.push(`Págs. ${journey.pages_viewed_count} (${PAGE_COMPLETION_RATE_LABEL.toLowerCase()}: ${journey.completion_rate}%)`);
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

type PanelSection = 'catalog' | 'summary' | 'events';

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-[#80298F] transition-transform duration-200 ${
        expanded ? 'rotate-180' : ''
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CatalogSectionIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path strokeLinecap="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}

function SummarySectionIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V11M12 17V7M16 17v-4" />
    </svg>
  );
}

function LogSectionIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function AccordionSection({
  sectionId,
  title,
  hint,
  icon,
  expanded,
  onToggle,
  preview,
  children,
  flexContent,
}: {
  sectionId: PanelSection;
  title: string;
  hint?: ReactNode;
  icon: ReactNode;
  expanded: boolean;
  onToggle: (section: PanelSection) => void;
  preview?: ReactNode;
  children: ReactNode;
  flexContent?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden border-b-2 border-slate-200 ${
        flexContent && expanded ? 'flex min-h-0 flex-1 flex-col' : 'shrink-0'
      } ${expanded ? 'bg-white shadow-inner' : 'bg-slate-50'}`}
      data-section={sectionId}
    >
      <button
        type="button"
        onClick={() => onToggle(sectionId)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
          expanded
            ? 'border-b border-[#80298F]/20 bg-gradient-to-r from-[#F9DDFF]/50 to-white'
            : 'hover:bg-white'
        }`}
        aria-expanded={expanded}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            expanded ? 'bg-[#80298F] text-white shadow-sm' : 'bg-[#80298F]/12 text-[#80298F]'
          }`}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {hint && !expanded ? (
            <div className="mt-0.5">{hint}</div>
          ) : null}
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            expanded ? 'bg-[#80298F]/15' : 'bg-slate-200/80'
          }`}
        >
          <ChevronIcon expanded={expanded} />
        </span>
      </button>

      {!expanded && preview ? (
        <div className="border-t border-slate-100 bg-white px-4 py-2.5">{preview}</div>
      ) : null}

      {expanded ? (
        <div
          className={
            flexContent
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-100 bg-white'
              : 'max-h-[40vh] overflow-y-auto border-t border-slate-100 bg-white'
          }
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

function SummaryCollapsedHint({
  sessionSeconds,
  compactSummary,
}: {
  sessionSeconds: number | null;
  compactSummary: string;
}) {
  if (sessionSeconds === null) {
    return <p className="truncate text-xs text-slate-500">{compactSummary}</p>;
  }

  return (
    <p className="truncate text-xs text-slate-500">
      <span
        className="font-mono font-bold tabular-nums text-[#80298F]"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatDurationClock(sessionSeconds)}
      </span>
      {compactSummary ? (
        <>
          <span className="text-slate-400"> · </span>
          <span>{compactSummary}</span>
        </>
      ) : null}
    </p>
  );
}

function SessionDurationBanner({ seconds }: { seconds: number }) {
  const isFinished = getSessionStatus() === 'finished';
  const isPaused = useIsSessionTimerPaused();

  return (
    <div className="flex items-center gap-3 border-b border-[#80298F]/15 bg-gradient-to-r from-[#80298F]/8 via-[#F9DDFF]/40 to-white px-4 py-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#80298F] text-lg text-white shadow-sm"
        aria-hidden
      >
        ⏱
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Tempo na tela
        </p>
        <p
          className="font-mono text-2xl font-bold tabular-nums leading-tight text-[#80298F]"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatDurationClock(seconds)}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">
          {isFinished
            ? 'Sessão finalizada'
            : isPaused
              ? 'Pausado — volte a esta aba para continuar'
              : 'Contando enquanto a aba do livro está visível'}
        </p>
      </div>
      {!isFinished ? (
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          {isPaused ? (
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          ) : (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </>
          )}
        </span>
      ) : null}
    </div>
  );
}

function CollectionSummary({
  journey,
  content,
  feedback,
  eventBadges,
  sessionSeconds,
}: {
  journey: ReadingJourneySummary;
  content: ContentInteractionsSummary;
  feedback: FeedbackSummary;
  eventBadges: EventBadge[];
  sessionSeconds: number | null;
}) {
  const hasJourney = journey.pages_viewed_count > 0 || journey.pages_completed_count > 0;
  const hasImages = content.images_viewed_count > 0 || content.image_zoom_total > 0;
  const hasResources =
    content.resources_opened_total > 0 ||
    content.oda_opened_count > 0 ||
    content.escola_digital_opened_count > 0;

  return (
    <div className="space-y-0 divide-y divide-slate-100">
      {sessionSeconds !== null ? <SessionDurationBanner seconds={sessionSeconds} /> : null}

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
              <dt className="text-slate-500">{PAGE_COMPLETION_RATE_LABEL}</dt>
              <dd className="font-semibold text-[#80298F]">{journey.completion_rate}%</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {hasImages ? (
        <div className="bg-white px-4 py-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">Imagens no capítulo</p>
          <p className="mb-2 text-[10px] text-slate-500">
            Imagem exposta = presença na viewport; não representa atenção.
          </p>
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
                {content.oda_opened_count}× · {content.oda_engagement_total_seconds}s{' '}
                {MODAL_TIME_LABEL.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Escola Digital aberta</dt>
              <dd className="font-semibold text-[#80298F]">
                {content.escola_digital_opened_count}× ·{' '}
                {content.escola_digital_engagement_total_seconds}s{' '}
                {MODAL_TIME_LABEL.toLowerCase()}
              </dd>
            </div>
            {content.escola_digital_video_play_count > 0 ||
            content.escola_digital_video_max_progress_percent > 0 ||
            content.escola_digital_video_watch_total_seconds > 0 ? (
              <div className="col-span-2">
                <dt className="text-slate-500">Vídeo Escola Digital</dt>
                <dd className="font-semibold text-[#80298F]">
                  {content.escola_digital_video_watch_total_seconds > 0
                    ? `${VIDEO_WATCH_TIME_LABEL}: ${content.escola_digital_video_watch_total_seconds}s · `
                    : ''}
                  {content.escola_digital_video_max_progress_percent > 0
                    ? `${VIDEO_MAX_PROGRESS_LABEL}: ${content.escola_digital_video_max_progress_percent}% · `
                    : ''}
                  {VIDEO_COMPLETED_LABEL}:{' '}
                  {content.escola_digital_video_watched_to_end ? 'sim' : 'não'}
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
            {(() => {
              const comment = loadFeedbackComments()[loadFeedbackComments().length - 1]?.comment;
              return comment ? (
              <div className="col-span-2">
                <dt className="text-slate-500">Comentário</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-800">
                  {comment}
                </dd>
              </div>
              ) : null;
            })()}
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
  const [openSection, setOpenSection] = useState<PanelSection | null>('events');
  const sessionSeconds = useLiveSessionDuration();
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
    sessionSeconds !== null ||
    journey.pages_viewed_count > 0 ||
    journey.pages_completed_count > 0 ||
    content.images_viewed_count > 0 ||
    content.image_zoom_total > 0 ||
    content.resources_opened_total > 0 ||
    content.oda_opened_count > 0 ||
    content.escola_digital_opened_count > 0 ||
    feedback.submitted ||
    eventBadges.length > 0;

  const toggleSection = (section: PanelSection) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const summaryHint = (
    <SummaryCollapsedHint sessionSeconds={sessionSeconds} compactSummary={compactSummary} />
  );

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
          <ClosePillButton
            ariaLabel="Fechar painel de eventos"
            onClick={onClose}
          />
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-100/60">
          <AccordionSection
            sectionId="catalog"
            title="O que está sendo coletado?"
            hint={`${activeCatalog.length} tipos de evento ativos — role para ver todos`}
            icon={<CatalogSectionIcon />}
            expanded={openSection === 'catalog'}
            onToggle={toggleSection}
          >
            <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
              Lista completa do piloto atual (jornada, conteúdo, feedback, encerramento e saúde
              técnica). Métricas como TTFB e peso em bytes vêm na metadata de alguns eventos, não
              como linhas separadas.
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto px-4 py-3 text-xs text-slate-600">
              {activeCatalog.map((entry) => (
                <li key={entry.label}>
                  <span className="font-semibold text-slate-800">{entry.label}</span>
                  <span className="text-slate-500"> — {entry.description}</span>
                </li>
              ))}
              <li className="border-t border-slate-100 pt-2 text-slate-400">
                Em breve:{' '}
                {Object.entries(EVENT_CATALOG)
                  .filter(([, entry]) => !entry.active)
                  .map(([, entry]) => entry.label)
                  .join(', ')}
                .
              </li>
            </ul>
          </AccordionSection>

          {hasSummaryContent ? (
            <AccordionSection
              sectionId="summary"
              title="Resumo da coleta"
              hint={summaryHint}
              icon={<SummarySectionIcon />}
              expanded={openSection === 'summary'}
              onToggle={toggleSection}
            >
              <CollectionSummary
                journey={journey}
                content={content}
                feedback={feedback}
                eventBadges={eventBadges}
                sessionSeconds={sessionSeconds}
              />
            </AccordionSection>
          ) : null}

          <AccordionSection
            sectionId="events"
            title={`Log de eventos (${sortedEvents.length})`}
            hint={
              sortedEvents.length > 0
                ? 'Últimos eventos registrados nesta sessão'
                : 'Nenhum evento ainda'
            }
            icon={<LogSectionIcon />}
            expanded={openSection === 'events'}
            onToggle={toggleSection}
            flexContent
          >
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
                        <time
                          className="shrink-0 text-right text-[10px] leading-tight text-slate-500 sm:text-xs"
                          dateTime={event.timestamp}
                        >
                          {formatDateTimeBr(event.timestamp)}
                        </time>
                      </div>
                      {meta ? <p className="mt-1 pl-9 text-xs text-slate-600">{meta}</p> : null}
                    </li>
                  );
                })
              )}
            </ul>
          </AccordionSection>
        </div>
      </aside>
    </div>
  );
}

export default EventReportPanel;
