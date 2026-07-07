import type { EventSummary } from '@analytics/sessionSummary';
import { buildContentInteractionsSummary } from '@analytics/contentInteractionsSummary';
import { buildTeacherButtonSummary } from '@analytics/teacherButtonSummary';
import {
  enrichEventForExport,
  enrichFeedbackCommentForExport,
} from '@analytics/exportSessionLog';
import type { AnalyticsEvent } from '@analytics/sessionTypes';
import type { FeedbackCommentRecord } from '@analytics/feedbackComments';
import { ANALYTICS_TIMEZONE_BR, formatDateTimeBr } from '@shared/lib/formatDateTimeBr';
import { enrichSummaryReadingMetrics, enrichSummaryVisibilityMetrics, enrichSummaryJourneyMetrics } from './reportExtractors';
import { enrichSummaryDeviceContext } from '@analytics/deviceContextSummary';
import { enrichSummaryTechnicalHealth } from '@analytics/technicalHealthSummary';
import { buildCollectionQuality } from '@analytics/collectionQuality';
import {
  buildChapterCoverageSummary,
  tryGetChapterManifest,
  type ChapterManifest,
} from '@book/chapter/chapterManifest';
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
      escola_digital_video_watch_total_seconds: 0,
    };
  }

  const content = buildContentInteractionsSummary(events);
  return {
    ...summary,
    escola_digital_video_play_count: content.escola_digital_video_play_count,
    escola_digital_video_completed_count: content.escola_digital_video_completed_count,
    escola_digital_video_watched_to_end: content.escola_digital_video_watched_to_end,
    escola_digital_video_max_progress_percent: content.escola_digital_video_max_progress_percent,
    escola_digital_video_watch_total_seconds: content.escola_digital_video_watch_total_seconds,
  };
}

function enrichCollectionQualitySummary(
  summary: EventSummary,
  events: AnalyticsEvent[],
): EventSummary {
  if (typeof summary.data_quality_score === 'number') {
    return summary;
  }
  if (events.length === 0) {
    return {
      ...summary,
      data_quality_score: 0,
      event_integrity_status: 'error',
      missing_expected_events: [],
      duplicate_event_warnings: [],
      inconsistent_event_warnings: [],
      unexpected_event_warnings: [],
    };
  }
  return {
    ...summary,
    ...buildCollectionQuality(events, summary),
  };
}

function isValidChapterManifest(value: unknown): value is ChapterManifest {
  if (!isRecord(value)) return false;
  return (
    typeof value.book_id === 'string' &&
    typeof value.chapter_id === 'string' &&
    Array.isArray(value.pages) &&
    Array.isArray(value.expected_images) &&
    Array.isArray(value.expected_resources) &&
    Array.isArray(value.expected_teacher_buttons) &&
    Array.isArray(value.expected_activities)
  );
}

function resolveChapterManifest(
  raw: Record<string, unknown>,
  summary: EventSummary,
): ChapterManifest | null {
  const fromRegistry = tryGetChapterManifest(summary.book_id, summary.chapter_id);
  if (fromRegistry) return fromRegistry;
  if (isValidChapterManifest(raw.chapter_manifest)) {
    return raw.chapter_manifest;
  }
  return null;
}

function enrichChapterCoverageSummary(
  summary: EventSummary,
  events: AnalyticsEvent[],
  manifest: ChapterManifest | null,
): EventSummary {
  if (!manifest || events.length === 0) {
    return summary;
  }
  return {
    ...summary,
    ...buildChapterCoverageSummary(manifest, {
      book_id: summary.book_id,
      chapter_id: summary.chapter_id,
      pages_viewed: summary.pages_viewed,
      pages_completed: summary.pages_completed,
      images_viewed_unique: summary.images_viewed_unique,
      activities_started: summary.activities_started,
      events,
    }),
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

  const summary = enrichChapterCoverageSummary(
    enrichCollectionQualitySummary(
      enrichSummaryTechnicalHealth(
        enrichSummaryDeviceContext(
          enrichSummaryReadingMetrics(
            enrichSummaryJourneyMetrics(
              enrichSummaryVisibilityMetrics(
                enrichEscolaDigitalVideoSummary(
                  enrichTeacherButtonSummary(raw.summary, events),
                  events,
                ),
                events,
              ),
              events,
            ),
            events,
          ),
          events,
        ),
        events,
      ),
      events,
    ),
    events,
    resolveChapterManifest(raw, raw.summary),
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

  const chapterManifest = resolveChapterManifest(raw, summary);

  const report: DashboardReport = {
    report_type: 'session_report',
    schema_version:
      typeof raw.schema_version === 'string' ? raw.schema_version : 'legacy',
    exported_at: exportedAt,
    exported_at_br: exportedAtBr,
    timezone: ANALYTICS_TIMEZONE_BR,
    book_id: typeof raw.book_id === 'string' ? raw.book_id : '—',
    chapter_id: typeof raw.chapter_id === 'string' ? raw.chapter_id : '—',
    participant_id:
      typeof raw.participant_id === 'string'
        ? raw.participant_id
        : summary.participant_ids[0] ?? events[0]?.participant_id ?? '',
    session_id:
      typeof raw.session_id === 'string'
        ? raw.session_id
        : summary.session_ids[0] ?? events[0]?.session_id ?? '',
    event_count: typeof raw.event_count === 'number' ? raw.event_count : events.length,
    ...(chapterManifest ? { chapter_manifest: chapterManifest } : {}),
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
    chapterManifest,
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
  const result = parseReportJson(parsed);
  return { ...result, sourceFileName: file.name };
}

export interface MultiReportParseResult {
  sessions: ParsedDashboardReport[];
  loadErrors: { fileName: string; message: string }[];
}

export async function parseMultipleReportFiles(
  files: File[],
): Promise<MultiReportParseResult> {
  const sessions: ParsedDashboardReport[] = [];
  const loadErrors: { fileName: string; message: string }[] = [];

  for (const file of files) {
    try {
      const parsed = await parseReportFile(file);
      sessions.push(parsed);
    } catch (err) {
      loadErrors.push({
        fileName: file.name,
        message:
          err instanceof ReportParseError
            ? err.message
            : 'Não foi possível carregar o relatório.',
      });
    }
  }

  return { sessions, loadErrors };
}
