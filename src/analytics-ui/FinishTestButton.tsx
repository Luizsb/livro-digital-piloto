import { useAnalytics } from '@analytics/SessionProvider';
import { finishTestFromButton } from '@analytics/finishSession';
import { exportSessionReport } from '@analytics/exportSessionReport';

interface FinishTestButtonProps {
  onFinished?: () => void;
  variant?: 'default' | 'prominent';
  autoExportReport?: boolean;
}

function FinishTestButton({
  onFinished,
  variant = 'default',
  autoExportReport = false,
}: FinishTestButtonProps) {
  const { track, sessionId, sessionStatus, refreshSessionStatus } = useAnalytics();

  if (sessionStatus === 'finished') {
    return null;
  }

  const handleFinish = () => {
    const result = finishTestFromButton(sessionId, track);
    refreshSessionStatus();
    if (result.emitted) {
      if (autoExportReport) {
        exportSessionReport(sessionId, track, { export_source: 'finish_button' });
      }
      onFinished?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleFinish}
      className={
        variant === 'prominent'
          ? 'rounded-full bg-[#80298F] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#6b2278]'
          : 'rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50'
      }
      title="Registrar finalização do capítulo e encerramento da sessão"
    >
      Finalizar teste
    </button>
  );
}

export default FinishTestButton;
