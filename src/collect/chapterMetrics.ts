import { ANALYTICS_CONFIG } from './ldConfig';
import {
  getChapterPageConfig,
  getChapterTotalPages,
  getMinCompletionRateForChapter,
} from '@book/chapter/chapterPageConfig';
import { ANALYTICS_EVENT_NAMES, BOOK_PILOT } from './sessionTypes';
import { loadStoredEvents } from './sessionStore';
import {
  computeReadingQuality,
  getReadingDepthLabel,
  type ReadingDepth,
} from './readingQuality';
import { getSessionStartedAt } from './sessionDedup';
import { buildSessionJourneyMetrics } from './sessionJourneyMetrics';
import { getLastActivePage } from './pageReadingState';

export type ChapterCompletionStatus =
  | 'completed'
  | 'partial'
  | 'quick_finished'
  | 'abandoned';

export type FinishSource = 'finish_button' | 'page_unload';

export interface ChapterMetrics {
  pages_viewed_count: number;
  pages_completed_count: number;
  total_pages: number;
  completion_rate: number;
  last_page_viewed: number | null;
  abandoned_before_end: boolean;
  abandonment_page: number | null;
  reading_depth: ReadingDepth;
  reading_depth_label: string;
  completion_status: ChapterCompletionStatus;
}

function getSessionEvents(sessionId: string) {
  return loadStoredEvents().filter((event) => event.session_id === sessionId);
}

function collectPageSets(events: ReturnType<typeof getSessionEvents>) {
  const pagesViewed = new Set<number>();
  const pagesCompleted = new Set<number>();

  for (const event of events) {
    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageViewed && typeof meta.page === 'number') {
      pagesViewed.add(meta.page);
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.pageCompleted &&
      typeof meta.page === 'number'
    ) {
      pagesCompleted.add(meta.page);
    }
  }

  return { pagesViewed, pagesCompleted };
}

export function computeChapterCompletionStatus(
  pagesViewedCount: number,
  completionRate: number,
  totalPages: number,
  readingDepth: ReadingDepth,
  minCompletionRate: number = ANALYTICS_CONFIG.chapter.minCompletionRateForChapterCompleted,
): ChapterCompletionStatus {
  if (pagesViewedCount < totalPages) return 'abandoned';
  if (completionRate >= minCompletionRate) return 'completed';
  if (readingDepth === 'very_quick' || readingDepth === 'quick_scan') {
    return 'quick_finished';
  }
  return 'partial';
}

export function meetsChapterCompletedCriteria(
  metrics: ChapterMetrics,
  sessionId: string,
): boolean {
  const { bookId, chapterId } = resolveBookChapterIds(sessionId);
  const minRate = getMinCompletionRateForChapter(bookId, chapterId);
  return (
    metrics.pages_viewed_count === metrics.total_pages &&
    metrics.completion_rate >= minRate
  );
}

function resolveBookChapterIds(sessionId: string): { bookId: string; chapterId: string } {
  const events = getSessionEvents(sessionId);
  const first = events[0];
  return {
    bookId: first?.book_id ?? BOOK_PILOT.book_id,
    chapterId: first?.chapter_id ?? BOOK_PILOT.chapter_id,
  };
}

export function buildChapterMetrics(sessionId: string): ChapterMetrics {
  const { bookId, chapterId } = resolveBookChapterIds(sessionId);
  const pageConfig = getChapterPageConfig(bookId, chapterId);
  const total_pages = getChapterTotalPages(pageConfig);
  const minCompletionRate = getMinCompletionRateForChapter(bookId, chapterId);

  const events = getSessionEvents(sessionId);
  const { pagesViewed, pagesCompleted } = collectPageSets(events);

  const pages_viewed_count = pagesViewed.size;
  const pages_completed_count = pagesCompleted.size;
  const completion_rate =
    pages_viewed_count > 0
      ? Math.round((pages_completed_count / pages_viewed_count) * 100)
      : 0;

  const journey = buildSessionJourneyMetrics(events, total_pages, {
    lastActivePage: getLastActivePage(),
  });

  const startedAt = getSessionStartedAt();
  const duration_seconds = startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
    : 0;

  const readingQuality = computeReadingQuality(
    events,
    duration_seconds,
    pages_viewed_count,
  );

  const completion_status = computeChapterCompletionStatus(
    pages_viewed_count,
    completion_rate,
    total_pages,
    readingQuality.reading_depth,
    minCompletionRate,
  );

  return {
    pages_viewed_count,
    pages_completed_count,
    total_pages,
    completion_rate,
    last_page_viewed: journey.last_page_viewed,
    abandoned_before_end: journey.abandoned_before_end,
    abandonment_page: journey.abandonment_page,
    reading_depth: readingQuality.reading_depth,
    reading_depth_label: getReadingDepthLabel(readingQuality.reading_depth),
    completion_status,
  };
}

export function buildChapterFinishedMetadata(
  sessionId: string,
  finishSource: FinishSource,
): ChapterMetrics & { finish_source: FinishSource } {
  return {
    ...buildChapterMetrics(sessionId),
    finish_source: finishSource,
  };
}

export function buildChapterCompletedMetadata(
  sessionId: string,
  finishSource: FinishSource = 'finish_button',
): ChapterMetrics & { completion_status: 'completed'; finish_source: FinishSource } {
  return {
    ...buildChapterMetrics(sessionId),
    completion_status: 'completed',
    finish_source: finishSource,
  };
}
