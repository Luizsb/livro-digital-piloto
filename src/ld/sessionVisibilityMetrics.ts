import { getSessionStartedAt } from './sessionDedup';

export interface SessionVisibilityMetrics {
  /** Tempo total da sessão (relógio de parede). */
  duration_seconds: number;
  /** Tempo com a aba do livro visível. */
  visible_time_seconds: number;
  /** Tempo fora da aba ou com a guia em segundo plano. */
  hidden_time_seconds: number;
  /** Proporção visível (0–1). */
  visible_time_ratio: number;
  /** Quantidade de mudanças de visibilidade (Page Visibility API). */
  visibility_change_count: number;
}

export function computeWallClockSessionSeconds(nowMs = Date.now()): number {
  const startedAt = getSessionStartedAt();
  if (!startedAt) return 0;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

export function buildVisibilityMetricsFromParts(
  durationSeconds: number,
  visibleSeconds: number,
  visibilityChangeCount: number,
): SessionVisibilityMetrics {
  const visible_time_seconds = Math.max(0, Math.min(visibleSeconds, durationSeconds));
  const hidden_time_seconds = Math.max(0, durationSeconds - visible_time_seconds);
  const visible_time_ratio =
    durationSeconds > 0
      ? Math.round((visible_time_seconds / durationSeconds) * 1000) / 1000
      : visible_time_seconds > 0
        ? 1
        : 0;

  return {
    duration_seconds: durationSeconds,
    visible_time_seconds,
    hidden_time_seconds,
    visible_time_ratio,
    visibility_change_count: Math.max(0, visibilityChangeCount),
  };
}
