import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { loadStoredEvents } from './trackEvent';
import { getSessionStartedAt } from './sessionDedup';
import { computeReadingQuality } from './readingQuality';
import type { ReadingDepth } from './readingQuality';

export interface SessionFinishMetadata {
  duration_seconds: number;
  pages_viewed_count: number;
  pages_completed_count: number;
  avg_seconds_per_viewed_page: number;
  avg_seconds_per_completed_page: number;
  reading_depth: ReadingDepth;
  activities_started_count: number;
  activities_completed_count: number;
  images_viewed_count: number;
  feedback_submitted: boolean;
}

export function buildSessionFinishMetadata(sessionId: string): SessionFinishMetadata {
  const events = loadStoredEvents().filter((e) => e.session_id === sessionId);
  const startedAt = getSessionStartedAt();
  const duration_seconds = startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
    : 0;

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
  const readingQuality = computeReadingQuality(events, duration_seconds, pages_viewed_count);

  return {
    duration_seconds,
    pages_viewed_count,
    pages_completed_count: pagesCompleted.size,
    avg_seconds_per_viewed_page: readingQuality.avg_seconds_per_viewed_page,
    avg_seconds_per_completed_page: readingQuality.avg_seconds_per_completed_page,
    reading_depth: readingQuality.reading_depth,
    activities_started_count: activitiesStarted.size,
    activities_completed_count: activitiesCompleted.size,
    images_viewed_count: imagesViewed.size,
    feedback_submitted: feedbackSubmitted,
  };
}
