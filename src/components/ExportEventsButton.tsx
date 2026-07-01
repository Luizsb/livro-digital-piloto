import { useState } from 'react';
import { useAnalytics } from '../analytics/AnalyticsProvider';
import { exportSessionReport, type ExportSource } from '../analytics/exportSessionReport';

interface ExportEventsButtonProps {
  exportSource?: ExportSource;
}

function ExportEventsButton({ exportSource = 'manual_button' }: ExportEventsButtonProps) {
  const { track, sessionId } = useAnalytics();
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = () => {
    const payload = exportSessionReport(sessionId, track, {
      export_source: exportSource,
    });
    setStatus(`${payload.event_count} evento(s) exportado(s)`);
    window.setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="rounded-lg bg-[#80298F] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6b2278]"
        title="Baixar relatório de uso em JSON"
      >
        Exportar eventos (JSON)
      </button>
      {status ? (
        <span className="rounded-md bg-white px-3 py-1 text-xs text-slate-700 shadow">
          {status}
        </span>
      ) : null}
    </div>
  );
}

export default ExportEventsButton;
