import { loadStoredEvents } from './recordEvent';
import { buildEventSummary } from './sessionSummary';
import { getActiveChapterManifest, tryGetChapterManifest, type ChapterManifest } from './chapterManifest';
import { loadFeedbackComments } from './feedbackComments';
import { BOOK_PILOT, type AnalyticsEvent } from './sessionTypes';
import {
  ANALYTICS_TIMEZONE_BR,
  formatDateBr,
  formatDateTimeBr,
} from '../lib/formatDateTimeBr';

export type ExportedAnalyticsEvent = AnalyticsEvent & {
  timestamp_br: string;
  timestamp_date_br: string;
};

export type ExportedFeedbackComment = ReturnType<typeof loadFeedbackComments>[number] & {
  submitted_at_br: string;
  submitted_date_br: string;
};

export const EXPORT_SCHEMA_VERSION = '1.0.0';

export interface ExportPayload {
  report_type: 'session_report';
  schema_version: string;
  exported_at: string;
  exported_at_br: string;
  timezone: typeof ANALYTICS_TIMEZONE_BR;
  book_id: string;
  chapter_id: string;
  participant_id: string;
  session_id: string;
  event_count: number;
  chapter_manifest?: ChapterManifest;
  summary: ReturnType<typeof buildEventSummary> & { exported_at_br: string };
  events: ExportedAnalyticsEvent[];
  feedback_comments: ExportedFeedbackComment[];
}

function enrichEvent(event: AnalyticsEvent): ExportedAnalyticsEvent {
  return {
    ...event,
    timestamp_br: formatDateTimeBr(event.timestamp),
    timestamp_date_br: formatDateBr(event.timestamp),
  };
}

function enrichFeedbackComment(
  comment: ReturnType<typeof loadFeedbackComments>[number],
): ExportedFeedbackComment {
  return {
    ...comment,
    submitted_at_br: formatDateTimeBr(comment.submitted_at),
    submitted_date_br: formatDateBr(comment.submitted_at),
  };
}

export function enrichEventForExport(event: AnalyticsEvent): ExportedAnalyticsEvent {
  return enrichEvent(event);
}

export function enrichFeedbackCommentForExport(
  comment: ReturnType<typeof loadFeedbackComments>[number],
): ExportedFeedbackComment {
  return enrichFeedbackComment(comment);
}

export function buildExportPayload(): ExportPayload {
  const events = loadStoredEvents();
  const exportedAt = new Date().toISOString();
  const summary = buildEventSummary();
  const chapterManifest =
    tryGetChapterManifest(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id) ??
    getActiveChapterManifest();

  const participantId = summary.participant_ids[0] ?? events[0]?.participant_id ?? '';
  const sessionId = summary.session_ids[0] ?? events[0]?.session_id ?? '';

  return {
    report_type: 'session_report',
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: exportedAt,
    exported_at_br: formatDateTimeBr(exportedAt),
    timezone: ANALYTICS_TIMEZONE_BR,
    book_id: BOOK_PILOT.book_id,
    chapter_id: BOOK_PILOT.chapter_id,
    participant_id: participantId,
    session_id: sessionId,
    event_count: events.length,
    chapter_manifest: chapterManifest,
    summary: {
      ...summary,
      exported_at: exportedAt,
      exported_at_br: formatDateTimeBr(exportedAt),
    },
    events: events.map(enrichEventForExport),
    feedback_comments: loadFeedbackComments().map(enrichFeedbackCommentForExport),
  };
}

export function downloadEventsJson(filename?: string): ExportPayload {
  const payload = buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  anchor.href = url;
  anchor.download =
    filename ?? `relatorio-uso-${BOOK_PILOT.chapter_id}-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return payload;
}
