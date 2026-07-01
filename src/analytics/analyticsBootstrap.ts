import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { wasSessionEventTracked } from './sessionDedup';
import { isSessionCollecting } from './sessionStatus';

/** Sessão ativa e livro prontos — ordem: session_started → book_opened → page_viewed */
export function isPageTrackingReady(sessionId: string): boolean {
  if (!isSessionCollecting(sessionId)) return false;
  return (
    wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted) &&
    wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.bookOpened)
  );
}
