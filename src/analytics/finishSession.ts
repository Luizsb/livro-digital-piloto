import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import {
  buildChapterCompletedMetadata,
  buildChapterFinishedMetadata,
  meetsChapterCompletedCriteria,
} from './chapterMetrics';
import { buildSessionFinishMetadata } from './sessionFinishMetrics';
import {
  markSessionEventTracked,
  trackOncePerSession,
  wasSessionEventTracked,
} from './sessionDedup';
import { completeActivePageOnSessionEnd } from './pageCompletion';
import { closeAllOpenTeacherButtons } from './teacherButtonTracking';
import { flushAllOpenVideoSessions } from './videoTracking';
import { flushAllOpenModalResourceSessions } from './modalResourceTracking';
import { getReadingDepthLabel } from './readingQuality';
import {
  setSessionFinishedAt,
  setSessionStatus,
} from './sessionStatus';

export interface FinishTestResult {
  /** `false` se a sessão já havia sido finalizada. */
  emitted: boolean;
  /** `true` quando o critério mínimo foi atingido e `chapter_completed` foi registrado. */
  chapterCompleted: boolean;
}

/** Encerramento ao fechar aba — sem eventos de capítulo (apenas página ativa + sessão). */
export function finishSessionOnUnload(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  return trackOncePerSession(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished, () => {
    flushAllOpenVideoSessions();
    flushAllOpenModalResourceSessions(track);
    closeAllOpenTeacherButtons(track);
    completeActivePageOnSessionEnd(sessionId, track);

    const metadata = buildSessionFinishMetadata(sessionId);
    track(ANALYTICS_EVENT_NAMES.sessionFinished, {
      duration_seconds: metadata.duration_seconds,
      pages_viewed_count: metadata.pages_viewed_count,
      pages_completed_count: metadata.pages_completed_count,
      avg_seconds_per_viewed_page: metadata.avg_seconds_per_viewed_page,
      avg_seconds_per_completed_page: metadata.avg_seconds_per_completed_page,
      reading_depth: metadata.reading_depth,
      reading_depth_label: getReadingDepthLabel(metadata.reading_depth),
    });

    const finishedAt = new Date().toISOString();
    setSessionStatus('finished');
    setSessionFinishedAt(finishedAt);
  });
}

/**
 * Fluxo do botão Finalizar teste:
 * 1. page_completed da página ativa (se aplicável)
 * 2. chapter_finished (sempre)
 * 3. chapter_completed (somente se critério mínimo)
 * 4. session_finished
 *
 * feedback_submitted não é disparado aqui — apenas se o usuário enviou antes.
 */
export function finishTestFromButton(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): FinishTestResult {
  if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished)) {
    return { emitted: false, chapterCompleted: false };
  }

  completeActivePageOnSessionEnd(sessionId, track);

  flushAllOpenVideoSessions();
  flushAllOpenModalResourceSessions(track);
  closeAllOpenTeacherButtons(track);

  const chapterMetrics = buildChapterFinishedMetadata(sessionId, 'finish_button');
  const chapterCompleted = meetsChapterCompletedCriteria(chapterMetrics, sessionId);

  trackOncePerSession(sessionId, ANALYTICS_EVENT_NAMES.chapterFinished, () => {
    track(ANALYTICS_EVENT_NAMES.chapterFinished, chapterMetrics);
  });

  if (chapterCompleted) {
    trackOncePerSession(sessionId, ANALYTICS_EVENT_NAMES.chapterCompleted, () => {
      track(
        ANALYTICS_EVENT_NAMES.chapterCompleted,
        buildChapterCompletedMetadata(sessionId, 'finish_button'),
      );
    });
  }

  markSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished);

  const sessionMetadata = buildSessionFinishMetadata(sessionId);
  track(ANALYTICS_EVENT_NAMES.sessionFinished, {
    duration_seconds: sessionMetadata.duration_seconds,
    pages_viewed_count: sessionMetadata.pages_viewed_count,
    pages_completed_count: sessionMetadata.pages_completed_count,
    avg_seconds_per_viewed_page: sessionMetadata.avg_seconds_per_viewed_page,
    avg_seconds_per_completed_page: sessionMetadata.avg_seconds_per_completed_page,
    reading_depth: sessionMetadata.reading_depth,
    reading_depth_label: getReadingDepthLabel(sessionMetadata.reading_depth),
  });

  const finishedAt = new Date().toISOString();
  setSessionStatus('finished');
  setSessionFinishedAt(finishedAt);

  return { emitted: true, chapterCompleted };
}

/** @deprecated Use finishSessionOnUnload ou finishTestFromButton. */
export function finishSession(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  return finishSessionOnUnload(sessionId, track);
}
