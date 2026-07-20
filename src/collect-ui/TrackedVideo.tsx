import { useEffect, useId, useRef, type SyntheticEvent, type VideoHTMLAttributes } from 'react';
import { useOptionalAnalytics } from '@analytics/SessionProvider';
import type { VideoAnalyticsIds } from '@analytics/videoTracking';
import {
  flushVideoSessionByInstance,
  markVideoPlaybackPaused,
  markVideoSeeked,
  markVideoSeeking,
  registerOpenVideoSession,
  trackVideoCompleted,
  trackVideoStarted,
  unregisterOpenVideoSession,
  updateVideoPlaybackState,
} from '@analytics/videoTracking';

export interface TrackedVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  analytics: VideoAnalyticsIds;
}

function TrackedVideo({
  analytics,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onSeeking,
  onSeeked,
  ...videoProps
}: TrackedVideoProps) {
  const analyticsContext = useOptionalAnalytics();
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceId = useId();
  const completedRef = useRef(false);

  useEffect(() => {
    if (!analyticsContext) return;

    registerOpenVideoSession(instanceId, analytics, analyticsContext.track);

    return () => {
      flushVideoSessionByInstance(instanceId);
      unregisterOpenVideoSession(instanceId);
    };
  }, [analytics, analyticsContext, instanceId]);

  const handlePlay = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (analyticsContext) {
      trackVideoStarted({
        sessionId: analyticsContext.sessionId,
        instanceId,
        track: analyticsContext.track,
        ...analytics,
      });
    }
    onPlay?.(event);
  };

  const handlePause = (event: SyntheticEvent<HTMLVideoElement>) => {
    markVideoPlaybackPaused(instanceId);
    onPause?.(event);
  };

  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    updateVideoPlaybackState(instanceId, video.currentTime, video.duration);
    onTimeUpdate?.(event);
  };

  const handleSeeking = (event: SyntheticEvent<HTMLVideoElement>) => {
    markVideoSeeking(instanceId, event.currentTarget.currentTime);
    onSeeking?.(event);
  };

  const handleSeeked = (event: SyntheticEvent<HTMLVideoElement>) => {
    markVideoSeeked(instanceId, event.currentTarget.currentTime);
    onSeeked?.(event);
  };

  const handleEnded = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    markVideoPlaybackPaused(instanceId);

    if (analyticsContext && !completedRef.current) {
      completedRef.current = true;
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration)
          : Math.max(1, Math.round(video.currentTime));

      trackVideoCompleted({
        sessionId: analyticsContext.sessionId,
        instanceId,
        watchDurationSeconds: Math.max(1, Math.round(video.currentTime)),
        videoDurationSeconds: duration,
        track: analyticsContext.track,
        ...analytics,
      });
    }

    onEnded?.(event);
  };

  return (
    <video
      ref={videoRef}
      onPlay={handlePlay}
      onPause={handlePause}
      onTimeUpdate={handleTimeUpdate}
      onSeeking={handleSeeking}
      onSeeked={handleSeeked}
      onEnded={handleEnded}
      {...videoProps}
    />
  );
}

export default TrackedVideo;
