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
  progressRecorded: boolean;
  maxProgressPercent: number;
  maxTimelineSeconds: number;
  playbackWallSeconds: number;
  seekCount: number;
  largestSkipSeconds: number;
  videoDurationSeconds: number | null;
  isPlaying: boolean;
  lastPlayingTickMs: number | null;
  pendingSeekFromSeconds: number | null;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const openVideoSessions = new Map<string, OpenVideoSession>();

const MIN_SEEK_JUMP_SECONDS = 2;
const MAX_WALL_CLOCK_TICK_SECONDS = 5;

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

function buildPlaybackMetadata(session: OpenVideoSession): Record<string, unknown> {
  const wallSeconds = Math.max(0, Math.round(session.playbackWallSeconds));
  const timelineSeconds = Math.max(0, session.maxTimelineSeconds);

  return {
    watch_duration_seconds: Math.max(1, timelineSeconds || wallSeconds || 1),
    timeline_max_seconds: Math.max(0, timelineSeconds),
    playback_wall_seconds: wallSeconds,
    seek_count: session.seekCount,
    largest_skip_seconds: session.largestSkipSeconds,
    max_progress_percent: session.maxProgressPercent,
  };
}

function tickPlaybackWallClock(session: OpenVideoSession, nowMs: number = Date.now()): void {
  if (!session.isPlaying || session.lastPlayingTickMs === null) return;

  const deltaSeconds = (nowMs - session.lastPlayingTickMs) / 1000;
  if (deltaSeconds > 0 && deltaSeconds <= MAX_WALL_CLOCK_TICK_SECONDS) {
    session.playbackWallSeconds += deltaSeconds;
  }
  session.lastPlayingTickMs = nowMs;
}

function pausePlaybackWallClock(session: OpenVideoSession): void {
  if (session.isPlaying) {
    tickPlaybackWallClock(session);
  }
  session.isPlaying = false;
  session.lastPlayingTickMs = null;
}

function startPlaybackWallClock(session: OpenVideoSession): void {
  session.isPlaying = true;
  session.lastPlayingTickMs = Date.now();
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
    progressRecorded: false,
    maxProgressPercent: 0,
    maxTimelineSeconds: 0,
    playbackWallSeconds: 0,
    seekCount: 0,
    largestSkipSeconds: 0,
    videoDurationSeconds: null,
    isPlaying: false,
    lastPlayingTickMs: null,
    pendingSeekFromSeconds: null,
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

  if (session.isPlaying) {
    tickPlaybackWallClock(session);
  }

  session.played = true;
  session.maxTimelineSeconds = Math.max(session.maxTimelineSeconds, Math.round(currentTime));
  session.maxProgressPercent = Math.max(
    session.maxProgressPercent,
    roundProgressPercent(currentTime, duration),
  );
  if (Number.isFinite(duration) && duration > 0) {
    session.videoDurationSeconds = Math.round(duration);
  }
}

export function markVideoPlaybackStarted(instanceId: string): void {
  const session = getOpenVideoSession(instanceId);
  if (!session) return;
  session.played = true;
  if (!session.isPlaying) {
    startPlaybackWallClock(session);
  }
}

export function markVideoPlaybackPaused(instanceId: string): void {
  const session = getOpenVideoSession(instanceId);
  if (!session) return;
  pausePlaybackWallClock(session);
}

export function markVideoSeeking(instanceId: string, currentTime: number): void {
  const session = getOpenVideoSession(instanceId);
  if (!session) return;

  if (session.isPlaying) {
    tickPlaybackWallClock(session);
  }
  session.pendingSeekFromSeconds = Math.round(currentTime);
}

export function markVideoSeeked(instanceId: string, currentTime: number): void {
  const session = getOpenVideoSession(instanceId);
  if (!session) return;

  const fromSeconds =
    session.pendingSeekFromSeconds ?? session.maxTimelineSeconds ?? Math.round(currentTime);
  const toSeconds = Math.round(currentTime);
  const jumpSeconds = Math.abs(toSeconds - fromSeconds);

  if (jumpSeconds >= MIN_SEEK_JUMP_SECONDS) {
    session.seekCount += 1;
    session.largestSkipSeconds = Math.max(session.largestSkipSeconds, jumpSeconds);
  }

  session.pendingSeekFromSeconds = null;
  session.maxTimelineSeconds = Math.max(session.maxTimelineSeconds, toSeconds);

  if (session.isPlaying) {
    session.lastPlayingTickMs = Date.now();
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
    startPlaybackWallClock(session);
  }

  const dedupeKey = `${ANALYTICS_EVENT_NAMES.videoStarted}_${ids.videoId}`;
  trackOncePerSession(sessionId, dedupeKey, () => {
    track(ANALYTICS_EVENT_NAMES.videoStarted, buildVideoMetadata(ids));
  });
}

export interface TrackVideoCompletedInput extends VideoAnalyticsIds {
  sessionId: string;
  instanceId: string;
  watchDurationSeconds: number;
  videoDurationSeconds: number;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackVideoCompleted({
  sessionId,
  instanceId,
  watchDurationSeconds,
  videoDurationSeconds,
  track,
  ...ids
}: TrackVideoCompletedInput): void {
  const session = getOpenVideoSession(instanceId);
  if (session) {
    pausePlaybackWallClock(session);
    session.completed = true;
    session.played = true;
    session.maxTimelineSeconds = Math.max(session.maxTimelineSeconds, watchDurationSeconds);
    session.maxProgressPercent = 100;
    session.videoDurationSeconds = videoDurationSeconds;
  }

  const dedupeKey = `${ANALYTICS_EVENT_NAMES.videoCompleted}_${ids.videoId}`;
  trackOncePerSession(sessionId, dedupeKey, () => {
    const playbackMeta = session ? buildPlaybackMetadata(session) : {};
    track(
      ANALYTICS_EVENT_NAMES.videoCompleted,
      buildVideoMetadata(ids, {
        watched_to_end: true,
        watch_duration_seconds: Math.max(1, watchDurationSeconds),
        video_duration_seconds: Math.max(1, videoDurationSeconds),
        max_progress_percent: 100,
        ...playbackMeta,
      }),
    );
  });
}

function flushVideoSessionProgress(session: OpenVideoSession): void {
  if (!session.played || session.completed || session.progressRecorded) return;

  pausePlaybackWallClock(session);
  session.progressRecorded = true;

  const metadata: Record<string, unknown> = {
    watched_to_end: false,
    ...buildPlaybackMetadata(session),
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
