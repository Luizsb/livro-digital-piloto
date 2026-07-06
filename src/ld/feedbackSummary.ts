import type { AnalyticsEvent } from './sessionTypes';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { loadFeedbackComments } from './feedbackComments';

export interface FeedbackSummary {
  submitted: boolean;
  rating?: number;
  navigation_clarity?: number;
  visual_comfort?: number;
  resource_usefulness?: number;
  would_use_again?: string;
  has_comment?: boolean;
  comment_length?: number;
  /** Texto em `feedback_comments` no export (não no evento principal). */
  comment?: string;
}

export function buildFeedbackSummary(events: AnalyticsEvent[]): FeedbackSummary {
  const feedbackEvents = events.filter(
    (event) => event.event_name === ANALYTICS_EVENT_NAMES.feedbackSubmitted,
  );

  if (feedbackEvents.length === 0) {
    return { submitted: false };
  }

  const latest = feedbackEvents[feedbackEvents.length - 1];
  const meta = latest.metadata ?? {};
  const commentRecord = loadFeedbackComments().find(
    (item) => item.session_id === latest.session_id,
  );

  return {
    submitted: true,
    rating: typeof meta.rating === 'number' ? meta.rating : undefined,
    navigation_clarity:
      typeof meta.navigation_clarity === 'number' ? meta.navigation_clarity : undefined,
    visual_comfort: typeof meta.visual_comfort === 'number' ? meta.visual_comfort : undefined,
    resource_usefulness:
      typeof meta.resource_usefulness === 'number' ? meta.resource_usefulness : undefined,
    would_use_again:
      typeof meta.would_use_again === 'string' ? meta.would_use_again : undefined,
    has_comment: typeof meta.has_comment === 'boolean' ? meta.has_comment : undefined,
    comment_length: typeof meta.comment_length === 'number' ? meta.comment_length : undefined,
    comment: commentRecord?.comment,
  };
}
