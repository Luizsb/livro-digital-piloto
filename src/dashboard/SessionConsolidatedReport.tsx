import { getChapterTotalPages, resolveChapterPageBounds } from '@book/chapter/chapterPageConfig';
import type { ParsedDashboardReport } from './types';
import {
  buildInterpretationAlerts,
  buildSessionInsight,
} from './reportInsights';
import {
  extractSessionDurationSeconds,
  extractSessionHiddenSeconds,
  extractSessionVisibleSeconds,
  extractVisibleTimeRatio,
  formatDuration,
  formatVisibleTimePercent,
  getParticipantLabel,
} from './reportExtractors';
import {
  PAGE_COMPLETION_RATE_LABEL,
  READING_DEPTH_EXPLANATION,
  READING_DEPTH_LABEL,
  TAB_FOCUS_RETURN_COUNT_LABEL,
  TAB_HIDDEN_COUNT_LABEL,
} from '@analytics/metricDisplayLabels';
import {
  SessionChapterProgressSection,
  SessionFeedbackVisualSection,
  SessionPageJourneySection,
} from './SessionVisualBlocks';
import {
  InterpretationAlertsBlock,
  MetricCard,
  DashboardSection,
  SessionInsightBlock,
} from './reportUi';

export function SessionConsolidatedReport({ parsed }: { parsed: ParsedDashboardReport }) {
  const { report, summary, events, feedbackComments } = parsed;
  const totalPages =
    summary.chapter_total_pages ?? getChapterTotalPages(resolveChapterPageBounds(summary));
  const duration = extractSessionDurationSeconds(events);
  const visibleDuration = extractSessionVisibleSeconds(events, summary);
  const hiddenDuration = extractSessionHiddenSeconds(events, summary);
  const visibleRatio = extractVisibleTimeRatio(events, summary);
  const interpretationAlerts = buildInterpretationAlerts(summary);
  const sessionInsight = buildSessionInsight(parsed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Participante" value={getParticipantLabel(summary)} />
        {hiddenDuration !== null && hiddenDuration > 0 ? (
          <>
            <MetricCard
              label="Tempo visível no livro"
              value={formatDuration(visibleDuration)}
              hint="Com a aba do livro em foco"
            />
            <MetricCard
              label="Tempo fora da aba"
              value={formatDuration(hiddenDuration)}
              hint="Participante em outra guia ou aplicativo"
            />
            <MetricCard
              label="Duração da sessão"
              value={formatDuration(duration)}
              hint="Tempo visível + tempo fora da aba"
            />
            <MetricCard
              label="Tempo visível (%)"
              value={formatVisibleTimePercent(visibleRatio)}
            />
            {(summary.tab_hidden_count ?? 0) > 0 ? (
              <>
                <MetricCard
                  label={TAB_HIDDEN_COUNT_LABEL}
                  value={String(summary.tab_hidden_count)}
                  hint="Quantas vezes saiu da aba do livro"
                />
                <MetricCard
                  label={TAB_FOCUS_RETURN_COUNT_LABEL}
                  value={String(summary.tab_focus_return_count ?? 0)}
                  hint="Quantas vezes voltou à aba do livro"
                />
              </>
            ) : null}
          </>
        ) : (
          <MetricCard
            label="Tempo no livro"
            value={formatDuration(visibleDuration)}
            hint="Sessão inteira com a aba do livro em foco"
          />
        )}
        <MetricCard
          label="Páginas visualizadas"
          value={`${summary.pages_viewed_count}/${totalPages}`}
        />
        <MetricCard
          label="Páginas concluídas"
          value={`${summary.pages_completed_count}/${totalPages}`}
        />
        <MetricCard label={PAGE_COMPLETION_RATE_LABEL} value={`${summary.completion_rate}%`} />
        <MetricCard
          label={READING_DEPTH_LABEL}
          value={summary.reading_depth_label ?? '—'}
          hint={READING_DEPTH_EXPLANATION}
        />
        {typeof summary.idle_time_seconds === 'number' && summary.idle_time_seconds > 0 ? (
          <MetricCard
            label="Tempo inativo"
            value={formatDuration(summary.idle_time_seconds)}
            hint="Sem interação com a aba visível"
          />
        ) : null}
        {typeof summary.data_quality_score === 'number' ? (
          <MetricCard
            label="Qualidade da coleta"
            value={String(summary.data_quality_score)}
            hint="Detalhes na aba Técnico & QA"
          />
        ) : null}
      </div>

      <SessionInsightBlock
        text={sessionInsight}
        eventCount={report.event_count}
        exportedAt={report.exported_at}
      />

      <SessionChapterProgressSection summary={summary} totalPages={totalPages} />
      <SessionPageJourneySection summary={summary} />
      <SessionFeedbackVisualSection summary={summary} feedbackComments={feedbackComments} />

      <DashboardSection
        title="Alertas de interpretação"
        subtitle="Sinais de comportamento de leitura — não indicam falha na coleta."
      >
        <InterpretationAlertsBlock alerts={interpretationAlerts} />
      </DashboardSection>
    </div>
  );
}
