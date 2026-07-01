import { useEffect, useState } from 'react';
import { getSessionStartedAt } from './sessionDedup';
import { getSessionFinishedAt, getSessionStatus } from './sessionStatus';
import { subscribeToEventsUpdates } from './trackEvent';

export function computeSessionElapsedSeconds(nowMs = Date.now()): number | null {
  const startedAt = getSessionStartedAt();
  if (!startedAt) return null;

  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return null;

  if (getSessionStatus() === 'finished') {
    const finishedAt = getSessionFinishedAt();
    if (finishedAt) {
      const endMs = Date.parse(finishedAt);
      if (!Number.isNaN(endMs)) {
        return Math.max(0, Math.floor((endMs - startMs) / 1000));
      }
    }
  }

  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

/** Segundos decorridos desde session_started; atualiza a cada 1s enquanto a sessão está ativa. */
export function useLiveSessionDuration(): number | null {
  const [seconds, setSeconds] = useState(() => computeSessionElapsedSeconds());

  useEffect(() => {
    const tick = () => setSeconds(computeSessionElapsedSeconds());
    tick();

    const unsubscribe = subscribeToEventsUpdates(tick);
    if (getSessionStatus() === 'finished') {
      return unsubscribe;
    }

    const intervalId = window.setInterval(tick, 1000);
    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  return seconds;
}
