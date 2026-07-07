import { useEffect } from 'react';
import { useOptionalAnalytics } from './SessionProvider';
import { finishSessionOnUnload } from './finishSession';
import { getSessionStatus } from './sessionStatus';

const RELOAD_INTENT_KEY = 'ld_analytics_reload_intent';

function markReloadIntent(): void {
  try {
    sessionStorage.setItem(RELOAD_INTENT_KEY, '1');
  } catch {
    // ignore
  }
}

function consumeReloadIntent(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_INTENT_KEY) !== '1') return false;
    sessionStorage.removeItem(RELOAD_INTENT_KEY);
    return true;
  } catch {
    return false;
  }
}

function isReloadShortcut(event: KeyboardEvent): boolean {
  if (event.key === 'F5') return true;
  if (event.key.toLowerCase() !== 'r') return false;
  return event.ctrlKey || event.metaKey;
}

/** Registra session_finished ao fechar ou sair da aba — não ao recarregar (F5). */
export function useSessionFinishOnUnload(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReloadShortcut(event)) {
        markReloadIntent();
      }
    };

    const handlePageHide = () => {
      if (getSessionStatus() === 'finished') return;
      if (consumeReloadIntent()) return;
      finishSessionOnUnload(analytics.sessionId, analytics.track);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [analytics]);
}
