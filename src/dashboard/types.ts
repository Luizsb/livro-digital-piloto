import type { ExportPayload } from '../ld/exportEvents';
import type { EventSummary } from '../ld/sessionSummary';
import type { FeedbackCommentRecord } from '../ld/feedbackComments';
import type { AnalyticsEvent } from '../ld/sessionTypes';
import type { ChapterManifest } from '../ld/chapterManifest';

export type DashboardReport = ExportPayload;

export interface ParsedDashboardReport {
  report: DashboardReport;
  summary: EventSummary;
  events: AnalyticsEvent[];
  feedbackComments: FeedbackCommentRecord[];
  warnings: string[];
  chapterManifest: ChapterManifest | null;
  /** Nome do arquivo de origem (relatório de grupo). */
  sourceFileName?: string;
}

export type PageJourneyStatus = 'completed' | 'viewed' | 'not_viewed';

export interface PageJourneyItem {
  page: number;
  status: PageJourneyStatus;
}

export interface DashboardAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning';
}

export interface HealthCheckItem {
  id: string;
  label: string;
  ok: boolean;
}

export interface GroupSessionRow {
  fileName: string;
  sessionId: string;
  participantId: string;
  pagesViewedCount: number;
  pagesCompletedCount: number;
  totalPages: number;
  completionRate: number;
  chapterStatus: string;
  visibleTimeSeconds: number | null;
  idleTimeSeconds: number | null;
  abandonedBeforeEnd: boolean;
  abandonmentPage: number | null;
  readingDepthLabel: string | null;
  dataQualityScore: number | null;
  feedbackSubmitted: boolean;
  feedbackRating: number | null;
  chapterFinished: boolean;
  chapterCompleted: boolean;
  hasTechnicalIssues: boolean;
}

export interface PageHeatmapItem {
  page: number;
  viewedCount: number;
  viewedPct: number;
  completedCount: number;
  completedPct: number;
  abandonmentCount: number;
}

export interface GroupReportSummary {
  avg_pages_viewed: number;
  avg_completion_rate: number;
  chapter_finished_pct: number;
  chapter_completed_pct: number;
  abandonment_pct: number;
  avg_visible_time_seconds: number | null;
  avg_idle_time_seconds: number | null;
  reading_depth_distribution: Record<string, number>;
  participant_ids: string[];
}

export interface GroupPageAnalytics {
  heatmap: PageHeatmapItem[];
  total_pages: number;
}

export interface GroupResourceAnalytics {
  avg_resources_opened: number;
  sessions_with_oda_pct: number;
  avg_oda_opened: number;
  avg_image_zoom_total: number;
  avg_image_zoom_unique: number;
  sessions_with_video_play_pct: number;
  sessions_with_video_completed_pct: number;
  avg_video_watch_seconds: number | null;
  teacher_button_usage_pct: number;
}

export interface GroupFeedbackAnalytics {
  feedback_count: number;
  feedback_rate_pct: number;
  avg_rating: number | null;
  avg_navigation_clarity: number | null;
  avg_visual_comfort: number | null;
  avg_resource_usefulness: number | null;
  would_use_again_distribution: Record<string, number>;
}

export interface GroupTechnicalAnalytics {
  device_distribution: Record<string, number>;
  browser_distribution: Record<string, number>;
  technical_issues_pct: number;
  total_runtime_errors: number;
  total_asset_load_errors: number;
  total_render_errors: number;
  sessions_with_technical_issues: number;
}

export interface GroupDataQuality {
  avg_data_quality_score: number | null;
  reliable_session_count: number;
  reliable_quality_threshold: number;
  duplicate_session_ids: string[];
  mixed_book_or_chapter: boolean;
  load_error_count: number;
  per_session_warnings_count: number;
}

/** Relatório consolidado multi-sessão exportável pelo LD Insights. */
export interface GroupReport {
  report_type: 'group_summary';
  generated_at: string;
  generated_at_br: string;
  book_id: string;
  chapter_id: string;
  source_reports_count: number;
  valid_sessions_count: number;
  invalid_sessions_count: number;
  participants_count: number;
  warnings: string[];
  load_errors: { file_name: string; message: string }[];
  summary: GroupReportSummary;
  page_analytics: GroupPageAnalytics;
  resource_analytics: GroupResourceAnalytics;
  feedback_analytics: GroupFeedbackAnalytics;
  technical_analytics: GroupTechnicalAnalytics;
  data_quality: GroupDataQuality;
  sessions: GroupSessionRow[];
  insights: string[];
}

export type DashboardViewMode = 'single' | 'group';
