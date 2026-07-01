import { useState } from 'react';
import { useAnalytics } from '../analytics/AnalyticsProvider';
import { finishTestFromButton } from '../analytics/finishSession';
import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import { useStoredEvents } from '../analytics/useStoredEvents';

function FinishTestButton() {
  const { track, sessionId } = useAnalytics();
  const events = useStoredEvents();
  const [status, setStatus] = useState<string | null>(null);
  const alreadyFinished = events.some(
    (event) =>
      event.session_id === sessionId &&
      event.event_name === ANALYTICS_EVENT_NAMES.sessionFinished,
  );

  const handleFinish = () => {
    const result = finishTestFromButton(sessionId, track);
    if (result.emitted && result.chapterCompleted) {
      setStatus('Capítulo concluído conforme critério');
    } else if (result.emitted) {
      setStatus('Capítulo finalizado — critério mínimo não atingido');
    } else {
      setStatus('Sessão já havia sido finalizada');
    }
    window.setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleFinish}
        disabled={alreadyFinished}
        className="rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        title="Registrar finalização do capítulo e encerramento da sessão"
      >
        Finalizar teste
      </button>
      {status ? (
        <span className="rounded-md bg-white px-3 py-1 text-xs text-slate-700 shadow">
          {status}
        </span>
      ) : null}
    </div>
  );
}

export default FinishTestButton;
