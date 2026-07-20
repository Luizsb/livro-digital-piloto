import { ANALYTICS_EVENT_NAMES, type AnalyticsEvent } from '@analytics/sessionTypes';
import { getEventDisplayInfo, getEventLabel } from '@analytics/sessionLabels';
import { formatDateTimeBr } from '@shared/lib/formatDateTimeBr';
import { formatDuration } from '@shared/lib/formatDuration';

export type TimelineCategory =
  | 'session'
  | 'journey'
  | 'content'
  | 'teacher'
  | 'focus'
  | 'feedback'
  | 'technical';

export type TimelineDensity = 'demo' | 'detailed';

export interface SessionTimelineItem {
  id: string;
  timestamp: string;
  timeLabel: string;
  eventName: string;
  label: string;
  detail: string | null;
  category: TimelineCategory;
  categoryLabel: string;
}

export interface SessionTimeline {
  density: TimelineDensity;
  total_events: number;
  shown_count: number;
  hidden_count: number;
  items: SessionTimelineItem[];
}

const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  session: 'Sessão',
  journey: 'Jornada',
  content: 'Conteúdo',
  teacher: 'Professor',
  focus: 'Foco',
  feedback: 'Feedback',
  technical: 'Técnico',
};

/** Eventos ruidosos omitidos no modo demo (marcos). */
const DEMO_EXCLUDED = new Set<string>([
  ANALYTICS_EVENT_NAMES.imageViewed,
  ANALYTICS_EVENT_NAMES.videoProgressRecorded,
  ANALYTICS_EVENT_NAMES.resourceTimingSnapshot,
  ANALYTICS_EVENT_NAMES.resourceEngagementRecorded,
  ANALYTICS_EVENT_NAMES.idleStarted,
  ANALYTICS_EVENT_NAMES.idleFinished,
]);

function categorize(eventName: string): TimelineCategory {
  switch (eventName) {
    case ANALYTICS_EVENT_NAMES.sessionStarted:
    case ANALYTICS_EVENT_NAMES.sessionResumed:
    case ANALYTICS_EVENT_NAMES.bookOpened:
    case ANALYTICS_EVENT_NAMES.sessionFinished:
    case ANALYTICS_EVENT_NAMES.eventsExported:
      return 'session';
    case ANALYTICS_EVENT_NAMES.pageViewed:
    case ANALYTICS_EVENT_NAMES.pageCompleted:
    case ANALYTICS_EVENT_NAMES.chapterFinished:
    case ANALYTICS_EVENT_NAMES.chapterCompleted:
      return 'journey';
    case ANALYTICS_EVENT_NAMES.imageViewed:
    case ANALYTICS_EVENT_NAMES.imageZoomed:
    case ANALYTICS_EVENT_NAMES.imageLoadError:
    case ANALYTICS_EVENT_NAMES.resourceOpened:
    case ANALYTICS_EVENT_NAMES.resourceEngagementRecorded:
    case ANALYTICS_EVENT_NAMES.linkClicked:
    case ANALYTICS_EVENT_NAMES.linkOpenFailed:
    case ANALYTICS_EVENT_NAMES.videoStarted:
    case ANALYTICS_EVENT_NAMES.videoCompleted:
    case ANALYTICS_EVENT_NAMES.videoProgressRecorded:
      return 'content';
    case ANALYTICS_EVENT_NAMES.teacherButtonOpened:
    case ANALYTICS_EVENT_NAMES.teacherButtonClosed:
      return 'teacher';
    case ANALYTICS_EVENT_NAMES.idleStarted:
    case ANALYTICS_EVENT_NAMES.idleFinished:
      return 'focus';
    case ANALYTICS_EVENT_NAMES.feedbackSubmitted:
      return 'feedback';
    default:
      return 'technical';
  }
}

function formatTimeLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return formatDateTimeBr(iso);
  }
}

function metaString(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function metaNumber(meta: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function buildDetail(event: AnalyticsEvent): string | null {
  const meta = event.metadata ?? {};
  const parts: string[] = [];
  const display = getEventDisplayInfo(event);

  const page = metaNumber(meta, 'page', 'page_number', 'book_page');
  if (page !== null) parts.push(`Pág. ${page}`);

  const resourceType = metaString(meta, 'type', 'resource_type', 'video_type');
  if (resourceType && !display.description?.includes(resourceType)) {
    parts.push(resourceType);
  }

  const title = metaString(meta, 'title', 'label', 'resource_id', 'image_id', 'section', 'section_id');
  if (title) parts.push(title);

  const progress = metaNumber(meta, 'progress_pct', 'max_progress_pct', 'percent');
  if (progress !== null) parts.push(`${Math.round(progress)}%`);

  const seconds = metaNumber(
    meta,
    'duration_seconds',
    'engagement_seconds',
    'visible_time_seconds',
    'seconds',
  );
  if (seconds !== null && seconds > 0) parts.push(formatDuration(Math.round(seconds)));

  const device = metaString(meta, 'device_type');
  const browser = metaString(meta, 'browser_name');
  if (device || browser) {
    parts.push([device, browser].filter(Boolean).join(' · '));
  }

  const rating = metaNumber(meta, 'rating', 'overall_rating');
  if (rating !== null) parts.push(`Nota ${rating}/5`);

  if (parts.length > 0) return parts.join(' · ');
  if (display.description) {
    const short = display.description.split('.')[0]?.trim();
    return short && short.length < 120 ? short : null;
  }
  return null;
}

function passesCategoryFilter(
  category: TimelineCategory,
  filter: TimelineCategory | 'all',
): boolean {
  return filter === 'all' || category === filter;
}

export function buildSessionTimeline(
  events: AnalyticsEvent[],
  options: {
    density?: TimelineDensity;
    category?: TimelineCategory | 'all';
  } = {},
): SessionTimeline {
  const density = options.density ?? 'demo';
  const categoryFilter = options.category ?? 'all';

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const items: SessionTimelineItem[] = [];

  for (const event of sorted) {
    if (density === 'demo' && DEMO_EXCLUDED.has(event.event_name)) continue;

    const category = categorize(event.event_name);
    if (!passesCategoryFilter(category, categoryFilter)) continue;

    const display = getEventDisplayInfo(event);
    items.push({
      id: event.event_id,
      timestamp: event.timestamp,
      timeLabel: formatTimeLabel(event.timestamp),
      eventName: event.event_name,
      label: display.label || getEventLabel(event.event_name),
      detail: buildDetail(event),
      category,
      categoryLabel: CATEGORY_LABELS[category],
    });
  }

  return {
    density,
    total_events: events.length,
    shown_count: items.length,
    hidden_count: Math.max(0, events.length - items.length),
    items,
  };
}

export function getTimelineCategoryLabel(category: TimelineCategory): string {
  return CATEGORY_LABELS[category];
}

export const TIMELINE_CATEGORY_COLORS: Record<TimelineCategory, string> = {
  session: 'bg-slate-500',
  journey: 'bg-[#80298F]',
  content: 'bg-sky-500',
  teacher: 'bg-amber-500',
  focus: 'bg-orange-400',
  feedback: 'bg-emerald-500',
  technical: 'bg-rose-500',
};
