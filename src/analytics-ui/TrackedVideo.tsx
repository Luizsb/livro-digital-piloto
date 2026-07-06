import { useEffect, useId, useRef, type SyntheticEvent, type VideoHTMLAttributes } from 'react';

import { useOptionalAnalytics } from '@analytics/SessionProvider';

import type { VideoAnalyticsIds } from '@analytics/videoTracking';

import {

  flushVideoSessionByInstance,

  registerOpenVideoSession,

  trackVideoCompleted,

  trackVideoStarted,

  unregisterOpenVideoSession,

  updateVideoPlaybackState,

} from '@analytics/videoTracking';



export interface TrackedVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {

  analytics: VideoAnalyticsIds;

}



function TrackedVideo({ analytics, onPlay, onEnded, onTimeUpdate, ...videoProps }: TrackedVideoProps) {

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



  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {

    const video = event.currentTarget;

    updateVideoPlaybackState(instanceId, video.currentTime, video.duration);

    onTimeUpdate?.(event);

  };



  const handleEnded = (event: SyntheticEvent<HTMLVideoElement>) => {

    const video = event.currentTarget;

    if (analyticsContext && !completedRef.current) {

      completedRef.current = true;

      const duration = Number.isFinite(video.duration) && video.duration > 0

        ? Math.round(video.duration)

        : Math.max(1, Math.round(video.currentTime));



      trackVideoCompleted({

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

      onTimeUpdate={handleTimeUpdate}

      onEnded={handleEnded}

      {...videoProps}

    />

  );

}



export default TrackedVideo;


