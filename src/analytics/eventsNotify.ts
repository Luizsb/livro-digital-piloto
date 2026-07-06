import { ANALYTICS_EVENTS_UPDATED } from './sessionTypes';

let notifyPending = false;

/**
 * Notifica assinantes após o turno síncrono atual.
 * Evita reentrância: listeners que chamam `track()` durante um `persistEvents`
 * não disparam efeitos em cascata no meio da gravação do evento.
 */
export function scheduleAnalyticsEventsUpdated(): void {
  if (notifyPending) return;
  notifyPending = true;
  queueMicrotask(() => {
    notifyPending = false;
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENTS_UPDATED));
  });
}
