import { useState } from 'react';
import type { ParsedDashboardReport } from './types';
import { useScrollToTopOnChange } from '@shared/hooks/useScrollToTopOnChange';
import { formatExportedAt, getParticipantLabel } from './reportExtractors';
import { SessionReportViewTabs } from './reportUi';
import { SessionConsolidatedReport } from './SessionConsolidatedReport';
import { SessionResourcesReport } from './SessionResourcesReport';
import { SessionTechnicalReport } from './SessionTechnicalReport';

type SessionReportView = 'consolidated' | 'resources' | 'technical';

const SESSION_TABS: Array<{ id: SessionReportView; label: string; hint: string }> = [
  { id: 'consolidated', label: 'Consolidado', hint: 'Jornada, resumo e feedback' },
  { id: 'resources', label: 'Recursos digitais', hint: 'ODA, vídeo, professor e imagens' },
  { id: 'technical', label: 'Técnico & QA', hint: 'Performance, erros e qualidade' },
];

export function SessionReportContent({ parsed }: { parsed: ParsedDashboardReport }) {
  const [view, setView] = useState<SessionReportView>('consolidated');
  useScrollToTopOnChange(view);
  const { summary, warnings, report } = parsed;

  return (
    <div className="space-y-6">
      {warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {warning}
        </div>
      ))}

      <SessionReportViewTabs
        view={view}
        onChange={setView}
        tabs={SESSION_TABS}
        meta={`${getParticipantLabel(summary)} · ${report.book_id} · cap. ${report.chapter_id}${
          report.exported_at ? ` · ${formatExportedAt(report.exported_at)}` : ''
        }`}
      />

      {view === 'consolidated' ? (
        <SessionConsolidatedReport parsed={parsed} />
      ) : view === 'resources' ? (
        <SessionResourcesReport parsed={parsed} />
      ) : (
        <SessionTechnicalReport parsed={parsed} />
      )}
    </div>
  );
}

export default SessionReportContent;
