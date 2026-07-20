import type { EventSummary } from '@analytics/sessionSummary';
import { formatDuration } from './reportExtractors';

export interface VideoCredibilityAssessment {
  suspectedSkip: boolean;
  message: string | null;
  timelineToModalRatio: number | null;
  usedPlaybackWall: boolean;
}

const TIMELINE_TO_MODAL_SKIP_RATIO = 1.5;
const PLAYBACK_TO_MODAL_SKIP_RATIO = 1.25;
const HIGH_PROGRESS_SKIP_RATIO = 1.3;
const HIGH_PROGRESS_THRESHOLD_PCT = 60;

type EscolaVideoSummary = Pick<
  EventSummary,
  | 'escola_digital_video_play_count'
  | 'escola_digital_engagement_total_seconds'
  | 'escola_digital_video_watch_total_seconds'
  | 'escola_digital_video_max_progress_percent'
  | 'escola_digital_video_playback_wall_seconds'
  | 'escola_digital_video_seek_count'
  | 'escola_digital_video_largest_skip_seconds'
>;

export function assessEscolaDigitalVideoCredibility(
  summary: EscolaVideoSummary,
): VideoCredibilityAssessment {
  const played = summary.escola_digital_video_play_count > 0;
  const modalSeconds = summary.escola_digital_engagement_total_seconds;
  const timelineSeconds = summary.escola_digital_video_watch_total_seconds;
  const playbackWallSeconds = summary.escola_digital_video_playback_wall_seconds ?? 0;
  const progressPct = summary.escola_digital_video_max_progress_percent;
  const seekCount = summary.escola_digital_video_seek_count ?? 0;
  const largestSkip = summary.escola_digital_video_largest_skip_seconds ?? 0;

  if (!played || timelineSeconds <= 0) {
    return {
      suspectedSkip: false,
      message: null,
      timelineToModalRatio: null,
      usedPlaybackWall: false,
    };
  }

  const modal = Math.max(0, modalSeconds);
  const hasPlaybackWall = playbackWallSeconds > 0;
  const referenceSeconds = hasPlaybackWall ? playbackWallSeconds : timelineSeconds;
  const ratio = modal > 0 ? referenceSeconds / modal : null;

  const timelineInflated =
    modal > 0 && timelineSeconds > modal * TIMELINE_TO_MODAL_SKIP_RATIO;
  const playbackInflated =
    hasPlaybackWall &&
    modal > 0 &&
    playbackWallSeconds > 0 &&
    timelineSeconds > playbackWallSeconds * TIMELINE_TO_MODAL_SKIP_RATIO;
  const progressWithoutTime =
    modal > 0 &&
    progressPct >= HIGH_PROGRESS_THRESHOLD_PCT &&
    (hasPlaybackWall
      ? playbackWallSeconds < modal * 0.5 && timelineSeconds > modal * HIGH_PROGRESS_SKIP_RATIO
      : timelineSeconds > modal * HIGH_PROGRESS_SKIP_RATIO);
  const explicitSeek = seekCount > 0 || largestSkip >= 5;

  const suspectedSkip =
    timelineInflated ||
    playbackInflated ||
    progressWithoutTime ||
    explicitSeek ||
    (modal === 0 && timelineSeconds >= 30);

  if (!suspectedSkip) {
    return {
      suspectedSkip: false,
      message: null,
      timelineToModalRatio: ratio,
      usedPlaybackWall: hasPlaybackWall,
    };
  }

  const parts: string[] = [];

  if (hasPlaybackWall) {
    parts.push(
      `Tempo real de reprodução: ${formatDuration(playbackWallSeconds)}; posição máxima no arquivo: ${formatDuration(timelineSeconds)}; tempo no modal: ${formatDuration(modal)}.`,
    );
  } else {
    parts.push(
      `Posição máxima no vídeo (${formatDuration(timelineSeconds)}) vs tempo no modal (${formatDuration(modal)}).`,
    );
  }

  if (seekCount > 0 || largestSkip > 0) {
    parts.push(
      `Detectados ${seekCount} pulo(s) no scrubber${largestSkip > 0 ? ` (maior salto: ${formatDuration(largestSkip)})` : ''}.`,
    );
  }

  parts.push(
    `O alcance de ${progressPct}% no arquivo pode não refletir visualização contínua.`,
  );

  return {
    suspectedSkip: true,
    message: parts.join(' '),
    timelineToModalRatio: ratio,
    usedPlaybackWall: hasPlaybackWall,
  };
}
