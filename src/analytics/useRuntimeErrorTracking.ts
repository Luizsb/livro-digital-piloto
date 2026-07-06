import { useEffect } from 'react';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { useOptionalAnalytics } from './SessionProvider';
import { isSessionCollecting } from './sessionStatus';
import { trackOncePerSession } from './sessionDedup';

const MAX_MESSAGE_LENGTH = 200;
const MAX_SRC_LENGTH = 300;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function normalizeSrc(src: string): string {
  try {
    const url = new URL(src, window.location.origin);
    return truncate(url.pathname + url.search, MAX_SRC_LENGTH);
  } catch {
    return truncate(src, MAX_SRC_LENGTH);
  }
}

function assetTypeFromTarget(target: EventTarget | null): string | null {
  if (target instanceof HTMLScriptElement) return 'script';
  if (target instanceof HTMLLinkElement) return 'stylesheet';
  if (target instanceof HTMLImageElement) return 'image';
  return null;
}

function srcFromTarget(target: EventTarget | null): string | null {
  if (target instanceof HTMLScriptElement) return target.src || null;
  if (target instanceof HTMLLinkElement) return target.href || null;
  if (target instanceof HTMLImageElement) return target.currentSrc || target.src || null;
  return null;
}

/** Erros de script e falhas de carregamento de assets observados durante a sessão. */
export function useRuntimeErrorTracking(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics?.participantId) return;

    const { sessionId, track } = analytics;

    const canTrack = () => isSessionCollecting(sessionId);

    const onError = (event: ErrorEvent) => {
      if (!canTrack()) return;

      const assetType = assetTypeFromTarget(event.target);
      const assetSrc = srcFromTarget(event.target);

      if (assetType && assetSrc) {
        const src = normalizeSrc(assetSrc);
        trackOncePerSession(sessionId, `${ANALYTICS_EVENT_NAMES.assetLoadError}_${assetType}_${src}`, () => {
          track(ANALYTICS_EVENT_NAMES.assetLoadError, {
            asset_type: assetType,
            src,
          });
        });
        return;
      }

      const message = truncate(event.message || 'Erro de script', MAX_MESSAGE_LENGTH);
      const source = event.filename ? normalizeSrc(event.filename) : undefined;
      const dedupeKey = `${ANALYTICS_EVENT_NAMES.runtimeError}_${message}_${source ?? ''}`;

      trackOncePerSession(sessionId, dedupeKey, () => {
        track(ANALYTICS_EVENT_NAMES.runtimeError, {
          error_message: message,
          source,
          line: typeof event.lineno === 'number' ? event.lineno : undefined,
          column: typeof event.colno === 'number' ? event.colno : undefined,
        });
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!canTrack()) return;

      const reason = event.reason;
      const message = truncate(
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Promise rejeitada',
        MAX_MESSAGE_LENGTH,
      );

      trackOncePerSession(sessionId, `${ANALYTICS_EVENT_NAMES.runtimeError}_promise_${message}`, () => {
        track(ANALYTICS_EVENT_NAMES.runtimeError, {
          error_message: message,
          error_kind: 'unhandled_rejection',
        });
      });
    };

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [analytics]);
}
