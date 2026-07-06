import { ANALYTICS_STORAGE_KEYS } from './sessionTypes';
import { scheduleAnalyticsEventsUpdated } from './eventsNotify';
import { resetPageReadingState } from './pageReadingState';
import { resetSessionVisibleTime } from './sessionVisibleTime';
import { resetSessionIdleTime } from './sessionIdleTime';

/** Incrementar quando a política de armazenamento mudar (força reset uma vez por aba). */
const STORAGE_VERSION = '4';
const VERSION_KEY = 'ld_analytics_storage_version';
const DEV_SESSION_KEY = 'ld_analytics_dev_session';

let bootstrapped = false;

/** Remove chaves legadas que persistiam entre visitas (localStorage). */
export function cleanupLegacyLocalStorage(): void {
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEYS.events);
    localStorage.removeItem(ANALYTICS_STORAGE_KEYS.participantId);
  } catch {
    // ignore
  }
}

/** Limpa participante, eventos, sessão e flags de deduplicação da aba atual. */
export function resetLdStorage(): void {
  cleanupLegacyLocalStorage();

  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || key === VERSION_KEY) continue;
      if (key.startsWith('ld_analytics') || key.includes('_tracked_')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
    resetPageReadingState();
    resetSessionVisibleTime();
    resetSessionIdleTime();
    scheduleAnalyticsEventsUpdated();
  } catch {
    // ignore
  }
}

function stripResetParamsFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('reset') && !params.has('nova_sessao')) return;

  params.delete('reset');
  params.delete('nova_sessao');
  const qs = params.toString();
  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
  );
}

/**
 * Executa uma vez por carregamento da página:
 * - `?reset=1` ou `?nova_sessao=1` limpa tudo
 * - remove dados legados do localStorage
 */
export function bootstrapLdStorage(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  if (import.meta.env.DEV) {
    const storedDevSession = sessionStorage.getItem(DEV_SESSION_KEY);
    if (storedDevSession !== __DEV_SESSION_ID__) {
      resetLdStorage();
      sessionStorage.setItem(DEV_SESSION_KEY, __DEV_SESSION_ID__);
      sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      cleanupLegacyLocalStorage();
      return;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const resetRequested = params.has('reset') || params.has('nova_sessao');

  let hadLegacyLocal = false;
  try {
    hadLegacyLocal =
      localStorage.getItem(ANALYTICS_STORAGE_KEYS.events) !== null ||
      localStorage.getItem(ANALYTICS_STORAGE_KEYS.participantId) !== null;
  } catch {
    // ignore
  }

  const storedVersion = sessionStorage.getItem(VERSION_KEY);
  const needsVersionReset = storedVersion !== STORAGE_VERSION;

  if (resetRequested || needsVersionReset || hadLegacyLocal) {
    resetLdStorage();
    sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    cleanupLegacyLocalStorage();
    stripResetParamsFromUrl();
    return;
  }

  cleanupLegacyLocalStorage();
}

export function reloadForNewSession(): void {
  resetLdStorage();
  sessionStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  window.location.reload();
}
