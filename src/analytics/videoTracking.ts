import { isPageTrackingReady } from './ldBootstrap';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { trackOncePerSession } from './sessionDedup';
import type { VideoTrackType } from './videoInteractionTypes';

export interface VideoAnalyticsIds {
  linkId: string;
  page: number;
  videoId: string;
  type: VideoTrackType;
}

interface OpenVideoSession extends VideoAnalyticsIds {
  instanceId: string;
  played: boolean;
  completed: boolean;
  maxProgressPercent: number;
  maxWatchSeconds: number;
  videoDurationSeconds: number | null;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const openVideoSessions = new Map<string, OpenVideoSession>();

function buildVideoMetadata(
  ids: VideoAnalyticsIds,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    link_id: ids.linkId,
    page: ids.page,
    video_id: ids.videoId,
    type: ids.type,
    ...extra,
  };
}

function roundProgressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(100, Math.round((currentTime / duration) * 100));
}

export function registerOpenVideoSession(
  instanceId: string,
  ids: VideoAnalyticsIds,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): void {
  openVideoSessions.set(instanceId, {
    ...ids,
    instanceId,
    played: false,
    completed: false,
    maxProgressPercent: 0,
    maxWatchSeconds: 0,
    videoDurationSeconds: null,
    track,
  });
}

export function unregisterOpenVideoSession(instanceId: string): void {
  openVideoSessions.delete(instanceId);
}

function getOpenVideoSession(instanceId: string): OpenVideoSession | undefined {
  return openVideoSessions.get(instanceId);
}

export function updateVideoPlaybackState(
  instanceId: string,
  currentTime: number,
  duration: number,
): void {
  const session = getOpenVideoSession(instanceId);
  if (!session) return;

  session.played = true;
  session.maxWatchSeconds = Math.max(session.maxWatchSeconds, Math.round(currentTime));
  session.maxProgressPercent = Math.max(
    session.maxProgressPercent,
    roundProgressPercent(currentTime, duration),
  );
  if (Number.isFinite(duration) && duration > 0) {
    session.videoDurationSeconds = Math.round(duration);
  }
}

export interface TrackVideoStartedInput extends VideoAnalyticsIds {
  sessionId: string;
  instanceId: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

/** Primeiro play intencional do vídeo na sessão (uma vez por `video_id`). */
export function trackVideoStarted({
  sessionId,
  instanceId,
  track,
  ...ids
}: TrackVideoStartedInput): void {
  if (!isPageTrackingReady(sessionId)) return;

  const session = getOpenVideoSession(instanceId);
  if (session) {
    session.played = true;
  }

  const dedupeKey = `${ANALYTICS_EVENT_NAMES.videoStarted}_${ids.videoId}`;
  trackOncePerSession(sessionId, dedupeKey, () => {
    track(ANALYTICS_EVENT_NAMES.videoStarted, buildVideoMetadata(ids));
  });
}

export interface TrackVideoCompletedInput extends VideoAnalyticsIds {
  instanceId: string;
  watchDurationSeconds: number;
  videoDurationSeconds: number;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackVideoCompleted({
  instanceId,
  watchDurationSeconds,
  videoDurationSeconds,
  track,
  ...ids
}: TrackVideoCompletedInput): void {
  const session = getOpenVideoSession(instanceId);
  if (session) {
    session.completed = true;
    session.played = true;
    session.maxWatchSeconds = Math.max(session.maxWatchSeconds, watchDurationSeconds);
    session.maxProgressPercent = 100;
    session.videoDurationSeconds = videoDurationSeconds;
  }

  track(
    ANALYTICS_EVENT_NAMES.videoCompleted,
    buildVideoMetadata(ids, {
      watched_to_end: true,
      watch_duration_seconds: Math.max(1, watchDurationSeconds),
      video_duration_seconds: Math.max(1, videoDurationSeconds),
      max_progress_percent: 100,
    }),
  );
}

function flushVideoSessionProgress(session: OpenVideoSession): void {
  if (!session.played || session.completed) return;

  const metadata: Record<string, unknown> = {
    watched_to_end: false,
    watch_duration_seconds: Math.max(1, session.maxWatchSeconds),
    max_progress_percent: session.maxProgressPercent,
  };

  if (session.videoDurationSeconds !== null) {
    metadata.video_duration_seconds = session.videoDurationSeconds;
  }

  session.track(
    ANALYTICS_EVENT_NAMES.videoProgressRecorded,
    buildVideoMetadata(session, metadata),
  );
}

export function flushVideoSessionByInstance(instanceId: string): void {
  const session = openVideoSessions.get(instanceId);
  if (!session) return;
  flushVideoSessionProgress(session);
}

/** Fecha reproduções em andamento antes de encerrar capítulo/sessão. */
export function flushAllOpenVideoSessions(): void {
  for (const session of openVideoSessions.values()) {
    flushVideoSessionProgress(session);
  }
  openVideoSessions.clear();
}
