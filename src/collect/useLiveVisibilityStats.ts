import { useEffect, useState } from 'react';
import { subscribeToEventsUpdates } from './sessionStore';
import {
  getLiveVisibilityStats,
  type LiveVisibilityStats,
} from './sessionVisibleTime';

export function useLiveVisibilityStats(): LiveVisibilityStats | null {
  const [stats, setStats] = useState(() => getLiveVisibilityStats());

  useEffect(() => {
    const tick = () => setStats(getLiveVisibilityStats());
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

  return stats;
}
