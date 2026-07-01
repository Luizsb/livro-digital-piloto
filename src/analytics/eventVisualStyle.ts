import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import type { AnalyticsEvent } from './eventTypes';
import {
  isResourceEngagementEvent,
  isResourceOpenedEvent,
} from './resourceEvents';

export type EventVisualCategory =
  | 'session'
  | 'journey'
  | 'image'
  | 'resource'
  | 'video'
  | 'teacher'
  | 'feedback'
  | 'chapter'
  | 'other';

export interface EventVisualStyle {
  category: EventVisualCategory;
  icon: string;
  borderClass: string;
  bgClass: string;
  titleClass: string;
  badgeClass: string;
  iconWrapClass: string;
}

const CATEGORY_STYLES: Record<EventVisualCategory, Omit<EventVisualStyle, 'category'>> = {
  session: {
    icon: '◉',
    borderClass: 'border-l-slate-400',
    bgClass: 'bg-slate-50',
    titleClass: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700',
    iconWrapClass: 'bg-slate-200 text-slate-600',
  },
  journey: {
    icon: '▤',
    borderClass: 'border-l-[#80298F]',
    bgClass: 'bg-[#F9DDFF]/25',
    titleClass: 'text-[#80298F]',
    badgeClass: 'bg-[#80298F]/10 text-[#80298F]',
    iconWrapClass: 'bg-[#80298F]/15 text-[#80298F]',
  },
  image: {
    icon: '◫',
    borderClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-50/80',
    titleClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    iconWrapClass: 'bg-emerald-100 text-emerald-700',
  },
  resource: {
    icon: '⧉',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-orange-50/80',
    titleClass: 'text-orange-800',
    badgeClass: 'bg-orange-100 text-orange-800',
    iconWrapClass: 'bg-orange-100 text-orange-700',
  },
  video: {
    icon: '▶',
    borderClass: 'border-l-rose-500',
    bgClass: 'bg-rose-50/80',
    titleClass: 'text-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800',
    iconWrapClass: 'bg-rose-100 text-rose-700',
  },
  teacher: {
    icon: '✎',
    borderClass: 'border-l-indigo-500',
    bgClass: 'bg-indigo-50/80',
    titleClass: 'text-indigo-800',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    iconWrapClass: 'bg-indigo-100 text-indigo-700',
  },
  feedback: {
    icon: '★',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-50/80',
    titleClass: 'text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-900',
    iconWrapClass: 'bg-amber-100 text-amber-800',
  },
  chapter: {
    icon: '✓',
    borderClass: 'border-l-violet-600',
    bgClass: 'bg-violet-50/80',
    titleClass: 'text-violet-800',
    badgeClass: 'bg-violet-100 text-violet-800',
    iconWrapClass: 'bg-violet-100 text-violet-700',
  },
  other: {
    icon: '•',
    borderClass: 'border-l-slate-300',
    bgClass: 'bg-slate-50',
    titleClass: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-600',
    iconWrapClass: 'bg-slate-200 text-slate-500',
  },
};

const EVENT_NAME_CATEGORY: Partial<Record<string, EventVisualCategory>> = {
  [ANALYTICS_EVENT_NAMES.sessionStarted]: 'session',
  [ANALYTICS_EVENT_NAMES.sessionResumed]: 'session',
  [ANALYTICS_EVENT_NAMES.sessionFinished]: 'session',
  [ANALYTICS_EVENT_NAMES.bookOpened]: 'session',
  [ANALYTICS_EVENT_NAMES.eventsExported]: 'session',
  [ANALYTICS_EVENT_NAMES.pageViewed]: 'journey',
  [ANALYTICS_EVENT_NAMES.pageCompleted]: 'journey',
  [ANALYTICS_EVENT_NAMES.imageViewed]: 'image',
  [ANALYTICS_EVENT_NAMES.imageZoomed]: 'image',
  [ANALYTICS_EVENT_NAMES.imageLoadError]: 'image',
  [ANALYTICS_EVENT_NAMES.linkClicked]: 'resource',
  [ANALYTICS_EVENT_NAMES.videoStarted]: 'video',
  [ANALYTICS_EVENT_NAMES.videoCompleted]: 'video',
  [ANALYTICS_EVENT_NAMES.videoProgressRecorded]: 'video',
  [ANALYTICS_EVENT_NAMES.teacherButtonOpened]: 'teacher',
  [ANALYTICS_EVENT_NAMES.teacherButtonClosed]: 'teacher',
  [ANALYTICS_EVENT_NAMES.feedbackSubmitted]: 'feedback',
  [ANALYTICS_EVENT_NAMES.chapterFinished]: 'chapter',
  [ANALYTICS_EVENT_NAMES.chapterCompleted]: 'chapter',
  [ANALYTICS_EVENT_NAMES.activityStarted]: 'resource',
  [ANALYTICS_EVENT_NAMES.activityCompleted]: 'resource',
  [ANALYTICS_EVENT_NAMES.accessibilityChanged]: 'other',
};

function buildStyle(category: EventVisualCategory): EventVisualStyle {
  return { category, ...CATEGORY_STYLES[category] };
}

function getCategoryByEventName(eventName: string): EventVisualCategory {
  return EVENT_NAME_CATEGORY[eventName] ?? 'other';
}

export function getEventVisualStyle(event: AnalyticsEvent): EventVisualStyle {
  if (isResourceOpenedEvent(event) || isResourceEngagementEvent(event)) {
    return buildStyle('resource');
  }
  return buildStyle(getCategoryByEventName(event.event_name));
}

/** Estilo para badges do resumo (`page_viewed`, `resource_opened:oda_opened`, …). */
export function getEventVisualStyleByBadgeKey(badgeKey: string): EventVisualStyle {
  if (badgeKey.startsWith('resource_opened:') || badgeKey.startsWith('resource_engagement:')) {
    return buildStyle('resource');
  }
  return buildStyle(getCategoryByEventName(badgeKey));
}
