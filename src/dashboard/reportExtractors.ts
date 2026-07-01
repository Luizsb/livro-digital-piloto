import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import type { AnalyticsEvent } from '../analytics/eventTypes';
import type { EventSummary } from '../analytics/eventSummary';
import {
  getActiveChapterPageConfig,
  listChapterPageNumbers,
  resolveChapterPageBounds,
} from '../analytics/chapterPageConfig';
import { getReadingDepthLabel, type ReadingDepth } from '../analytics/readingQuality';
import { formatDateTimeBr } from '../lib/formatDateTimeBr';
import { formatLoadTimeMs } from '../lib/formatDuration';
import { formatBytes } from '../lib/formatBytes';
import { getLoadTimeRating } from '../lib/loadTimeRating';
import type { PageJourneyItem } from './types';

export { formatLoadTimeMs, formatBytes, getLoadTimeRating };

const FINISH_EVENTS_FOR_DEPTH = [
  ANALYTICS_EVENT_NAMES.sessionFinished,
  ANALYTICS_EVENT_NAMES.chapterFinished,
  ANALYTICS_EVENT_NAMES.chapterCompleted,
] as const;

function findLastEvent(
  events: AnalyticsEvent[],
  eventName: string,
): AnalyticsEvent | undefined {
  return [...events].reverse().find((event) => event.event_name === eventName);
}

function findFirstEvent(
  events: AnalyticsEvent[],
  eventName: string,
): AnalyticsEvent | undefined {
  return events.find((event) => event.event_name === eventName);
}

export function extractReadingDepth(
  summary: EventSummary,
  events: AnalyticsEvent[],
): { depth?: string; label?: string } {
  if (summary.reading_depth_label) {
    return { depth: summary.reading_depth, label: summary.reading_depth_label };
  }

  for (const eventName of FINISH_EVENTS_FOR_DEPTH) {
    const event = findLastEvent(events, eventName);
    if (!event) continue;

    const depth = event.metadata?.reading_depth;
    const label = event.metadata?.reading_depth_label;
    if (typeof label === 'string') {
      return {
        depth: typeof depth === 'string' ? depth : undefined,
        label,
      };
    }
    if (typeof depth === 'string') {
      return { depth, label: getReadingDepthLabel(depth as ReadingDepth) };
    }
  }

  return {};
}

export function extractSessionDurationSeconds(events: AnalyticsEvent[]): number | null {
  const sessionFinished = findLastEvent(events, ANALYTICS_EVENT_NAMES.sessionFinished);
  const duration = sessionFinished?.metadata?.duration_seconds;
  if (typeof duration === 'number' && duration > 0) {
    return duration;
  }

  const started = findFirstEvent(events, ANALYTICS_EVENT_NAMES.sessionStarted);
  const end =
    sessionFinished ??
    findLastEvent(events, ANALYTICS_EVENT_NAMES.chapterFinished) ??
    findLastEvent(events, ANALYTICS_EVENT_NAMES.chapterCompleted);

  if (started && end) {
    const startMs = Date.parse(started.timestamp);
    const endMs = Date.parse(end.timestamp);
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
      const seconds = Math.max(0, Math.round((endMs - startMs) / 1000));
      if (seconds > 0) return seconds;
    }
  }

  if (events.length >= 2) {
    const sorted = [...events].sort(
      (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
    );
    const startMs = Date.parse(sorted[0].timestamp);
    const endMs = Date.parse(sorted[sorted.length - 1].timestamp);
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
      const seconds = Math.max(0, Math.round((endMs - startMs) / 1000));
      if (seconds > 0) return seconds;
    }
  }

  return typeof duration === 'number' ? duration : null;
}

export function enrichSummaryReadingMetrics(
  summary: EventSummary,
  events: AnalyticsEvent[],
): EventSummary {
  const { depth, label } = extractReadingDepth(summary, events);
  if (!label) return summary;
  return {
    ...summary,
    reading_depth: depth ?? summary.reading_depth,
    reading_depth_label: label,
  };
}

export function getChapterPageNumbers(
  summary?: Pick<
    EventSummary,
    | 'book_id'
    | 'chapter_id'
    | 'pages_viewed'
    | 'chapter_first_page'
    | 'chapter_last_page'
    | 'chapter_total_pages'
    | 'chapter_default_page'
  >,
): number[] {
  const bounds = summary
    ? resolveChapterPageBounds(summary)
    : getActiveChapterPageConfig();
  return listChapterPageNumbers(bounds);
}

export function extractZoomedImageIds(events: AnalyticsEvent[]): string[] {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.event_name !== ANALYTICS_EVENT_NAMES.imageZoomed) continue;
    const imageId = event.metadata?.image_id;
    if (typeof imageId === 'string') ids.add(imageId);
  }
  return [...ids].sort();
}

export function buildPageJourney(summary: EventSummary): PageJourneyItem[] {
  const viewed = new Set(summary.pages_viewed);
  const completed = new Set(summary.pages_completed);

  return getChapterPageNumbers(summary).map((page) => {
    if (completed.has(page)) return { page, status: 'completed' as const };
    if (viewed.has(page)) return { page, status: 'viewed' as const };
    return { page, status: 'not_viewed' as const };
  });
}

export const PAGE_JOURNEY_LABELS = {
  completed: {
    emoji: '✅',
    legend: 'Concluída',
  },
  viewed: {
    emoji: '👁️',
    legend: 'Apenas visualizada',
  },
  not_viewed: {
    emoji: '⚪',
    legend: 'Não visualizada',
  },
} as const;

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes}min ${rest}s` : `${minutes}min`;
}

export function formatExportedAt(iso: string): string {
  return formatDateTimeBr(iso);
}

export function getParticipantLabel(summary: EventSummary): string {
  return summary.participant_ids[0] ?? '—';
}

export type ChapterStatusLabel =
  | 'Capítulo concluído'
  | 'Finalizado parcialmente'
  | 'Em andamento'
  | 'Não finalizado';

export function getChapterStatusLabel(summary: EventSummary): ChapterStatusLabel {
  if (summary.chapter_completed_count > 0) return 'Capítulo concluído';
  if (summary.chapter_finished_count > 0) return 'Finalizado parcialmente';
  if (summary.pages_viewed_count > 0) return 'Em andamento';
  return 'Não finalizado';
}

export function getChapterStatusBadgeClass(label: ChapterStatusLabel): string {
  switch (label) {
    case 'Capítulo concluído':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'Finalizado parcialmente':
      return 'border-[#80298F]/25 bg-[#F9DDFF] text-[#6b2278]';
    case 'Em andamento':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'Não finalizado':
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

export function formatWouldUseAgain(value: string | undefined): string {
  if (!value) return '—';
  const map: Record<string, string> = {
    sim: 'Sim',
    nao: 'Não',
    talvez: 'Talvez',
  };
  return map[value] ?? value;
}
