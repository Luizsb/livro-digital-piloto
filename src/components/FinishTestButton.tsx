import { useAnalytics } from '../analytics/AnalyticsProvider';
import { finishTestFromButton } from '../analytics/finishSession';

interface FinishTestButtonProps {
  onFinished?: () => void;
}

function FinishTestButton({ onFinished }: FinishTestButtonProps) {
  const { track, sessionId, sessionStatus, refreshSessionStatus } = useAnalytics();

  if (sessionStatus === 'finished') {
    return null;
  }

  const handleFinish = () => {
    const result = finishTestFromButton(sessionId, track);
    refreshSessionStatus();
    if (result.emitted) {
      onFinished?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleFinish}
      className="rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50"
      title="Registrar finalização do capítulo e encerramento da sessão"
    >
      Finalizar teste
    </button>
  );
}

export default FinishTestButton;
