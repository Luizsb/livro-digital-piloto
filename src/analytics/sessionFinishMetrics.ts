import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { loadStoredEvents } from './recordEvent';
import { computeReadingQuality } from './readingQuality';
import { freezeSessionVisibilityMetrics } from './sessionVisibleTime';
import { freezeSessionIdleTime } from './sessionIdleTime';
import { buildChapterPageSnapshot } from '@book/chapter/chapterPageConfig';
import { buildSessionJourneyMetrics } from './sessionJourneyMetrics';
import { getLastActivePage } from './pageReadingState';
import { isResourceOpenedEvent } from './resourceEvents';
import { BOOK_PILOT } from './sessionTypes';
import type { ReadingDepth } from './readingQuality';
import type { SessionVisibilityMetrics } from './sessionVisibilityMetrics';

export interface SessionFinishMetadata extends SessionVisibilityMetrics {
  pages_viewed_count: number;
  pages_completed_count: number;
  avg_seconds_per_viewed_page: number;
  avg_seconds_per_completed_page: number;
  reading_depth: ReadingDepth;
  activities_started_count: number;
  activities_completed_count: number;
  images_viewed_count: number;
  feedback_submitted: boolean;
  idle_time_seconds: number;
  last_page_viewed: number | null;
  abandoned_before_end: boolean;
  abandonment_page: number | null;
}

export function buildSessionFinishMetadata(sessionId: string): SessionFinishMetadata {
  const events = loadStoredEvents().filter((e) => e.session_id === sessionId);
  const visibility = freezeSessionVisibilityMetrics();

  const pagesViewed = new Set<number>();
  const pagesCompleted = new Set<number>();
  const activitiesStarted = new Set<string>();
  const activitiesCompleted = new Set<string>();
  const imagesViewed = new Set<string>();
  let feedbackSubmitted = false;

  for (const event of events) {
    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageViewed && typeof meta.page === 'number') {
      pagesViewed.add(meta.page);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageCompleted && typeof meta.page === 'number') {
      pagesCompleted.add(meta.page);
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.activityStarted &&
      typeof meta.activity_id === 'string'
    ) {
      activitiesStarted.add(meta.activity_id);
    }
    if (isResourceOpenedEvent(event) && meta.type === 'oda_opened' && typeof meta.link_id === 'string') {
      activitiesStarted.add(meta.link_id);
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.activityCompleted &&
      typeof meta.activity_id === 'string'
    ) {
      activitiesCompleted.add(meta.activity_id);
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.imageViewed &&
      typeof meta.image_id === 'string'
    ) {
      imagesViewed.add(meta.image_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.feedbackSubmitted) {
      feedbackSubmitted = true;
    }
  }

  const pages_viewed_count = pagesViewed.size;
  const readingQuality = computeReadingQuality(
    events,
    visibility.visible_time_seconds,
    pages_viewed_count,
  );

  const chapterPages = buildChapterPageSnapshot(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id);
  const journey = buildSessionJourneyMetrics(events, chapterPages.chapter_total_pages, {
    lastActivePage: getLastActivePage(),
  });
  const idle_time_seconds = freezeSessionIdleTime();

  return {
    ...visibility,
    pages_viewed_count,
    pages_completed_count: pagesCompleted.size,
    avg_seconds_per_viewed_page: readingQuality.avg_seconds_per_viewed_page,
    avg_seconds_per_completed_page: readingQuality.avg_seconds_per_completed_page,
    reading_depth: readingQuality.reading_depth,
    activities_started_count: activitiesStarted.size,
    activities_completed_count: activitiesCompleted.size,
    images_viewed_count: imagesViewed.size,
    feedback_submitted: feedbackSubmitted,
    idle_time_seconds,
    ...journey,
  };
}

export function pickSessionFinishedEventMetadata(
  metadata: SessionFinishMetadata,
): Record<string, unknown> {
  return {
    duration_seconds: metadata.duration_seconds,
    visible_time_seconds: metadata.visible_time_seconds,
    hidden_time_seconds: metadata.hidden_time_seconds,
    visible_time_ratio: metadata.visible_time_ratio,
    visibility_change_count: metadata.visibility_change_count,
    pages_viewed_count: metadata.pages_viewed_count,
    pages_completed_count: metadata.pages_completed_count,
    avg_seconds_per_viewed_page: metadata.avg_seconds_per_viewed_page,
    avg_seconds_per_completed_page: metadata.avg_seconds_per_completed_page,
    reading_depth: metadata.reading_depth,
    activities_started_count: metadata.activities_started_count,
    activities_completed_count: metadata.activities_completed_count,
    images_viewed_count: metadata.images_viewed_count,
    feedback_submitted: metadata.feedback_submitted,
    idle_time_seconds: metadata.idle_time_seconds,
    last_page_viewed: metadata.last_page_viewed,
    abandoned_before_end: metadata.abandoned_before_end,
    abandonment_page: metadata.abandonment_page,
  };
}
