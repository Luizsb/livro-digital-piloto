import type { EventSummary } from '@analytics/sessionSummary';
import { formatDuration } from './reportExtractors';

export interface VideoCredibilityAssessment {
  suspectedSkip: boolean;
  message: string | null;
  timelineToModalRatio: number | null;
}

/** Acima de ~2x contínuo no timeline vs. relógio do modal — indica seek ou velocidade extrema. */
const TIMELINE_TO_MODAL_SKIP_RATIO = 1.5;

const HIGH_PROGRESS_SKIP_RATIO = 1.3;
const HIGH_PROGRESS_THRESHOLD_PCT = 60;

type EscolaVideoSummary = Pick<
  EventSummary,
  | 'escola_digital_video_play_count'
  | 'escola_digital_engagement_total_seconds'
  | 'escola_digital_video_watch_total_seconds'
  | 'escola_digital_video_max_progress_percent'
>;

export function assessEscolaDigitalVideoCredibility(
  summary: EscolaVideoSummary,
): VideoCredibilityAssessment {
  const played = summary.escola_digital_video_play_count > 0;
  const modalSeconds = summary.escola_digital_engagement_total_seconds;
  const timelineSeconds = summary.escola_digital_video_watch_total_seconds;
  const progressPct = summary.escola_digital_video_max_progress_percent;

  if (!played || timelineSeconds <= 0) {
    return { suspectedSkip: false, message: null, timelineToModalRatio: null };
  }

  const modal = Math.max(0, modalSeconds);
  const ratio = modal > 0 ? timelineSeconds / modal : null;

  const suspectedSkip =
    (modal > 0 && timelineSeconds > modal * TIMELINE_TO_MODAL_SKIP_RATIO) ||
    (modal > 0 &&
      progressPct >= HIGH_PROGRESS_THRESHOLD_PCT &&
      timelineSeconds > modal * HIGH_PROGRESS_SKIP_RATIO) ||
    (modal === 0 && timelineSeconds >= 30);

  if (!suspectedSkip) {
    return { suspectedSkip: false, message: null, timelineToModalRatio: ratio };
  }

  const message =
    modal > 0
      ? `A posição máxima no vídeo (${formatDuration(timelineSeconds)}) é bem maior que o tempo no modal (${formatDuration(modal)}). Provável pulo no vídeo (scrubber) ou reprodução acelerada — o alcance de ${progressPct}% não reflete tempo real de visualização.`
      : `Há registro de ${formatDuration(timelineSeconds)} no timeline do vídeo (${progressPct}%) sem tempo correspondente no modal. Interpretar o progresso com cautela.`;

  return { suspectedSkip: true, message, timelineToModalRatio: ratio };
}
