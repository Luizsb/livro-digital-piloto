import { useEffect, useState } from 'react';
import {
  getSessionVisibleSeconds,
  isSessionVisibleTimePaused,
} from './sessionVisibleTime';
import { subscribeToEventsUpdates } from './sessionStore';

export function computeSessionElapsedSeconds(nowMs = Date.now()): number | null {
  return getSessionVisibleSeconds(nowMs);
}

/** Tempo visível na aba desde session_started; pausa ao trocar de guia. */
export function useLiveSessionDuration(): number | null {
  const [seconds, setSeconds] = useState(() => computeSessionElapsedSeconds());

  useEffect(() => {
    const tick = () => setSeconds(computeSessionElapsedSeconds());
    tick();

    const unsubscribe = subscribeToEventsUpdates(tick);
    const intervalId = window.setInterval(tick, 1000);
    const onVisibilityChange = () => tick();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return seconds;
}

export function useIsSessionTimerPaused(): boolean {
  const [paused, setPaused] = useState(() => isSessionVisibleTimePaused());

  useEffect(() => {
    const update = () => setPaused(isSessionVisibleTimePaused());
    update();
    document.addEventListener('visibilitychange', update);
    const unsubscribe = subscribeToEventsUpdates(update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      unsubscribe();
    };
  }, []);

  return paused;
}
