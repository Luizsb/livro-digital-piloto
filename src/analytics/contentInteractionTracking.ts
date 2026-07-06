import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { LinkTrackType } from './contentInteractionTypes';
import { extractHrefDomain, getEngagementTypeForOpen } from './contentInteractionTypes';
import { trackOncePerSession } from './sessionDedup';

export interface TrackResourceOpenedInput {
  linkId: string;
  page: number;
  type: LinkTrackType;
  href?: string | null;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackResourceOpened({
  linkId,
  page,
  type,
  href,
  track,
}: TrackResourceOpenedInput): void {
  const metadata: Record<string, unknown> = {
    link_id: linkId,
    page,
    type,
  };

  const hrefDomain = extractHrefDomain(href ?? null);
  if (hrefDomain) {
    metadata.href_domain = hrefDomain;
  }

  track(ANALYTICS_EVENT_NAMES.resourceOpened, metadata);
}

export interface TrackResourceEngagementInput {
  linkId: string;
  page: number;
  openType: LinkTrackType;
  durationSeconds: number;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackResourceEngagementRecorded({
  linkId,
  page,
  openType,
  durationSeconds,
  track,
}: TrackResourceEngagementInput): void {
  const engagementType = getEngagementTypeForOpen(openType);
  if (!engagementType) return;

  track(ANALYTICS_EVENT_NAMES.resourceEngagementRecorded, {
    link_id: linkId,
    page,
    type: engagementType,
    duration_seconds: Math.max(1, durationSeconds),
  });
}

export interface TrackImageViewedInput {
  sessionId: string;
  imageId: string;
  page: number;
  src: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackImageViewedOnce({
  sessionId,
  imageId,
  page,
  src,
  track,
}: TrackImageViewedInput): boolean {
  const dedupeKey = `${ANALYTICS_EVENT_NAMES.imageViewed}_${imageId}`;
  return trackOncePerSession(sessionId, dedupeKey, () => {
    track(ANALYTICS_EVENT_NAMES.imageViewed, {
      image_id: imageId,
      page,
      src,
    });
  });
}

export interface TrackImageZoomedInput {
  sessionId: string;
  imageId: string;
  page: number;
  src: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

/** Zoom permite múltiplos eventos por sessão (sem deduplicação). */
export function trackImageZoomed({
  imageId,
  page,
  src,
  track,
}: TrackImageZoomedInput): void {
  track(ANALYTICS_EVENT_NAMES.imageZoomed, {
    image_id: imageId,
    page,
    src,
  });
}

export interface TrackImageLoadErrorInput {
  sessionId: string;
  imageId: string;
  page: number;
  src: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

/** Falha ao carregar imagem rastreada — observada na navegação do participante. */
export function trackImageLoadError({
  sessionId,
  imageId,
  page,
  src,
  track,
}: TrackImageLoadErrorInput): void {
  const dedupeKey = `${ANALYTICS_EVENT_NAMES.imageLoadError}_${imageId}`;
  trackOncePerSession(sessionId, dedupeKey, () => {
    track(ANALYTICS_EVENT_NAMES.imageLoadError, {
      image_id: imageId,
      page,
      src,
    });
  });
}
