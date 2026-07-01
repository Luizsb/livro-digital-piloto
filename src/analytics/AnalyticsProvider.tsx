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
import {
  markSessionEventTracked,
  setSessionStartedAt,
  wasSessionEventTracked,
  getSessionStartedAt,
} from './sessionDedup';
import {
  isEventAllowedWhenFinished,
  recoverActiveSessionAfterReload,
  setSessionStatus,
  syncSessionStatus,
  type SessionStatus,
} from './sessionStatus';
import { captureSessionDeviceContext } from './deviceContext';
import { capturePageLoadTiming } from './captureLoadTiming';

interface AnalyticsContextValue {
  sessionId: string;
  participantId: string | null;
  sessionStatus: SessionStatus;
  bookId: string;
  chapterId: string;
  setParticipantId: (participantId: string) => boolean;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
  refreshSessionStatus: () => void;
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
  const sessionId = useMemo(() => {
    const id = getOrCreateSessionId();
    recoverActiveSessionAfterReload(id);
    return id;
  }, []);
  const [participantId, setParticipantIdState] = useState<string | null>(() =>
    getStoredParticipantId(),
  );
  const [sessionStatus, setSessionStatusState] = useState<SessionStatus>(() =>
    syncSessionStatus(sessionId),
  );
  const sessionStartedRef = useRef(false);
  const sessionResumedRef = useRef(false);

  const refreshSessionStatus = useCallback(() => {
    setSessionStatusState(syncSessionStatus(sessionId));
  }, [sessionId]);

  const setParticipantId = useCallback(
    (raw: string): boolean => {
      const normalized = normalizeParticipantId(raw);
      if (!isValidParticipantId(normalized)) return false;
      saveParticipantId(normalized);
      setParticipantIdState(normalized);
      setSessionStatus('active');
      setSessionStatusState('active');
      return true;
    },
    [],
  );

  const track = useCallback(
    (eventName: string, metadata: Record<string, unknown> = {}) => {
      if (!participantId) return;

      const status = syncSessionStatus(sessionId);
      if (status === 'finished' && !isEventAllowedWhenFinished(eventName)) {
        return;
      }

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
      refreshSessionStatus();
      return;
    }
    sessionStartedRef.current = true;
    markSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted);
    setSessionStartedAt(new Date().toISOString());
    setSessionStatus('active');
    setSessionStatusState('active');
    track(ANALYTICS_EVENT_NAMES.sessionStarted, {
      ...captureSessionDeviceContext(),
    });
  }, [participantId, refreshSessionStatus, sessionId, track]);

  useEffect(() => {
    if (!participantId || sessionResumedRef.current) return;
    if (syncSessionStatus(sessionId) !== 'active') return;
    if (!wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted)) return;

    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type !== 'reload') return;

    sessionResumedRef.current = true;
    track(ANALYTICS_EVENT_NAMES.sessionResumed, {
      ...(capturePageLoadTiming() ?? {}),
      load_trigger: 'session_resumed',
    });
  }, [participantId, sessionId, track]);

  const value = useMemo(
    () => ({
      sessionId,
      participantId,
      sessionStatus,
      bookId,
      chapterId,
      setParticipantId,
      track,
      refreshSessionStatus,
    }),
    [
      bookId,
      chapterId,
      participantId,
      refreshSessionStatus,
      sessionId,
      sessionStatus,
      setParticipantId,
      track,
    ],
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
