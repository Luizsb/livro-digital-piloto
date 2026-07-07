import type { ExportPayload } from '@analytics/exportSessionLog';
import type { EventSummary } from '@analytics/sessionSummary';
import type { FeedbackCommentRecord } from '@analytics/feedbackComments';
import type { AnalyticsEvent } from '@analytics/sessionTypes';
import type { ChapterManifest } from '@book/chapter/chapterManifest';
import type { GroupAdvancedAnalytics } from './buildGroupAdvancedAnalytics';
import type { GroupResourcesDetail, GroupTechnicalDetail } from './buildGroupReportExtras';

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
  tabHiddenCount: number;
  hiddenTimeSeconds: number | null;
  odaOpened: boolean;
  videoPlayed: boolean;
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
  /** Páginas concluídas em 100% (tempo mínimo em todas). */
  full_completion_pct: number;
  /** Viu todas as páginas, mas não concluiu 100% (tempo insuficiente). */
  viewed_all_incomplete_pct: number;
  /** Não visualizou todas as páginas do capítulo. */
  partial_view_pct: number;
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
  avg_oda_engagement_seconds: number | null;
  avg_escola_digital_engagement_seconds: number | null;
  avg_video_max_progress_pct: number | null;
  avg_image_zoom_total: number;
  avg_image_zoom_unique: number;
  sessions_with_video_play_pct: number;
  sessions_with_video_completed_pct: number;
  avg_video_watch_seconds: number | null;
  teacher_button_usage_pct: number;
}

export interface GroupFocusAnalytics {
  sessions_with_focus_loss_pct: number;
  avg_tab_hidden_count: number | null;
  avg_hidden_time_seconds: number | null;
  avg_idle_time_seconds: number | null;
}

export interface GroupWrittenFeedbackComment {
  participant_id: string;
  comment: string;
  submitted_at_br?: string;
  file_name: string;
}

export interface GroupFeedbackAnalytics {
  feedback_count: number;
  feedback_rate_pct: number;
  avg_rating: number | null;
  avg_navigation_clarity: number | null;
  avg_visual_comfort: number | null;
  avg_resource_usefulness: number | null;
  would_use_again_distribution: Record<string, number>;
  /** Distribuição de notas gerais (1–5). */
  rating_distribution: Record<string, number>;
  written_comments: GroupWrittenFeedbackComment[];
}

export interface GroupTechnicalAnalytics {
  device_distribution: Record<string, number>;
  /** desktop | mobile | tablet */
  device_type_distribution: Record<string, number>;
  os_distribution: Record<string, number>;
  browser_distribution: Record<string, number>;
  technical_issues_pct: number;
  total_runtime_errors: number;
  total_asset_load_errors: number;
  total_render_errors: number;
  sessions_with_technical_issues: number;
}

export interface GroupEngagementAnalytics {
  /** Todas as páginas concluídas (tempo mínimo em cada uma). */
  full_completion_count: number;
  /** Viu todas as páginas, mas não concluiu 100% (tempo insuficiente). */
  viewed_all_incomplete_count: number;
  /** Não visualizou todas as páginas do capítulo. */
  partial_view_count: number;
  sessions_with_video_pct: number;
  sessions_with_video_completed_pct: number;
  sessions_with_oda_pct: number;
  sessions_with_teacher_pct: number;
  sessions_with_image_zoom_pct: number;
  avg_teacher_button_opens: number;
}

export interface GroupSessionQualityIssue {
  participant_id: string;
  file_name: string;
  score: number;
  warnings: string[];
}

export interface GroupDataQuality {
  avg_data_quality_score: number | null;
  reliable_session_count: number;
  reliable_quality_threshold: number;
  duplicate_session_ids: string[];
  mixed_book_or_chapter: boolean;
  load_error_count: number;
  per_session_warnings_count: number;
  session_quality_issues: GroupSessionQualityIssue[];
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
  focus_analytics: GroupFocusAnalytics;
  engagement_analytics: GroupEngagementAnalytics;
  feedback_analytics: GroupFeedbackAnalytics;
  technical_analytics: GroupTechnicalAnalytics;
  data_quality: GroupDataQuality;
  advanced_analytics: GroupAdvancedAnalytics;
  resources_detail: GroupResourcesDetail;
  technical_detail: GroupTechnicalDetail;
  sessions: GroupSessionRow[];
  insights: string[];
}

export type DashboardViewMode = 'single' | 'group';
