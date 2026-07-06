import type { LinkTrackType } from './contentInteractionTypes';
import {
  trackResourceEngagementRecorded,
  trackResourceOpened,
} from './contentInteractionTracking';
import { isPageTrackingReady } from './ldBootstrap';

export interface ModalResourceSessionInput {
  linkId: string;
  page: number;
  type: LinkTrackType;
  href?: string;
}

interface OpenModalResourceSession extends ModalResourceSessionInput {
  instanceId: string;
  sessionId: string;
  openedAtMs: number;
  openedTracked: boolean;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const openSessions = new Map<string, OpenModalResourceSession>();

function computeDurationSeconds(openedAtMs: number): number {
  return Math.max(1, Math.round((Date.now() - openedAtMs) / 1000));
}

function tryEmitResourceOpened(instanceId: string): void {
  const session = openSessions.get(instanceId);
  if (!session || session.openedTracked) return;
  if (!isPageTrackingReady(session.sessionId)) return;

  // Marca antes de track — persistEvents dispara ANALYTICS_EVENTS_UPDATED de forma
  // síncrona e reentraria em flushPendingModalResourceOpened se openedTracked ainda fosse false.
  session.openedTracked = true;

  trackResourceOpened({
    linkId: session.linkId,
    page: session.page,
    type: session.type,
    href: session.href,
    track: session.track,
  });
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
  const existing = openSessions.get(instanceId);
  if (existing?.openedTracked) return;

  openSessions.set(instanceId, {
    ...input,
    instanceId,
    sessionId,
    openedAtMs: existing?.openedAtMs ?? Date.now(),
    openedTracked: existing?.openedTracked ?? false,
    track,
  });

  tryEmitResourceOpened(instanceId);
}

/** Emite `resource_opened` pendente após session_started + book_opened. */
export function flushPendingModalResourceOpened(sessionId: string): void {
  for (const instanceId of openSessions.keys()) {
    const session = openSessions.get(instanceId);
    if (session?.sessionId === sessionId) {
      tryEmitResourceOpened(instanceId);
    }
  }
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
