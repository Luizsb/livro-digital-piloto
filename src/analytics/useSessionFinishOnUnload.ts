import { useEffect } from 'react';
import { useOptionalAnalytics } from './AnalyticsProvider';
import { finishSessionOnUnload } from './finishSession';

/** Registra session_finished ao fechar ou sair da aba (no máximo uma vez por sessão). */
export function useSessionFinishOnUnload(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics) return;

    const handlePageHide = () => {
      finishSessionOnUnload(analytics.sessionId, analytics.track);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [analytics]);
}
