import { ANALYTICS_CONFIG } from './ldConfig';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { getSessionStatus } from './sessionStatus';

const ACCUMULATED_MS_KEY = 'ld_analytics_session_idle_accumulated_ms';
const FROZEN_SECONDS_KEY = 'ld_analytics_session_idle_frozen_seconds';

type TrackFn = (eventName: string, metadata?: Record<string, unknown>) => void;

let listenersAttached = false;
let idleCheckTimer: ReturnType<typeof setTimeout> | null = null;
let isCurrentlyIdle = false;
let idleStartedAtMs: number | null = null;
let lastActivityMs = 0;
let trackFn: TrackFn | null = null;

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

function readFrozenSeconds(): number | null {
  try {
    const raw = sessionStorage.getItem(FROZEN_SECONDS_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeFrozenSeconds(seconds: number): void {
  try {
    sessionStorage.setItem(FROZEN_SECONDS_KEY, String(Math.max(0, seconds)));
  } catch {
    // ignore
  }
}

function clearIdleStorage(): void {
  try {
    sessionStorage.removeItem(ACCUMULATED_MS_KEY);
    sessionStorage.removeItem(FROZEN_SECONDS_KEY);
  } catch {
    // ignore
  }
}

function clearFrozenIdle(): void {
  try {
    sessionStorage.removeItem(FROZEN_SECONDS_KEY);
  } catch {
    // ignore
  }
}

function getIdleThresholdMs(): number {
  return ANALYTICS_CONFIG.idle.thresholdSeconds * 1000;
}

function clearIdleCheckTimer(): void {
  if (idleCheckTimer !== null) {
    clearTimeout(idleCheckTimer);
    idleCheckTimer = null;
  }
}

function finishIdlePeriod(nowMs = Date.now()): void {
  if (!isCurrentlyIdle || idleStartedAtMs === null) return;

  const durationMs = nowMs - idleStartedAtMs;
  writeAccumulatedMs(readAccumulatedMs() + durationMs);
  const durationSeconds = Math.max(0, Math.round(durationMs / 1000));
  trackFn?.(ANALYTICS_EVENT_NAMES.idleFinished, {
    idle_duration_seconds: durationSeconds,
  });

  isCurrentlyIdle = false;
  idleStartedAtMs = null;
}

function startIdlePeriod(nowMs = Date.now()): void {
  if (isCurrentlyIdle || !isDocumentVisible()) return;
  if (getSessionStatus() === 'finished') return;

  isCurrentlyIdle = true;
  idleStartedAtMs = nowMs;
  trackFn?.(ANALYTICS_EVENT_NAMES.idleStarted, {});
}

function scheduleIdleCheck(): void {
  clearIdleCheckTimer();
  if (getSessionStatus() === 'finished') return;
  if (!isDocumentVisible()) return;

  const thresholdMs = getIdleThresholdMs();
  const elapsed = Date.now() - lastActivityMs;
  const remaining = thresholdMs - elapsed;

  if (remaining <= 0) {
    startIdlePeriod();
    return;
  }

  idleCheckTimer = setTimeout(() => {
    if (Date.now() - lastActivityMs >= thresholdMs) {
      startIdlePeriod();
    }
  }, remaining);
}

function onUserActivity(nowMs = Date.now()): void {
  if (getSessionStatus() === 'finished') return;
  if (!isDocumentVisible()) return;

  if (isCurrentlyIdle) {
    finishIdlePeriod(nowMs);
  }

  lastActivityMs = nowMs;
  scheduleIdleCheck();
}

function onVisibilityChange(): void {
  if (document.hidden) {
    clearIdleCheckTimer();
    finishIdlePeriod();
    return;
  }

  lastActivityMs = Date.now();
  scheduleIdleCheck();
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

function attachIdleListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  for (const eventName of ACTIVITY_EVENTS) {
    window.addEventListener(eventName, onUserActivity, { passive: true });
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function detachIdleListeners(): void {
  if (!listenersAttached || typeof window === 'undefined') return;
  listenersAttached = false;

  for (const eventName of ACTIVITY_EVENTS) {
    window.removeEventListener(eventName, onUserActivity);
  }
  document.removeEventListener('visibilitychange', onVisibilityChange);
  clearIdleCheckTimer();
}

function getLiveIdleSeconds(nowMs = Date.now()): number {
  const accumulatedMs = readAccumulatedMs();
  const activeMs =
    isCurrentlyIdle && idleStartedAtMs !== null ? nowMs - idleStartedAtMs : 0;
  return Math.max(0, Math.floor((accumulatedMs + activeMs) / 1000));
}

/** Inicia rastreio de inatividade (nova sessão). */
export function startSessionIdleTracking(track: TrackFn): void {
  attachIdleListeners();
  trackFn = track;
  clearIdleStorage();
  isCurrentlyIdle = false;
  idleStartedAtMs = null;
  lastActivityMs = Date.now();
  scheduleIdleCheck();
}

/** Retoma após recarregar com sessão ativa. */
export function resumeSessionIdleTracking(track: TrackFn): void {
  attachIdleListeners();
  trackFn = track;
  clearFrozenIdle();
  isCurrentlyIdle = false;
  idleStartedAtMs = null;
  lastActivityMs = Date.now();
  scheduleIdleCheck();
}

export function stopSessionIdleTracking(): void {
  finishIdlePeriod();
  detachIdleListeners();
  trackFn = null;
}

export function resetSessionIdleTime(): void {
  finishIdlePeriod();
  clearIdleStorage();
  isCurrentlyIdle = false;
  idleStartedAtMs = null;
  lastActivityMs = Date.now();
}

/** Congela o tempo inativo ao encerrar a sessão. */
export function freezeSessionIdleTime(nowMs = Date.now()): number {
  const existing = readFrozenSeconds();
  if (existing !== null) return existing;

  finishIdlePeriod(nowMs);
  const seconds = getLiveIdleSeconds(nowMs);
  writeFrozenSeconds(seconds);
  return seconds;
}

export function getSessionIdleSeconds(nowMs = Date.now()): number | null {
  if (getSessionStatus() === 'finished') {
    const frozen = readFrozenSeconds();
    return frozen ?? 0;
  }
  return getLiveIdleSeconds(nowMs);
}
