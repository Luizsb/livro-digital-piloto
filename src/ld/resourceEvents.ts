import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { AnalyticsEvent } from './sessionTypes';
import type { LinkTrackType } from './contentInteractionTypes';

const ENGAGEMENT_TYPES = new Set<LinkTrackType>([
  'oda_engagement',
  'escola_digital_engagement',
]);

/** Evento de abertura de recurso (novo ou legado `link_clicked` sem tipo de engajamento). */
export function isResourceOpenedEvent(event: AnalyticsEvent): boolean {
  if (event.event_name === ANALYTICS_EVENT_NAMES.resourceOpened) return true;

  if (event.event_name === ANALYTICS_EVENT_NAMES.linkClicked) {
    const type = event.metadata?.type;
    return typeof type === 'string' && !ENGAGEMENT_TYPES.has(type as LinkTrackType);
  }

  return false;
}

/** Evento de tempo de uso em recurso (novo ou legado). */
export function isResourceEngagementEvent(event: AnalyticsEvent): boolean {
  if (event.event_name === ANALYTICS_EVENT_NAMES.resourceEngagementRecorded) return true;

  if (event.event_name === ANALYTICS_EVENT_NAMES.linkClicked) {
    const type = event.metadata?.type;
    return typeof type === 'string' && ENGAGEMENT_TYPES.has(type as LinkTrackType);
  }

  return false;
}

export function isAnyResourceEvent(event: AnalyticsEvent): boolean {
  return isResourceOpenedEvent(event) || isResourceEngagementEvent(event);
}
