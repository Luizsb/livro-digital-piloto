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

export interface GroupTestReport {
  sessionCount: number;
  bookId: string;
  chapterId: string;
  participantIds: string[];
  warnings: string[];
  loadErrors: { fileName: string; message: string }[];
  avgPagesViewed: number;
  avgCompletionRate: number;
  chapterFinishedPct: number;
  chapterCompletedPct: number;
  abandonmentPct: number;
  avgVisibleTimeSeconds: number | null;
  avgIdleTimeSeconds: number | null;
  avgDataQualityScore: number | null;
  reliableSessionCount: number;
  readingDepthDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  wouldUseAgainDistribution: Record<string, number>;
  feedbackCount: number;
  avgRating: number | null;
  avgNavigationClarity: number | null;
  avgVisualComfort: number | null;
  avgResourceUsefulness: number | null;
  pageHeatmap: PageHeatmapItem[];
  avgResourcesOpened: number;
  teacherButtonUsagePct: number;
  technicalIssuesPct: number;
  sessions: GroupSessionRow[];
  insight: string;
}

export type DashboardViewMode = 'single' | 'group';
