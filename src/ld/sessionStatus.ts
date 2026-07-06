import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { unmarkSessionEventTracked, wasSessionEventTracked } from './sessionDedup';
import { getStoredParticipantId, removeEventsForSessionByName } from './recordEvent';

export type SessionStatus = 'not_started' | 'active' | 'finished';

const STATUS_KEY = 'ld_analytics_session_status';
const FINISHED_AT_KEY = 'ld_analytics_session_finished_at';

export function getSessionStatus(): SessionStatus {
  try {
    const value = sessionStorage.getItem(STATUS_KEY);
    if (value === 'active' || value === 'finished' || value === 'not_started') {
      return value;
    }
  } catch {
    // ignore
  }
  return 'not_started';
}

export function setSessionStatus(status: SessionStatus): void {
  try {
    sessionStorage.setItem(STATUS_KEY, status);
  } catch {
    // ignore
  }
}

export function getSessionFinishedAt(): string | null {
  try {
    return sessionStorage.getItem(FINISHED_AT_KEY);
  } catch {
    return null;
  }
}

export function setSessionFinishedAt(iso: string): void {
  try {
    sessionStorage.setItem(FINISHED_AT_KEY, iso);
  } catch {
    // ignore
  }
}

export function clearSessionFinishedAt(): void {
  try {
    sessionStorage.removeItem(FINISHED_AT_KEY);
  } catch {
    // ignore
  }
}

/**
 * F5 dispara `pagehide` e pode registrar `session_finished` indevidamente.
 * Se o usuário não clicou em Finalizar (`chapter_finished` ausente), restaura sessão ativa.
 */
export function recoverActiveSessionAfterReload(sessionId: string): void {
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav?.type !== 'reload') return;
  if (getSessionStatus() !== 'finished') return;
  if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.chapterFinished)) return;
  if (!wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished)) {
    setSessionStatus('active');
    clearSessionFinishedAt();
    return;
  }

  unmarkSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished);
  removeEventsForSessionByName(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished);
  clearSessionFinishedAt();
  setSessionStatus('active');
}

export function syncSessionStatus(sessionId: string): SessionStatus {
  const participantId = getStoredParticipantId();
  if (!participantId) {
    setSessionStatus('not_started');
    return 'not_started';
  }

  if (
    getSessionStatus() === 'finished' ||
    wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished)
  ) {
    setSessionStatus('finished');
    return 'finished';
  }

  setSessionStatus('active');
  return 'active';
}

export function isSessionCollecting(sessionId: string): boolean {
  return syncSessionStatus(sessionId) === 'active';
}

/** Eventos permitidos após a sessão estar finalizada. */
export function isEventAllowedWhenFinished(eventName: string): boolean {
  return eventName === ANALYTICS_EVENT_NAMES.eventsExported;
}
