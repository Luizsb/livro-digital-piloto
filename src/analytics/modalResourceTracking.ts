import type { LinkTrackType } from './contentInteractionTypes';
import {
  trackResourceEngagementRecorded,
  trackResourceOpened,
} from './contentInteractionTracking';
import { isPageTrackingReady } from './analyticsBootstrap';

export interface ModalResourceSessionInput {
  linkId: string;
  page: number;
  type: LinkTrackType;
  href?: string;
}

interface OpenModalResourceSession extends ModalResourceSessionInput {
  instanceId: string;
  openedAtMs: number;
}

const openSessions = new Map<string, OpenModalResourceSession>();

function computeDurationSeconds(openedAtMs: number): number {
  return Math.max(1, Math.round((Date.now() - openedAtMs) / 1000));
}

export interface RegisterModalResourceSessionInput extends ModalResourceSessionInput {
  instanceId: string;
  sessionId: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

/** Abre sessão do modal e dispara `resource_opened` quando o tracking estiver pronto. */
export function registerModalResourceSession({
  instanceId,
  sessionId,
  track,
  ...input
}: RegisterModalResourceSessionInput): void {
  openSessions.set(instanceId, {
    ...input,
    instanceId,
    openedAtMs: Date.now(),
  });

  if (!isPageTrackingReady(sessionId)) return;

  trackResourceOpened({
    linkId: input.linkId,
    page: input.page,
    type: input.type,
    href: input.href,
    track,
  });
}

export function endModalResourceSession(
  instanceId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  const session = openSessions.get(instanceId);
  if (!session) return false;

  openSessions.delete(instanceId);

  trackResourceEngagementRecorded({
    linkId: session.linkId,
    page: session.page,
    openType: session.type,
    durationSeconds: computeDurationSeconds(session.openedAtMs),
    track,
  });

  return true;
}

/** Garante tempo registrado se o modal ainda estiver aberto ao encerrar a sessão. */
export function flushAllOpenModalResourceSessions(
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): void {
  for (const instanceId of [...openSessions.keys()]) {
    endModalResourceSession(instanceId, track);
  }
}
