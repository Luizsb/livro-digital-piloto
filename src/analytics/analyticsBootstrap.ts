import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { wasSessionEventTracked } from './sessionDedup';

/** Sessão e livro prontos — ordem: session_started → book_opened → page_viewed */
export function isPageTrackingReady(sessionId: string): boolean {
  return (
    wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted) &&
    wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.bookOpened)
  );
}
