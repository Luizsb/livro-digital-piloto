import { loadStoredEvents } from './trackEvent';
import { buildEventSummary } from './eventSummary';
import { loadFeedbackComments } from './feedbackComments';
import { BOOK_PILOT } from './eventTypes';

export interface ExportPayload {
  exported_at: string;
  book_id: string;
  chapter_id: string;
  event_count: number;
  summary: ReturnType<typeof buildEventSummary>;
  events: ReturnType<typeof loadStoredEvents>;
  feedback_comments: ReturnType<typeof loadFeedbackComments>;
}

export function buildExportPayload(): ExportPayload {
  const events = loadStoredEvents();
  return {
    exported_at: new Date().toISOString(),
    book_id: BOOK_PILOT.book_id,
    chapter_id: BOOK_PILOT.chapter_id,
    event_count: events.length,
    summary: buildEventSummary(),
    events,
    feedback_comments: loadFeedbackComments(),
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
