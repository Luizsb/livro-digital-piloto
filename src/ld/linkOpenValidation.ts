import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { LinkTrackType } from './contentInteractionTypes';
import { trackOncePerSession } from './sessionDedup';

const LINK_TYPES_TO_VALIDATE: LinkTrackType[] = [
  'external_link',
  'qr_code',
  'embedded_resource',
];

function normalizeHrefPath(href: string): string {
  try {
    const url = new URL(href, window.location.origin);
    return url.pathname + url.search;
  } catch {
    return href;
  }
}

export function shouldValidateLinkOnClick(type: LinkTrackType, href: string | null): boolean {
  if (!href || !LINK_TYPES_TO_VALIDATE.includes(type)) return false;

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

async function probeLink(href: string): Promise<{ ok: boolean; status: number | null }> {
  const url = new URL(href, window.location.origin).href;

  try {
    const headResponse = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (headResponse.ok) {
      return { ok: true, status: headResponse.status };
    }
    if (headResponse.status >= 400) {
      return { ok: false, status: headResponse.status };
    }
  } catch {
    // HEAD pode falhar em alguns servidores estáticos — tenta GET abaixo.
  }

  try {
    const getResponse = await fetch(url, { method: 'GET', cache: 'no-store' });
    return { ok: getResponse.ok, status: getResponse.status };
  } catch {
    return { ok: false, status: null };
  }
}

export interface TrackLinkOpenFailedInput {
  sessionId: string;
  linkId: string;
  page: number;
  href: string;
  status: number | null;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

function trackLinkOpenFailed({
  sessionId,
  linkId,
  page,
  href,
  status,
  track,
}: TrackLinkOpenFailedInput): void {
  const src = normalizeHrefPath(href);
  trackOncePerSession(sessionId, `${ANALYTICS_EVENT_NAMES.linkOpenFailed}_${linkId}`, () => {
    track(ANALYTICS_EVENT_NAMES.linkOpenFailed, {
      link_id: linkId,
      page,
      href: src,
      http_status: status,
    });
  });
}

/** Valida link interno após clique do participante (same-origin). */
export async function validateTrackedLinkAfterClick(input: {
  sessionId: string;
  linkId: string;
  page: number;
  type: LinkTrackType;
  href: string | null;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}): Promise<void> {
  const { sessionId, linkId, page, type, href, track } = input;
  if (!href || !shouldValidateLinkOnClick(type, href)) return;

  const result = await probeLink(href);
  if (result.ok) return;

  trackLinkOpenFailed({
    sessionId,
    linkId,
    page,
    href,
    status: result.status,
    track,
  });
}
