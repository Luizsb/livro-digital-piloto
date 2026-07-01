import type { EventSummary } from '../analytics/eventSummary';
import { buildContentInteractionsSummary } from '../analytics/contentInteractionsSummary';
import { buildTeacherButtonSummary } from '../analytics/teacherButtonSummary';
import {
  enrichEventForExport,
  enrichFeedbackCommentForExport,
} from '../analytics/exportEvents';
import type { AnalyticsEvent } from '../analytics/eventTypes';
import type { FeedbackCommentRecord } from '../analytics/feedbackComments';
import { ANALYTICS_TIMEZONE_BR, formatDateTimeBr } from '../lib/formatDateTimeBr';
import { enrichSummaryReadingMetrics } from './reportExtractors';
import { enrichSummaryDeviceContext } from '../analytics/deviceContextSummary';
import type { ParsedDashboardReport, DashboardReport } from './types';

export class ReportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportParseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSummary(value: unknown): value is EventSummary {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.participant_ids) &&
    typeof value.pages_viewed_count === 'number' &&
    typeof value.completion_rate === 'number' &&
    isRecord(value.by_event_name)
  );
}

/** JSONs antigos sem detalhamento do professor são enriquecidos a partir dos eventos. */
function enrichTeacherButtonSummary(
  summary: EventSummary,
  events: AnalyticsEvent[],
): EventSummary {
  if (Array.isArray(summary.teacher_button_usage_by_section)) {
    return summary;
  }
  if (events.length > 0) {
    return { ...summary, ...buildTeacherButtonSummary(events) };
  }
  return {
    ...summary,
    teacher_button_usage_by_section: [],
    teacher_button_unique_count: summary.teacher_sections_opened?.length ?? 0,
    teacher_button_repeated_count: 0,
    teacher_button_repeated_sections: [],
    most_opened_teacher_section: null,
  };
}

/** JSONs antigos sem métricas de vídeo são enriquecidos a partir dos eventos. */
function enrichEscolaDigitalVideoSummary(
  summary: EventSummary,
  events: AnalyticsEvent[],
): EventSummary {
  if (typeof summary.escola_digital_video_play_count === 'number') {
    return summary;
  }

  if (events.length === 0) {
    return {
      ...summary,
      escola_digital_video_play_count: 0,
      escola_digital_video_completed_count: 0,
      escola_digital_video_watched_to_end: false,
      escola_digital_video_max_progress_percent: 0,
    };
  }

  const content = buildContentInteractionsSummary(events);
  return {
    ...summary,
    escola_digital_video_play_count: content.escola_digital_video_play_count,
    escola_digital_video_completed_count: content.escola_digital_video_completed_count,
    escola_digital_video_watched_to_end: content.escola_digital_video_watched_to_end,
    escola_digital_video_max_progress_percent: content.escola_digital_video_max_progress_percent,
  };
}

export function parseReportJson(raw: unknown): ParsedDashboardReport {
  if (!isRecord(raw)) {
    throw new ReportParseError(
      'Não foi possível carregar o relatório. Verifique se o arquivo é um JSON exportado pelo Livro Digital Piloto.',
    );
  }

  if (!isValidSummary(raw.summary)) {
    throw new ReportParseError(
      'O relatório não possui resumo consolidado. Não é possível gerar o dashboard MVP.',
    );
  }

  const warnings: string[] = [];
  const events = Array.isArray(raw.events) ? (raw.events as AnalyticsEvent[]) : [];
  if (!Array.isArray(raw.events)) {
    warnings.push(
      'O relatório não possui lista de eventos. Algumas seções podem ficar incompletas.',
    );
  }

  const summary = enrichSummaryDeviceContext(
    enrichSummaryReadingMetrics(
      enrichEscolaDigitalVideoSummary(
        enrichTeacherButtonSummary(raw.summary, events),
        events,
      ),
      events,
    ),
    events,
  );
  const feedbackComments = Array.isArray(raw.feedback_comments)
    ? (raw.feedback_comments as FeedbackCommentRecord[])
    : [];

  const exportedAt = typeof raw.exported_at === 'string' ? raw.exported_at : '';
  const exportedAtBr =
    typeof raw.exported_at_br === 'string' ? raw.exported_at_br : formatDateTimeBr(exportedAt);

  const summaryExportedAtBr =
    isRecord(raw.summary) && typeof raw.summary.exported_at_br === 'string'
      ? raw.summary.exported_at_br
      : formatDateTimeBr(summary.exported_at);

  const report: DashboardReport = {
    exported_at: exportedAt,
    exported_at_br: exportedAtBr,
    timezone: ANALYTICS_TIMEZONE_BR,
    book_id: typeof raw.book_id === 'string' ? raw.book_id : '—',
    chapter_id: typeof raw.chapter_id === 'string' ? raw.chapter_id : '—',
    event_count: typeof raw.event_count === 'number' ? raw.event_count : events.length,
    summary: {
      ...summary,
      exported_at_br: summaryExportedAtBr,
    },
    events: events.map(enrichEventForExport),
    feedback_comments: feedbackComments.map(enrichFeedbackCommentForExport),
  };

  return {
    report,
    summary,
    events,
    feedbackComments,
    warnings,
  };
}

export async function parseReportFile(file: File): Promise<ParsedDashboardReport> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ReportParseError(
      'Não foi possível carregar o relatório. Verifique se o arquivo é um JSON exportado pelo Livro Digital Piloto.',
    );
  }
  return parseReportJson(parsed);
}
