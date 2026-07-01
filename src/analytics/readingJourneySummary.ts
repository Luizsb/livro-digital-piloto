import type { AnalyticsEvent } from './eventTypes';
import { ANALYTICS_EVENT_NAMES } from './eventTypes';

export interface ReadingJourneySummary {
  pages_viewed: number[];
  pages_completed: number[];
  pages_viewed_count: number;
  pages_completed_count: number;
  /** Percentual de páginas visualizadas que foram concluídas (0–100). */
  completion_rate: number;
}

export function buildReadingJourneySummary(events: AnalyticsEvent[]): ReadingJourneySummary {
  const pagesViewed = new Set<number>();
  const pagesCompleted = new Set<number>();

  for (const event of events) {
    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageViewed && typeof meta.page === 'number') {
      pagesViewed.add(meta.page);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageCompleted && typeof meta.page === 'number') {
      pagesCompleted.add(meta.page);
    }
  }

  const pages_viewed_count = pagesViewed.size;
  const pages_completed_count = pagesCompleted.size;
  const completion_rate =
    pages_viewed_count > 0
      ? Math.round((pages_completed_count / pages_viewed_count) * 100)
      : 0;

  return {
    pages_viewed: [...pagesViewed].sort((a, b) => a - b),
    pages_completed: [...pagesCompleted].sort((a, b) => a - b),
    pages_viewed_count,
    pages_completed_count,
    completion_rate,
  };
}
