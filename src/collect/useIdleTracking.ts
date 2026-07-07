import { useEffect } from 'react';
import { useOptionalAnalytics } from './SessionProvider';
import {
  resumeSessionIdleTracking,
  startSessionIdleTracking,
  stopSessionIdleTracking,
} from './sessionIdleTime';
import { wasSessionEventTracked } from './sessionDedup';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { syncSessionStatus } from './sessionStatus';

/** Rastreia inatividade na aba visível e emite idle_started / idle_finished. */
export function useIdleTracking(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics?.participantId) return;

    const { sessionId, track } = analytics;
    const status = syncSessionStatus(sessionId);
    if (status === 'finished') return;

    if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted)) {
      resumeSessionIdleTracking(track);
    } else {
      startSessionIdleTracking(track);
    }

    return () => {
      stopSessionIdleTracking();
    };
  }, [analytics]);
}
