import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { PageCompletionReason } from './pageReadingState';
import {
  PAGE_COMPLETE_MIN_SECONDS,
  getLastActivePage,
  getPageDurationSeconds,
  meetsMinimumReadingTime,
} from './pageReadingState';
import { trackOncePerSession } from './sessionDedup';

export interface TryCompletePageInput {
  sessionId: string;
  page: number;
  reason: PageCompletionReason;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
  atMs?: number;
}

export function completeActivePageOnSessionEnd(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): void {
  const page = getLastActivePage();
  if (page === null) return;

  tryCompletePage({
    sessionId,
    page,
    reason: 'session_finished',
    track,
  });
}

/**
 * Emite `page_completed` somente se a página ficou visível pelo tempo mínimo.
 * Retorna true se o evento foi registrado.
 */
export function tryCompletePage({
  sessionId,
  page,
  reason,
  track,
  atMs = Date.now(),
}: TryCompletePageInput): boolean {
  if (!meetsMinimumReadingTime(page, atMs)) return false;

  const duration_seconds = getPageDurationSeconds(page, atMs);
  const dedupeKey = `${ANALYTICS_EVENT_NAMES.pageCompleted}_${page}`;

  return trackOncePerSession(sessionId, dedupeKey, () => {
    track(ANALYTICS_EVENT_NAMES.pageCompleted, {
      page,
      duration_seconds,
      completion_reason: reason,
    });
  });
}

export { ANALYTICS_CONFIG } from './ldConfig';
export { PAGE_COMPLETE_MIN_SECONDS } from './pageReadingState';
