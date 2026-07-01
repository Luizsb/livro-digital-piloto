import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ANALYTICS_EVENT_NAMES,
  BOOK_PILOT,
  TrackEventInput,
  isValidParticipantId,
  normalizeParticipantId,
} from './eventTypes';
import {
  getOrCreateSessionId,
  getStoredParticipantId,
  saveParticipantId,
  trackEvent as persistTrackEvent,
} from './trackEvent';
import { markSessionEventTracked, setSessionStartedAt, wasSessionEventTracked, getSessionStartedAt } from './sessionDedup';

interface AnalyticsContextValue {
  sessionId: string;
  participantId: string | null;
  bookId: string;
  chapterId: string;
  setParticipantId: (participantId: string) => boolean;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  bookId?: string;
  chapterId?: string;
}

export function AnalyticsProvider({
  children,
  bookId = BOOK_PILOT.book_id,
  chapterId = BOOK_PILOT.chapter_id,
}: AnalyticsProviderProps) {
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const [participantId, setParticipantIdState] = useState<string | null>(() =>
    getStoredParticipantId(),
  );
  const sessionStartedRef = useRef(false);

  const setParticipantId = useCallback((raw: string): boolean => {
    const normalized = normalizeParticipantId(raw);
    if (!isValidParticipantId(normalized)) return false;
    saveParticipantId(normalized);
    setParticipantIdState(normalized);
    return true;
  }, []);

  const track = useCallback(
    (eventName: string, metadata: Record<string, unknown> = {}) => {
      if (!participantId) return;

      const input: TrackEventInput = {
        event_name: eventName,
        session_id: sessionId,
        participant_id: participantId,
        book_id: bookId,
        chapter_id: chapterId,
        metadata,
      };
      persistTrackEvent(input);
    },
    [bookId, chapterId, participantId, sessionId],
  );

  useEffect(() => {
    if (!participantId || sessionStartedRef.current) return;
    if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted)) {
      sessionStartedRef.current = true;
      if (!getSessionStartedAt()) {
        setSessionStartedAt(new Date().toISOString());
      }
      return;
    }
    sessionStartedRef.current = true;
    markSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted);
    setSessionStartedAt(new Date().toISOString());
    track(ANALYTICS_EVENT_NAMES.sessionStarted);
  }, [participantId, sessionId, track]);

  const value = useMemo(
    () => ({
      sessionId,
      participantId,
      bookId,
      chapterId,
      setParticipantId,
      track,
    }),
    [bookId, chapterId, participantId, sessionId, setParticipantId, track],
  );

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics deve ser usado dentro de AnalyticsProvider');
  }
  return context;
}

/** Retorna null fora do AnalyticsProvider (componentes compartilhados). */
export function useOptionalAnalytics(): AnalyticsContextValue | null {
  return useContext(AnalyticsContext);
}
