import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { saveFeedbackComment } from './feedbackComments';
import { trackOncePerSession } from './sessionDedup';

export type WouldUseAgain = 'sim' | 'nao' | 'talvez';

export interface FeedbackFormInput {
  rating: number;
  navigation_clarity: number;
  visual_comfort: number;
  resource_usefulness: number;
  would_use_again: WouldUseAgain;
  comment?: string;
}

export function trackFeedbackSubmitted(
  sessionId: string,
  participantId: string,
  input: FeedbackFormInput,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  const comment = input.comment?.trim() ?? '';

  return trackOncePerSession(sessionId, ANALYTICS_EVENT_NAMES.feedbackSubmitted, () => {
    track(ANALYTICS_EVENT_NAMES.feedbackSubmitted, {
      rating: input.rating,
      navigation_clarity: input.navigation_clarity,
      visual_comfort: input.visual_comfort,
      resource_usefulness: input.resource_usefulness,
      would_use_again: input.would_use_again,
      has_comment: comment.length > 0,
      comment_length: comment.length,
    });

    if (comment.length > 0) {
      saveFeedbackComment({
        participant_id: participantId,
        session_id: sessionId,
        comment,
        submitted_at: new Date().toISOString(),
      });
    }
  });
}
