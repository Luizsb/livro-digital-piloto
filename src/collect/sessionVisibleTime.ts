import { shiftPageReadingStartTimes } from './pageReadingState';
import { getSessionStartedAt } from './sessionDedup';
import { getSessionFinishedAt, getSessionStatus } from './sessionStatus';
import {
  buildVisibilityMetricsFromParts,
  computeWallClockSessionSeconds,
  type SessionVisibilityMetrics,
} from './sessionVisibilityMetrics';

const ACCUMULATED_MS_KEY = 'ld_analytics_session_visible_accumulated_ms';
const FROZEN_VISIBLE_SECONDS_KEY = 'ld_analytics_session_visible_frozen_seconds';
const FROZEN_METRICS_KEY = 'ld_analytics_session_visibility_frozen_metrics';
const VISIBILITY_CHANGE_COUNT_KEY = 'ld_analytics_session_visibility_change_count';
const TAB_HIDDEN_COUNT_KEY = 'ld_analytics_session_tab_hidden_count';
const TAB_FOCUS_RETURN_COUNT_KEY = 'ld_analytics_session_tab_focus_return_count';

let visibleSinceMs: number | null = null;
let hiddenStartedAtMs: number | null = null;
let listenersAttached = false;

function isDocumentVisible(): boolean {
  return typeof document !== 'undefined' && !document.hidden;
}

