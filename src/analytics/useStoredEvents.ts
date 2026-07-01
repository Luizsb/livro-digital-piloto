import { useCallback, useEffect, useState } from 'react';
import type { AnalyticsEvent } from './eventTypes';
import { loadStoredEvents, subscribeToEventsUpdates } from './trackEvent';

export function useStoredEvents(): AnalyticsEvent[] {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => loadStoredEvents());

  const refresh = useCallback(() => {
    setEvents(loadStoredEvents());
  }, []);

  useEffect(() => {
    return subscribeToEventsUpdates(refresh);
  }, [refresh]);

  return events;
}
