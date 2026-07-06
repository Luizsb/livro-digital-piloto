import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { captureSessionDeviceContext } from './deviceContext';
import { trackEvent as persistTrackEvent } from './recordEvent';
import {
  markSessionEventTracked,
  setSessionStartedAt,
  wasSessionEventTracked,
  getSessionStartedAt,
} from './sessionDedup';
import { setSessionStatus } from './sessionStatus';
import {
  resumeSessionVisibleTimeTracking,
  startSessionVisibleTimeTracking,
} from './sessionVisibleTime';

export interface SessionStartedInput {
  sessionId: string;
  participantId: string;
  bookId: string;
  chapterId: string;
}

/** Garante `session_started` de forma síncrona — evita travar em "Preparando o capítulo…". */
export function ensureSessionStarted(input: SessionStartedInput): boolean {
  const { sessionId, participantId, bookId, chapterId } = input;

  if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted)) {
    if (!getSessionStartedAt()) {
      setSessionStartedAt(new Date().toISOString());
    }
    resumeSessionVisibleTimeTracking();
    setSessionStatus('active');
    return false;
  }

  markSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted);
  setSessionStartedAt(new Date().toISOString());
  startSessionVisibleTimeTracking();
  setSessionStatus('active');

  persistTrackEvent({
    event_name: ANALYTICS_EVENT_NAMES.sessionStarted,
    session_id: sessionId,
    participant_id: participantId,
    book_id: bookId,
    chapter_id: chapterId,
    metadata: {
      ...captureSessionDeviceContext(),
    },
  });
  return true;
}

export function hasSessionStarted(sessionId: string): boolean {
  return wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted);
}
