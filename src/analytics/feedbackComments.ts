import { ANALYTICS_STORAGE_KEYS } from './sessionTypes';

export interface FeedbackCommentRecord {
  participant_id: string;
  session_id: string;
  comment: string;
  submitted_at: string;
}

export function loadFeedbackComments(): FeedbackCommentRecord[] {
  try {
    const raw = sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.feedbackComments);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackCommentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackComment(record: FeedbackCommentRecord): void {
  const existing = loadFeedbackComments();
  const withoutSession = existing.filter((item) => item.session_id !== record.session_id);
  withoutSession.push(record);
  try {
    sessionStorage.setItem(
      ANALYTICS_STORAGE_KEYS.feedbackComments,
      JSON.stringify(withoutSession),
    );
  } catch (error) {
    console.error('[analytics] Erro ao salvar comentário de feedback:', error);
  }
}
