import { useCallback, useEffect, useState } from 'react';
import type { AnalyticsEvent } from './sessionTypes';
import { loadStoredEvents, subscribeToEventsUpdates } from './sessionStore';

export function useSessionLog(): AnalyticsEvent[] {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => loadStoredEvents());

  const refresh = useCallback(() => {
    setEvents(loadStoredEvents());
  }, []);

  useEffect(() => {
    return subscribeToEventsUpdates(refresh);
  }, [refresh]);

  return events;
}
