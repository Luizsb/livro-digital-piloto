import {
  ANALYTICS_SOURCE,
  ANALYTICS_STORAGE_KEYS,
  ANALYTICS_EVENTS_UPDATED,
  AnalyticsEvent,
  TrackEventInput,
} from './sessionTypes';
import { bootstrapLdStorage } from './resetLdStorage';
import { scheduleAnalyticsEventsUpdated } from './persistNotify';

function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadStoredEvents(): AnalyticsEvent[] {
  try {
    const raw = sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.events);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notifyEventsUpdated(): void {
  scheduleAnalyticsEventsUpdated();
}

export function subscribeToEventsUpdates(callback: () => void): () => void {
  window.addEventListener(ANALYTICS_EVENTS_UPDATED, callback);
  return () => window.removeEventListener(ANALYTICS_EVENTS_UPDATED, callback);
}

function persistEvents(events: AnalyticsEvent[]): void {
  try {
    sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.events, JSON.stringify(events));
    notifyEventsUpdated();
  } catch (error) {
    console.error('[analytics] Erro ao salvar eventos:', error);
  }
}

export function removeEventsForSessionByName(sessionId: string, eventName: string): void {
  const events = loadStoredEvents().filter(
    (event) => !(event.session_id === sessionId && event.event_name === eventName),
  );
  persistEvents(events);
}

export function trackEvent(input: TrackEventInput): AnalyticsEvent {
  const event: AnalyticsEvent = {
    event_id: createEventId(),
    event_name: input.event_name,
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    participant_id: input.participant_id,
    book_id: input.book_id,
    chapter_id: input.chapter_id,
    source: ANALYTICS_SOURCE,
    metadata: input.metadata ?? {},
  };

  const events = loadStoredEvents();
  events.push(event);
  persistEvents(events);

  return event;
}

export function getOrCreateSessionId(): string {
  bootstrapLdStorage();

  try {
    const existing = sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.sessionId);
    if (existing) return existing;

    const sessionId = createEventId();
    sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.sessionId, sessionId);
    return sessionId;
  } catch {
    return createEventId();
  }
}

export function getStoredParticipantId(): string | null {
  bootstrapLdStorage();

  try {
    return sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.participantId);
  } catch {
    return null;
  }
}

export function saveParticipantId(participantId: string): void {
  try {
    sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.participantId, participantId);
  } catch (error) {
    console.error('[analytics] Erro ao salvar participante:', error);
  }
}
