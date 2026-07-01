import { loadStoredEvents } from './trackEvent';
import { ANALYTICS_EVENT_NAMES, BOOK_PILOT } from './eventTypes';
import { buildChapterPageSnapshot } from './chapterPageConfig';
import { buildContentInteractionsSummary } from './contentInteractionsSummary';
import { buildFeedbackSummary } from './feedbackSummary';
import { getReadingDepthLabel, type ReadingDepth } from './readingQuality';

import { buildTeacherButtonSummary, type TeacherButtonSummary } from './teacherButtonSummary';
import {
  extractDeviceContextFromMetadata,
  type SessionDeviceSummary,
} from './deviceContextSummary';

export interface EventSummary extends TeacherButtonSummary, Partial<SessionDeviceSummary> {
  exported_at: string;
  book_id: string;
  chapter_id: string;
  total_events: number;
  participant_ids: string[];
  session_ids: string[];
  by_event_name: Record<string, number>;
  pages_viewed: number[];
  pages_completed: number[];
  pages_viewed_count: number;
  pages_completed_count: number;
  completion_rate: number;
  activities_started: string[];
  activities_completed: string[];
  images_with_errors: string[];
  images_viewed_unique: string[];
  images_viewed_unique_count: number;
  image_zoom_total: number;
  image_zoom_unique_count: number;
  resources_opened_total: number;
  resources_opened_unique_count: number;
  resources_engagement_total: number;
  oda_opened_count: number;
  oda_engagement_total_seconds: number;
  escola_digital_opened_count: number;
  escola_digital_engagement_total_seconds: number;
  escola_digital_video_play_count: number;
  escola_digital_video_completed_count: number;
  escola_digital_video_watched_to_end: boolean;
  escola_digital_video_max_progress_percent: number;
  feedback_count: number;
  feedback: ReturnType<typeof buildFeedbackSummary>;
  reading_depth?: string;
  reading_depth_label?: string;
  chapter_finished_count: number;
  chapter_completed_count: number;
  chapter_first_page: number;
  chapter_last_page: number;
  chapter_total_pages: number;
  chapter_default_page: number;
}

export function buildEventSummary(): EventSummary {
  const events = loadStoredEvents();
  const content = buildContentInteractionsSummary(events);
  const feedback = buildFeedbackSummary(events);
  const byEventName: Record<string, number> = {};
  const pagesViewed = new Set<number>();
  const pagesCompleted = new Set<number>();
  const activitiesStarted = new Set<string>();
  const activitiesCompleted = new Set<string>();
  const imageErrors = new Set<string>();
  const imagesViewedUnique = new Set<string>();
  const imagesZoomedUnique = new Set<string>();
  let imageZoomTotal = 0;
  let feedbackCount = 0;
  let chapterFinishedCount = 0;
  let chapterCompletedCount = 0;
  let lastReadingDepth: string | undefined;
  let lastReadingDepthLabel: string | undefined;
  let deviceContext: SessionDeviceSummary | null = null;

  for (const event of events) {
    byEventName[event.event_name] = (byEventName[event.event_name] ?? 0) + 1;

    if (event.event_name === ANALYTICS_EVENT_NAMES.sessionStarted && !deviceContext) {
      deviceContext = extractDeviceContextFromMetadata(event.metadata);
    }

    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageViewed && typeof meta.page === 'number') {
      pagesViewed.add(meta.page);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageCompleted && typeof meta.page === 'number') {
      pagesCompleted.add(meta.page);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.activityStarted && typeof meta.activity_id === 'string') {
      activitiesStarted.add(meta.activity_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.activityCompleted && typeof meta.activity_id === 'string') {
      activitiesCompleted.add(meta.activity_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.imageLoadError && typeof meta.image_id === 'string') {
      imageErrors.add(meta.image_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.imageViewed && typeof meta.image_id === 'string') {
      imagesViewedUnique.add(meta.image_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.imageZoomed && typeof meta.image_id === 'string') {
      imageZoomTotal += 1;
      imagesZoomedUnique.add(meta.image_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.feedbackSubmitted) {
      feedbackCount += 1;
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.chapterFinished) {
      chapterFinishedCount += 1;
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.chapterCompleted) {
      chapterCompletedCount += 1;
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.sessionFinished ||
      event.event_name === ANALYTICS_EVENT_NAMES.chapterFinished ||
      event.event_name === ANALYTICS_EVENT_NAMES.chapterCompleted
    ) {
      const depth = event.metadata?.reading_depth;
      if (typeof depth === 'string') {
        lastReadingDepth = depth;
        lastReadingDepthLabel =
          typeof event.metadata?.reading_depth_label === 'string'
            ? event.metadata.reading_depth_label
            : getReadingDepthLabel(depth as ReadingDepth);
      }
    }
  }

  const pages_viewed_count = pagesViewed.size;
  const pages_completed_count = pagesCompleted.size;
  const chapterPages = buildChapterPageSnapshot(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id);
  const teacherButton = buildTeacherButtonSummary(events);

  return {
    exported_at: new Date().toISOString(),
    book_id: BOOK_PILOT.book_id,
    chapter_id: BOOK_PILOT.chapter_id,
    total_events: events.length,
    participant_ids: [...new Set(events.map((e) => e.participant_id))],
    session_ids: [...new Set(events.map((e) => e.session_id))],
    by_event_name: byEventName,
    pages_viewed: [...pagesViewed].sort((a, b) => a - b),
    pages_completed: [...pagesCompleted].sort((a, b) => a - b),
    pages_viewed_count,
    pages_completed_count,
    completion_rate:
      pages_viewed_count > 0
        ? Math.round((pages_completed_count / pages_viewed_count) * 100)
        : 0,
    activities_started: [...activitiesStarted],
    activities_completed: [...activitiesCompleted],
    ...teacherButton,
    images_with_errors: [...imageErrors],
    images_viewed_unique: [...imagesViewedUnique].sort(),
    images_viewed_unique_count: imagesViewedUnique.size,
    image_zoom_total: imageZoomTotal,
    image_zoom_unique_count: imagesZoomedUnique.size,
    resources_opened_total: content.resources_opened_total,
    resources_opened_unique_count: content.resources_opened_unique_count,
    resources_engagement_total: content.resources_engagement_total,
    oda_opened_count: content.oda_opened_count,
    oda_engagement_total_seconds: content.oda_engagement_total_seconds,
    escola_digital_opened_count: content.escola_digital_opened_count,
    escola_digital_engagement_total_seconds: content.escola_digital_engagement_total_seconds,
    escola_digital_video_play_count: content.escola_digital_video_play_count,
    escola_digital_video_completed_count: content.escola_digital_video_completed_count,
    escola_digital_video_watched_to_end: content.escola_digital_video_watched_to_end,
    escola_digital_video_max_progress_percent: content.escola_digital_video_max_progress_percent,
    feedback_count: feedbackCount,
    feedback,
    reading_depth: lastReadingDepth,
    reading_depth_label: lastReadingDepthLabel,
    chapter_finished_count: chapterFinishedCount,
    chapter_completed_count: chapterCompletedCount,
    ...(deviceContext ?? {}),
    ...chapterPages,
  };
}
