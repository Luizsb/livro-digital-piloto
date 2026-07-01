import { ANALYTICS_STORAGE_KEYS } from './eventTypes';

function dedupeKey(sessionId: string, key: string): string {
  return `${ANALYTICS_STORAGE_KEYS.sessionId}_tracked_${sessionId}_${key}`;
}

export function wasSessionEventTracked(sessionId: string, key: string): boolean {
  try {
    return sessionStorage.getItem(dedupeKey(sessionId, key)) === '1';
  } catch {
    return false;
  }
}

export function markSessionEventTracked(sessionId: string, key: string): void {
  try {
    sessionStorage.setItem(dedupeKey(sessionId, key), '1');
  } catch {
    // ignore
  }
}

/** Registra no máximo uma vez por sessão; retorna true se o evento foi emitido. */
export function trackOncePerSession(
  sessionId: string,
  key: string,
  emit: () => void,
): boolean {
  if (wasSessionEventTracked(sessionId, key)) return false;
  markSessionEventTracked(sessionId, key);
  emit();
  return true;
}

export function getSessionStartedAt(): string | null {
  try {
    return sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.sessionStartedAt);
  } catch {
    return null;
  }
}

export function setSessionStartedAt(iso: string): void {
  try {
    sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.sessionStartedAt, iso);
  } catch {
    // ignore
  }
}

export function getAndIncrementExportCount(sessionId: string): number {
  try {
    const key = `${ANALYTICS_STORAGE_KEYS.exportCountPrefix}${sessionId}`;
    const next = (parseInt(sessionStorage.getItem(key) ?? '0', 10) || 0) + 1;
    sessionStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function isActivityCompletedInSession(
  sessionId: string,
  activityId: string,
): boolean {
  return wasSessionEventTracked(
    sessionId,
    `activity_completed_${activityId}`,
  );
}