function readAccumulatedMs(): number {
  try {
    const raw = sessionStorage.getItem(ACCUMULATED_MS_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeAccumulatedMs(ms: number): void {
  try {
    sessionStorage.setItem(ACCUMULATED_MS_KEY, String(Math.max(0, Math.round(ms))));
  } catch {
    // ignore
  }
}

function readVisibilityChangeCount(): number {
  try {
    const raw = sessionStorage.getItem(VISIBILITY_CHANGE_COUNT_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeVisibilityChangeCount(count: number): void {
  try {
    sessionStorage.setItem(VISIBILITY_CHANGE_COUNT_KEY, String(Math.max(0, count)));
  } catch {
    // ignore
  }
}

function readTabHiddenCount(): number {
  try {
    const raw = sessionStorage.getItem(TAB_HIDDEN_COUNT_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeTabHiddenCount(count: number): void {
  try {
    sessionStorage.setItem(TAB_HIDDEN_COUNT_KEY, String(Math.max(0, count)));
  } catch {
    // ignore
  }
}

function readTabFocusReturnCount(): number {
  try {
    const raw = sessionStorage.getItem(TAB_FOCUS_RETURN_COUNT_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeTabFocusReturnCount(count: number): void {
  try {
    sessionStorage.setItem(TAB_FOCUS_RETURN_COUNT_KEY, String(Math.max(0, count)));
  } catch {
    // ignore
  }
}

function readFrozenVisibleSeconds(): number | null {
  try {
    const raw = sessionStorage.getItem(FROZEN_VISIBLE_SECONDS_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeFrozenVisibleSeconds(seconds: number): void {
  try {
    sessionStorage.setItem(FROZEN_VISIBLE_SECONDS_KEY, String(Math.max(0, seconds)));
  } catch {
    // ignore
  }
}

function readFrozenMetrics(): SessionVisibilityMetrics | null {
  try {
    const raw = sessionStorage.getItem(FROZEN_METRICS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionVisibilityMetrics;
    if (
      typeof parsed.duration_seconds === 'number' &&
      typeof parsed.visible_time_seconds === 'number' &&
      typeof parsed.hidden_time_seconds === 'number' &&
      typeof parsed.visible_time_ratio === 'number' &&
      typeof parsed.visibility_change_count === 'number' &&
      typeof parsed.tab_hidden_count === 'number' &&
      typeof parsed.tab_focus_return_count === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeFrozenMetrics(metrics: SessionVisibilityMetrics): void {
  try {
    sessionStorage.setItem(FROZEN_METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // ignore
  }
}

function pauseVisibleClock(nowMs = Date.now()): void {
  if (visibleSinceMs === null) return;
  writeAccumulatedMs(readAccumulatedMs() + (nowMs - visibleSinceMs));
  visibleSinceMs = null;
}

function resumeVisibleClock(nowMs = Date.now()): void {
  if (visibleSinceMs !== null || !isDocumentVisible()) return;
  visibleSinceMs = nowMs;
}

function getLiveVisibleSeconds(nowMs = Date.now()): number {
  const accumulatedMs = readAccumulatedMs();
  const activeMs = visibleSinceMs !== null ? nowMs - visibleSinceMs : 0;
  return Math.max(0, Math.floor((accumulatedMs + activeMs) / 1000));
}

function handleVisibilityChange(): void {
  const nowMs = Date.now();
  writeVisibilityChangeCount(readVisibilityChangeCount() + 1);

  if (document.hidden) {
    writeTabHiddenCount(readTabHiddenCount() + 1);
    hiddenStartedAtMs = nowMs;
    pauseVisibleClock(nowMs);
    return;
  }

  if (hiddenStartedAtMs !== null) {
    writeTabFocusReturnCount(readTabFocusReturnCount() + 1);
    shiftPageReadingStartTimes(nowMs - hiddenStartedAtMs);
    hiddenStartedAtMs = null;
  }

  resumeVisibleClock(nowMs);
}

function attachVisibilityListeners(): void {
  if (listenersAttached || typeof document === 'undefined') return;
  listenersAttached = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/** Reinicia o relógio em memória quando a aba está visível mas o tick parou (ex.: HMR). */
function ensureActiveVisibleClock(nowMs = Date.now()): void {
  if (typeof document === 'undefined') return;
  attachVisibilityListeners();
  if (getSessionStatus() === 'finished') return;
  if (!isDocumentVisible()) return;
  if (visibleSinceMs === null) {
    visibleSinceMs = nowMs;
  }
}

function clearFrozenVisibilityMetrics(): void {
  try {
    sessionStorage.removeItem(FROZEN_VISIBLE_SECONDS_KEY);
    sessionStorage.removeItem(FROZEN_METRICS_KEY);
  } catch {
    // ignore
  }
}

function clearVisibilityStorage(): void {
  try {
    sessionStorage.removeItem(ACCUMULATED_MS_KEY);
    sessionStorage.removeItem(FROZEN_VISIBLE_SECONDS_KEY);
    sessionStorage.removeItem(FROZEN_METRICS_KEY);
    sessionStorage.removeItem(VISIBILITY_CHANGE_COUNT_KEY);
    sessionStorage.removeItem(TAB_HIDDEN_COUNT_KEY);
    sessionStorage.removeItem(TAB_FOCUS_RETURN_COUNT_KEY);
  } catch {
    // ignore
  }
}

/** Zera o acumulado (nova sessão) e inicia o rastreio de tempo visível. */
export function startSessionVisibleTimeTracking(): void {
  attachVisibilityListeners();
  clearVisibilityStorage();
  hiddenStartedAtMs = document.hidden ? Date.now() : null;
  visibleSinceMs = isDocumentVisible() ? Date.now() : null;
}

/** Retoma o rastreio após recarregar a página com sessão ativa. */
export function resumeSessionVisibleTimeTracking(): void {
  attachVisibilityListeners();
  clearFrozenVisibilityMetrics();
  hiddenStartedAtMs = document.hidden ? Date.now() : null;
  ensureActiveVisibleClock();
}

export function resetSessionVisibleTime(): void {
  pauseVisibleClock();
  clearVisibilityStorage();
  hiddenStartedAtMs = document.hidden ? Date.now() : null;
  visibleSinceMs = isDocumentVisible() ? Date.now() : null;
}

/** Congela o tempo visível ao encerrar a sessão. */
export function freezeSessionVisibleTime(nowMs = Date.now()): number {
  const existing = readFrozenVisibleSeconds();
  if (existing !== null) return existing;

  pauseVisibleClock(nowMs);
  const seconds = getLiveVisibleSeconds(nowMs);
  writeFrozenVisibleSeconds(seconds);
  return seconds;
}

/** Métricas completas de visibilidade ao encerrar a sessão. */
export function freezeSessionVisibilityMetrics(nowMs = Date.now()): SessionVisibilityMetrics {
  const existing = readFrozenMetrics();
  if (existing) return existing;

  const visibleSeconds = freezeSessionVisibleTime(nowMs);
  const durationSeconds = computeWallClockSessionSeconds(nowMs);
  const metrics = buildVisibilityMetricsFromParts(
    durationSeconds,
    visibleSeconds,
    readVisibilityChangeCount(),
    readTabHiddenCount(),
    readTabFocusReturnCount(),
  );
  writeFrozenMetrics(metrics);
  return metrics;
}

export function getFrozenSessionVisibilityMetrics(): SessionVisibilityMetrics | null {
  return readFrozenMetrics();
}

/** Segundos com a aba do livro visível desde session_started. */
export function getSessionVisibleSeconds(nowMs = Date.now()): number | null {
  const startedAt = getSessionStartedAt();
  if (!startedAt) return null;

  if (getSessionStatus() === 'finished') {
    const frozen = readFrozenMetrics();
    if (frozen) return frozen.visible_time_seconds;

    const frozenVisible = readFrozenVisibleSeconds();
    if (frozenVisible !== null) return frozenVisible;

    const finishedAt = getSessionFinishedAt();
    if (finishedAt) {
      const startMs = Date.parse(startedAt);
      const endMs = Date.parse(finishedAt);
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        return Math.max(0, Math.floor((endMs - startMs) / 1000));
      }
    }
    return 0;
  }

  ensureActiveVisibleClock(nowMs);
  return getLiveVisibleSeconds(nowMs);
}

export function isSessionVisibleTimePaused(): boolean {
  return getSessionStatus() !== 'finished' && !isDocumentVisible();
}

export interface LiveVisibilityStats {
  duration_seconds: number;
  visible_time_seconds: number;
  hidden_time_seconds: number;
  tab_hidden_count: number;
  tab_focus_return_count: number;
  is_paused: boolean;
}

/** Métricas de foco da aba em tempo real (antes de finalizar a sessão). */
export function getLiveVisibilityStats(nowMs = Date.now()): LiveVisibilityStats | null {
  const startedAt = getSessionStartedAt();
  if (!startedAt) return null;

  if (getSessionStatus() === 'finished') {
    const frozen = readFrozenMetrics();
    if (frozen) {
      return {
        duration_seconds: frozen.duration_seconds,
        visible_time_seconds: frozen.visible_time_seconds,
        hidden_time_seconds: frozen.hidden_time_seconds,
        tab_hidden_count: frozen.tab_hidden_count,
        tab_focus_return_count: frozen.tab_focus_return_count,
        is_paused: false,
      };
    }
    return null;
  }

  ensureActiveVisibleClock(nowMs);
  const durationSeconds = computeWallClockSessionSeconds(nowMs);
  const visibleSeconds = getLiveVisibleSeconds(nowMs);
  const hiddenSeconds = Math.max(0, durationSeconds - visibleSeconds);

  return {
    duration_seconds: durationSeconds,
    visible_time_seconds: visibleSeconds,
    hidden_time_seconds: hiddenSeconds,
    tab_hidden_count: readTabHiddenCount(),
    tab_focus_return_count: readTabFocusReturnCount(),
    is_paused: !isDocumentVisible(),
  };
}
