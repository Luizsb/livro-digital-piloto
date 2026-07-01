import type { ExportPayload } from '../analytics/exportEvents';
import type { EventSummary } from '../analytics/eventSummary';
import type { FeedbackCommentRecord } from '../analytics/feedbackComments';
import type { AnalyticsEvent } from '../analytics/eventTypes';

export type DashboardReport = ExportPayload;

export interface ParsedDashboardReport {
  report: DashboardReport;
  summary: EventSummary;
  events: AnalyticsEvent[];
  feedbackComments: FeedbackCommentRecord[];
  warnings: string[];
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
