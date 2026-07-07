import { ANALYTICS_CONFIG } from './ldConfig';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { AnalyticsEvent } from './sessionTypes';

export type ReadingDepth =
  | 'very_quick'
  | 'quick_scan'
  | 'moderate_reading'
  | 'deep_reading';

export const READING_DEPTH_LABELS: Record<ReadingDepth, string> = {
  very_quick: 'Leitura rápida',
  quick_scan: 'Varredura rápida',
  moderate_reading: 'Leitura moderada',
  deep_reading: 'Leitura aprofundada',
};

export function getReadingDepthLabel(depth: ReadingDepth | string): string {
  return READING_DEPTH_LABELS[depth as ReadingDepth] ?? String(depth);
}

/** Classificação por tempo médio por página visualizada. */
export function classifyReadingDepth(avgSecondsPerViewedPage: number): ReadingDepth {
  const { veryQuickMaxSeconds, quickScanMaxSeconds, moderateMaxSeconds } =
    ANALYTICS_CONFIG.readingQuality;

  if (avgSecondsPerViewedPage <= veryQuickMaxSeconds) return 'very_quick';
  if (avgSecondsPerViewedPage <= quickScanMaxSeconds) return 'quick_scan';
  if (avgSecondsPerViewedPage <= moderateMaxSeconds) return 'moderate_reading';
  return 'deep_reading';
}

function roundAvg(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeReadingQuality(
  events: AnalyticsEvent[],
  durationSeconds: number,
  pagesViewedCount: number,
): {
  avg_seconds_per_viewed_page: number;
  avg_seconds_per_completed_page: number;
  reading_depth: ReadingDepth;
} {
  const completedDurations: number[] = [];

  for (const event of events) {
    if (event.event_name !== ANALYTICS_EVENT_NAMES.pageCompleted) continue;
    const duration = event.metadata?.duration_seconds;
    if (typeof duration === 'number' && duration > 0) {
      completedDurations.push(duration);
    }
  }

  const avg_seconds_per_viewed_page =
    pagesViewedCount > 0 ? roundAvg(durationSeconds / pagesViewedCount) : 0;

  const avg_seconds_per_completed_page =
    completedDurations.length > 0
      ? roundAvg(
          completedDurations.reduce((sum, value) => sum + value, 0) /
            completedDurations.length,
        )
      : 0;

  return {
    avg_seconds_per_viewed_page,
    avg_seconds_per_completed_page,
    reading_depth: classifyReadingDepth(avg_seconds_per_viewed_page),
  };
}
