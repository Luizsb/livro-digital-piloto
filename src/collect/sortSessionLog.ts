import type { AnalyticsEvent } from './sessionTypes';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';

/**
 * Desempate na listagem do painel (mais recente primeiro).
 * Mesmo timestamp: ordem narrativa do encerramento (session → chapter → feedback → page).
 */
const DISPLAY_PRIORITY: Record<string, number> = {
  [ANALYTICS_EVENT_NAMES.eventsExported]: 55,
  [ANALYTICS_EVENT_NAMES.sessionFinished]: 50,
  [ANALYTICS_EVENT_NAMES.chapterCompleted]: 45,
  [ANALYTICS_EVENT_NAMES.chapterFinished]: 40,
  [ANALYTICS_EVENT_NAMES.feedbackSubmitted]: 35,
  [ANALYTICS_EVENT_NAMES.imageViewed]: 28,
  [ANALYTICS_EVENT_NAMES.imageZoomed]: 25,
  [ANALYTICS_EVENT_NAMES.resourceOpened]: 23,
  [ANALYTICS_EVENT_NAMES.resourceEngagementRecorded]: 21,
  [ANALYTICS_EVENT_NAMES.videoStarted]: 22,
  [ANALYTICS_EVENT_NAMES.videoCompleted]: 22,
  [ANALYTICS_EVENT_NAMES.videoProgressRecorded]: 21,
  [ANALYTICS_EVENT_NAMES.teacherButtonClosed]: 24,
  [ANALYTICS_EVENT_NAMES.teacherButtonOpened]: 24,
  [ANALYTICS_EVENT_NAMES.linkClicked]: 22,
  [ANALYTICS_EVENT_NAMES.pageViewed]: 30,
  [ANALYTICS_EVENT_NAMES.pageCompleted]: 20,
  [ANALYTICS_EVENT_NAMES.bookOpened]: 15,
  [ANALYTICS_EVENT_NAMES.sessionStarted]: 12,
};

/** Ordena do mais recente ao mais antigo, com desempate previsível. */
export function sortAnalyticsEventsNewestFirst(events: AnalyticsEvent[]): AnalyticsEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const byTime = b.event.timestamp.localeCompare(a.event.timestamp);
      if (byTime !== 0) return byTime;

      const priorityA = DISPLAY_PRIORITY[a.event.event_name] ?? 0;
      const priorityB = DISPLAY_PRIORITY[b.event.event_name] ?? 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      return b.index - a.index;
    })
    .map(({ event }) => event);
}
