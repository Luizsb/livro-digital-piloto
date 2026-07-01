import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import type { AnalyticsEvent } from '../analytics/eventTypes';
import type { EventSummary } from '../analytics/eventSummary';
import {
  getActiveChapterPageConfig,
  listChapterPageNumbers,
  resolveChapterPageBounds,
} from '../analytics/chapterPageConfig';
import { formatDateTimeBr } from '../lib/formatDateTimeBr';
import type { PageJourneyItem } from './types';

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
export function extractSessionDurationSeconds(events: AnalyticsEvent[]): number | null {
  const finished = [...events]
    .reverse()
    .find((event) => event.event_name === ANALYTICS_EVENT_NAMES.sessionFinished);

  const duration = finished?.metadata?.duration_seconds;
  return typeof duration === 'number' ? duration : null;
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
