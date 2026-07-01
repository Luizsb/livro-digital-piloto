export const ANALYTICS_SOURCE = 'react_mvp' as const;

export const BOOK_PILOT = {
  book_id: 'cap07_historia_ai43',
  chapter_id: 'cap07',
} as const;

export const ANALYTICS_STORAGE_KEYS = {
  events: 'ld_analytics_events',
  feedbackComments: 'ld_analytics_feedback_comments',
  participantId: 'ld_analytics_participant_id',
  sessionId: 'ld_analytics_session_id',
  sessionStartedAt: 'ld_analytics_session_started_at',
  exportCountPrefix: 'ld_analytics_export_count_',
} as const;

export const ANALYTICS_EVENTS_UPDATED = 'ld_analytics_events_updated';

export const ANALYTICS_EVENT_NAMES = {
  sessionStarted: 'session_started',
  bookOpened: 'book_opened',
  eventsExported: 'events_exported',
  pageViewed: 'page_viewed',
  pageCompleted: 'page_completed',
  imageViewed: 'image_viewed',
  imageZoomed: 'image_zoomed',
  imageLoadError: 'image_load_error',
  linkClicked: 'link_clicked',
  resourceOpened: 'resource_opened',
  resourceEngagementRecorded: 'resource_engagement_recorded',
  teacherButtonOpened: 'teacher_button_opened',
  teacherButtonClosed: 'teacher_button_closed',
  activityStarted: 'activity_started',
  activityCompleted: 'activity_completed',
  accessibilityChanged: 'accessibility_changed',
  feedbackSubmitted: 'feedback_submitted',
  chapterFinished: 'chapter_finished',
  chapterCompleted: 'chapter_completed',
  sessionFinished: 'session_finished',
  videoStarted: 'video_started',
  videoCompleted: 'video_completed',
  videoProgressRecorded: 'video_progress_recorded',
} as const;

export type AnalyticsEventName =
  | typeof ANALYTICS_EVENT_NAMES.sessionStarted
  | typeof ANALYTICS_EVENT_NAMES.bookOpened
  | typeof ANALYTICS_EVENT_NAMES.eventsExported
  | string;

export interface AnalyticsEvent {
  event_id: string;
  event_name: AnalyticsEventName;
  timestamp: string;
  session_id: string;
  participant_id: string;
  book_id: string;
  chapter_id: string;
  source: typeof ANALYTICS_SOURCE;
  metadata: Record<string, unknown>;
}

export interface TrackEventInput {
  event_name: AnalyticsEventName;
  session_id: string;
  participant_id: string;
  book_id: string;
  chapter_id: string;
  metadata?: Record<string, unknown>;
}

/** Códigos anônimos: P01, P02, P03 … */
export const PARTICIPANT_ID_PATTERN = /^P\d{2}$/i;

export function isValidParticipantId(value: string): boolean {
  return PARTICIPANT_ID_PATTERN.test(value.trim());
}

export function normalizeParticipantId(value: string): string {
  return value.trim().toUpperCase();
}
