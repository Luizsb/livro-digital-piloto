import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { AnalyticsEvent } from './sessionTypes';
import { getLastActivePage } from './pageReadingState';

export interface SessionJourneyMetrics {
  last_page_viewed: number | null;
  abandoned_before_end: boolean;
  abandonment_page: number | null;
}

/** Último evento `page_viewed` por timestamp. */
export function findLastPageViewedEvent(
  events: AnalyticsEvent[],
): AnalyticsEvent | undefined {
  let last: AnalyticsEvent | undefined;
  let lastTs = -Infinity;

  for (const event of events) {
    if (event.event_name !== ANALYTICS_EVENT_NAMES.pageViewed) continue;
    const page = event.metadata?.page;
    if (typeof page !== 'number') continue;
    const ts = Date.parse(event.timestamp);
    if (Number.isNaN(ts) || ts < lastTs) continue;
    lastTs = ts;
    last = event;
  }

  return last;
}

function resolveLastPageViewedFromEvents(events: AnalyticsEvent[]): number | null {
  const lastNav = findLastPageViewedEvent(events);
  if (lastNav && typeof lastNav.metadata?.page === 'number') {
    return lastNav.metadata.page;
  }
  return null;
}

export function buildSessionJourneyMetrics(
  events: AnalyticsEvent[],
  totalPages: number,
  options?: { lastActivePage?: number | null },
): SessionJourneyMetrics {
  const pagesViewed = new Set<number>();

  for (const event of events) {
    if (event.event_name !== ANALYTICS_EVENT_NAMES.pageViewed) continue;
    const page = event.metadata?.page;
    if (typeof page === 'number') pagesViewed.add(page);
  }

  const lastActivePage = options?.lastActivePage ?? getLastActivePage();
  const last_page_viewed =
    lastActivePage ?? resolveLastPageViewedFromEvents(events);

  const abandoned_before_end = pagesViewed.size < totalPages;
  const abandonment_page = abandoned_before_end ? last_page_viewed : null;

  return {
    last_page_viewed,
    abandoned_before_end,
    abandonment_page,
  };
}
