import {
  captureResourceTimingSnapshot,
  resourceTimingSnapshotMetadata,
} from './captureResourceTiming';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import {
  markSessionEventTracked,
  wasSessionEventTracked,
} from './sessionDedup';

/** Registra peso observado dos recursos carregados na sessão (uma vez por sessão). */
export function trackResourceTimingSnapshotOnce(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  const dedupeKey = ANALYTICS_EVENT_NAMES.resourceTimingSnapshot;
  if (wasSessionEventTracked(sessionId, dedupeKey)) {
    return false;
  }

  const snapshot = captureResourceTimingSnapshot();
  markSessionEventTracked(sessionId, dedupeKey);
  track(dedupeKey, resourceTimingSnapshotMetadata(snapshot));
  return true;
}

/** Snapshot atual — útil para anexar em `events_exported` no mesmo instante. */
export function captureResourceTimingMetadata(): Record<string, unknown> {
  return resourceTimingSnapshotMetadata(captureResourceTimingSnapshot());
}
