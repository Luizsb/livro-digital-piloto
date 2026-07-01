import { useEffect } from 'react';
import { isPageTrackingReady } from './analyticsBootstrap';
import type { LinkTrackType } from './contentInteractionTypes';
import { extractHrefDomain } from './contentInteractionTypes';
import {
  trackResourceEngagementRecorded,
  trackResourceOpened,
} from './contentInteractionTracking';
import { useOptionalAnalytics } from './AnalyticsProvider';

const TRACK_LINK_SELECTOR = '[data-track-link-id]';

function parseTrackPage(element: Element): number | null {
  const raw = element.getAttribute('data-track-page');
  if (!raw) return null;
  const page = parseInt(raw, 10);
  return Number.isNaN(page) ? null : page;
}

function getHrefFromElement(element: Element): string | null {
  if (element instanceof HTMLAnchorElement && element.href) {
    return element.href;
  }
  return element.getAttribute('data-track-href');
}

export function useLinkClickTracking(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics) return;

    const handleClick = (event: MouseEvent) => {
      if (!isPageTrackingReady(analytics.sessionId)) return;

      const target = (event.target as Element | null)?.closest(TRACK_LINK_SELECTOR);
      if (!target) return;

      const linkId = target.getAttribute('data-track-link-id');
      const page = parseTrackPage(target);
      const type = (target.getAttribute('data-track-link-type') ?? 'external_link') as LinkTrackType;

      if (!linkId || page === null) return;

      trackResourceOpened({
        linkId,
        page,
        type,
        href: getHrefFromElement(target),
        track: analytics.track,
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [analytics]);
}

export type { LinkTrackType };

/** Helper para montar props de analytics em GameModal / links. */
export function buildLinkAnalyticsAttributes(input: {
  linkId: string;
  page: number;
  type: LinkTrackType;
  href?: string;
}): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-track-link-id': input.linkId,
    'data-track-page': String(input.page),
    'data-track-link-type': input.type,
  };
  if (input.href) {
    attrs['data-track-href'] = input.href;
  }
  return attrs;
}

export function trackModalResourceOpen(
  analytics: { sessionId: string; track: (n: string, m?: Record<string, unknown>) => void },
  input: { linkId: string; page: number; type: LinkTrackType; href?: string },
): void {
  if (!isPageTrackingReady(analytics.sessionId)) return;

  trackResourceOpened({
    linkId: input.linkId,
    page: input.page,
    type: input.type,
    href: input.href,
    track: analytics.track,
  });
}

export function trackModalResourceEngagement(
  analytics: { track: (n: string, m?: Record<string, unknown>) => void },
  input: {
    linkId: string;
    page: number;
    openType: LinkTrackType;
    openedAtMs: number;
  },
): void {
  const durationSeconds = Math.max(
    1,
    Math.round((Date.now() - input.openedAtMs) / 1000),
  );

  trackResourceEngagementRecorded({
    linkId: input.linkId,
    page: input.page,
    openType: input.openType,
    durationSeconds,
    track: analytics.track,
  });
}

export { extractHrefDomain };
