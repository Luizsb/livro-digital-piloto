import type { AnalyticsEvent } from './sessionTypes';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import {
  isResourceEngagementEvent,
  isResourceOpenedEvent,
} from './resourceSignals';

export interface ContentInteractionsSummary {
  images_viewed_count: number;
  images_viewed_ids: string[];
  image_zoom_total: number;
  image_zoom_unique_count: number;
  resources_opened_total: number;
  resources_opened_unique_count: number;
  resources_engagement_total: number;
  other_resources_opened_total: number;
  other_resources_opened_unique_count: number;
  oda_opened_count: number;
  oda_engagement_total_seconds: number;
  escola_digital_opened_count: number;
  escola_digital_engagement_total_seconds: number;
  escola_digital_video_play_count: number;
  escola_digital_video_completed_count: number;
  escola_digital_video_watched_to_end: boolean;
  escola_digital_video_max_progress_percent: number;
  escola_digital_video_watch_total_seconds: number;
  escola_digital_video_playback_wall_seconds: number;
  escola_digital_video_seek_count: number;
  escola_digital_video_largest_skip_seconds: number;
}

export function buildContentInteractionsSummary(
  events: AnalyticsEvent[],
): ContentInteractionsSummary {
  const imagesViewed = new Set<string>();
  const imagesZoomed = new Set<string>();
  const resourcesOpened = new Set<string>();
  const otherResourcesOpened = new Set<string>();
  let imageZoomTotal = 0;
  let resourcesOpenedTotal = 0;
  let resourcesEngagementTotal = 0;
  let otherResourcesOpenedTotal = 0;
  let odaOpenedCount = 0;
  let odaEngagementSeconds = 0;
  let escolaOpenedCount = 0;
  let escolaEngagementSeconds = 0;
  let escolaVideoPlayCount = 0;
  let escolaVideoCompletedCount = 0;
  let escolaVideoWatchedToEnd = false;
  let escolaVideoMaxProgress = 0;
  let escolaVideoWatchMaxSeconds = 0;
  let escolaVideoPlaybackWallSeconds = 0;
  let escolaVideoSeekCount = 0;
  let escolaVideoLargestSkipSeconds = 0;

  const absorbEscolaVideoMetrics = (meta: Record<string, unknown>): void => {
    if (typeof meta.max_progress_percent === 'number') {
      escolaVideoMaxProgress = Math.max(escolaVideoMaxProgress, meta.max_progress_percent);
    }

    const timelineSeconds =
      typeof meta.timeline_max_seconds === 'number'
        ? meta.timeline_max_seconds
        : typeof meta.watch_duration_seconds === 'number'
          ? meta.watch_duration_seconds
          : null;
    if (timelineSeconds !== null) {
      escolaVideoWatchMaxSeconds = Math.max(escolaVideoWatchMaxSeconds, timelineSeconds);
    }

    if (typeof meta.playback_wall_seconds === 'number') {
      escolaVideoPlaybackWallSeconds = Math.max(
        escolaVideoPlaybackWallSeconds,
        meta.playback_wall_seconds,
      );
    }
    if (typeof meta.seek_count === 'number') {
      escolaVideoSeekCount = Math.max(escolaVideoSeekCount, meta.seek_count);
    }
    if (typeof meta.largest_skip_seconds === 'number') {
      escolaVideoLargestSkipSeconds = Math.max(
        escolaVideoLargestSkipSeconds,
        meta.largest_skip_seconds,
      );
    }
  };

  for (const event of events) {
    const meta = event.metadata ?? {};

    if (event.event_name === ANALYTICS_EVENT_NAMES.imageViewed && typeof meta.image_id === 'string') {
      imagesViewed.add(meta.image_id);
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.imageZoomed && typeof meta.image_id === 'string') {
      imageZoomTotal += 1;
      imagesZoomed.add(meta.image_id);
    }

    if (isResourceOpenedEvent(event) && typeof meta.link_id === 'string') {
      resourcesOpenedTotal += 1;
      resourcesOpened.add(meta.link_id);

      if (meta.type === 'oda_opened') {
        odaOpenedCount += 1;
      }
      if (meta.type === 'escola_digital_opened') {
        escolaOpenedCount += 1;
      }

      const isOdaOrEscola =
        meta.type === 'oda_opened' || meta.type === 'escola_digital_opened';

      if (!isOdaOrEscola) {
        otherResourcesOpenedTotal += 1;
        otherResourcesOpened.add(meta.link_id);
      }
    }

    if (isResourceEngagementEvent(event)) {
      resourcesEngagementTotal += 1;

      if (meta.type === 'oda_engagement' && typeof meta.duration_seconds === 'number') {
        odaEngagementSeconds += meta.duration_seconds;
      }
      if (
        meta.type === 'escola_digital_engagement' &&
        typeof meta.duration_seconds === 'number'
      ) {
        escolaEngagementSeconds += meta.duration_seconds;
      }
    }

    const isEscolaDigitalVideo =
      meta.type === 'escola_digital_video' ||
      meta.video_id === 'escola_digital_video' ||
      meta.link_id === 'escola_digital_video';

    if (
      event.event_name === ANALYTICS_EVENT_NAMES.videoStarted &&
      isEscolaDigitalVideo
    ) {
      escolaVideoPlayCount += 1;
    }

    if (
      event.event_name === ANALYTICS_EVENT_NAMES.videoCompleted &&
      isEscolaDigitalVideo
    ) {
      escolaVideoCompletedCount += 1;
      if (meta.watched_to_end === true) {
        escolaVideoWatchedToEnd = true;
      }
      absorbEscolaVideoMetrics(meta);
    }

    if (
      event.event_name === ANALYTICS_EVENT_NAMES.videoProgressRecorded &&
      isEscolaDigitalVideo
    ) {
      absorbEscolaVideoMetrics(meta);
    }
  }

  return {
    images_viewed_count: imagesViewed.size,
    images_viewed_ids: [...imagesViewed].sort(),
    image_zoom_total: imageZoomTotal,
    image_zoom_unique_count: imagesZoomed.size,
    resources_opened_total: resourcesOpenedTotal,
    resources_opened_unique_count: resourcesOpened.size,
    resources_engagement_total: resourcesEngagementTotal,
    other_resources_opened_total: otherResourcesOpenedTotal,
    other_resources_opened_unique_count: otherResourcesOpened.size,
    oda_opened_count: odaOpenedCount,
    oda_engagement_total_seconds: odaEngagementSeconds,
    escola_digital_opened_count: escolaOpenedCount,
    escola_digital_engagement_total_seconds: escolaEngagementSeconds,
    escola_digital_video_play_count: escolaVideoPlayCount,
    escola_digital_video_completed_count: escolaVideoCompletedCount,
    escola_digital_video_watched_to_end: escolaVideoWatchedToEnd,
    escola_digital_video_max_progress_percent: escolaVideoMaxProgress,
    escola_digital_video_watch_total_seconds: escolaVideoWatchMaxSeconds,
    escola_digital_video_playback_wall_seconds: escolaVideoPlaybackWallSeconds,
    escola_digital_video_seek_count: escolaVideoSeekCount,
    escola_digital_video_largest_skip_seconds: escolaVideoLargestSkipSeconds,
  };
}
