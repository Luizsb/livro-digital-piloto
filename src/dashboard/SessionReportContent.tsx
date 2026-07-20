import { useState } from 'react';
import type { ParsedDashboardReport } from './types';
import { useScrollToTopOnChange } from '@shared/hooks/useScrollToTopOnChange';
import { formatExportedAt, getParticipantLabel } from './reportExtractors';
import { ReportViewTabs, type ReportViewTab } from './reportUi';
import { SessionConsolidatedReport } from './SessionConsolidatedReport';
import { SessionResourcesReport } from './SessionResourcesReport';
import { SessionTechnicalReport } from './SessionTechnicalReport';
import { SessionTimelineReport } from './SessionTimelineReport';

type SessionReportView = 'consolidated' | 'timeline' | 'resources' | 'technical';

const SESSION_TABS: Array<ReportViewTab<SessionReportView>> = [
  {
    id: 'consolidated',
    label: 'Consolidado',
    tag: 'Jornada',
    hint: 'Progresso, abandono, gap, ritmo e feedback',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    tag: 'Debug',
    hint: 'Linha do tempo dos eventos da sessão',
  },
  {
    id: 'resources',
    label: 'Recursos digitais',
    tag: 'Recursos',
    hint: 'ODA, vídeo, professor e inventário',
  },
  {
    id: 'technical',
    label: 'Técnico & QA',
    tag: 'QA',
    hint: 'Performance, erros e qualidade da coleta',
  },
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

      <ReportViewTabs
        view={view}
        onChange={setView}
        tabs={SESSION_TABS}
        meta={`${getParticipantLabel(summary)} · ${report.book_id} · cap. ${report.chapter_id}${
          report.exported_at ? ` · ${formatExportedAt(report.exported_at)}` : ''
        }`}
      />

      {view === 'consolidated' ? (
        <SessionConsolidatedReport parsed={parsed} />
      ) : view === 'timeline' ? (
        <SessionTimelineReport parsed={parsed} />
      ) : view === 'resources' ? (
        <SessionResourcesReport parsed={parsed} />
      ) : (
        <SessionTechnicalReport parsed={parsed} />
      )}
    </div>
  );
}

export default SessionReportContent;
