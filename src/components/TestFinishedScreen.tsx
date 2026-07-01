import { useState } from 'react';
import { useAnalytics } from '../analytics/AnalyticsProvider';
import { exportSessionReport } from '../analytics/exportSessionReport';
import { reloadForNewSession } from '../analytics/resetAnalytics';

function TestFinishedScreen() {
  const { track, sessionId, participantId } = useAnalytics();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const payload = exportSessionReport(sessionId, track, {
      export_source: 'finish_screen',
    });
    setExportStatus(`${payload.event_count} evento(s) exportado(s)`);
    window.setTimeout(() => setExportStatus(null), 4000);
  };

  const handleNewTest = () => {
    reloadForNewSession();
  };

  return (
    <div className="min-h-screen w-full bg-gray-200 flex items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        role="dialog"
        aria-labelledby="test-finished-title"
      >
        <h1 id="test-finished-title" className="mb-2 text-xl font-bold text-[#80298F]">
          Teste finalizado
        </h1>
        <p className="mb-2 text-sm text-slate-600">
          A sessão foi finalizada com sucesso. Exporte o relatório JSON antes de iniciar um novo
          teste.
        </p>
        {participantId ? (
          <p className="mb-6 text-xs text-slate-500">
            Participante: <span className="font-semibold text-slate-700">{participantId}</span>
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="w-full rounded-lg bg-[#80298F] px-4 py-3 font-semibold text-white transition hover:bg-[#6b2278]"
          >
            Exportar relatório JSON
          </button>
          <button
            type="button"
            onClick={handleNewTest}
            className="w-full rounded-lg border border-[#80298F] bg-white px-4 py-3 font-semibold text-[#80298F] transition hover:bg-[#F9DDFF]"
          >
            Iniciar novo teste
          </button>
        </div>

        {exportStatus ? (
          <p className="mt-4 text-center text-sm text-emerald-700">{exportStatus}</p>
        ) : null}
      </div>
    </div>
  );
}

export default TestFinishedScreen;
