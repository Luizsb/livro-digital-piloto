import {
  getMinCompletionRateForChapter,
  getChapterTotalPages,
  resolveChapterPageBounds,
} from '@book/chapter/chapterPageConfig';
import { computeChapterCompletionStatus } from './chapterMetrics';
import { computeReadingQuality } from './readingQuality';
import { isResourceEngagementEvent, isResourceOpenedEvent } from './resourceEvents';
import { EVENT_CATALOG } from './sessionLabels';
import type { EventSummary } from './sessionSummary';
import { ANALYTICS_EVENT_NAMES, isValidParticipantId } from './sessionTypes';
import type { AnalyticsEvent } from './sessionTypes';

export type EventIntegrityStatus = 'ok' | 'warning' | 'error';

export interface CollectionQualitySummary {
  data_quality_score: number;
  event_integrity_status: EventIntegrityStatus;
  missing_expected_events: string[];
  duplicate_event_warnings: string[];
  inconsistent_event_warnings: string[];
  unexpected_event_warnings: string[];
}

export interface QualityCheckItem {
  id: string;
  category: 'session' | 'journey' | 'content' | 'teacher';
  label: string;
  ok: boolean;
  severity: 'critical' | 'major' | 'minor';
}

const ONCE_PER_SESSION_EVENTS = [
  ANALYTICS_EVENT_NAMES.sessionStarted,
  ANALYTICS_EVENT_NAMES.chapterFinished,
  ANALYTICS_EVENT_NAMES.chapterCompleted,
  ANALYTICS_EVENT_NAMES.sessionFinished,
  ANALYTICS_EVENT_NAMES.eventsExported,
] as const;

const EXPECTED_LIFECYCLE_EVENTS = [
  ANALYTICS_EVENT_NAMES.sessionStarted,
  ANALYTICS_EVENT_NAMES.bookOpened,
  ANALYTICS_EVENT_NAMES.sessionFinished,
  ANALYTICS_EVENT_NAMES.eventsExported,
] as const;

function isEscolaDigitalVideo(meta: Record<string, unknown>): boolean {
  return (
    meta.type === 'escola_digital_video' ||
    meta.video_id === 'escola_digital_video' ||
    meta.link_id === 'escola_digital_video'
  );
}

function resolveVideoId(meta: Record<string, unknown>): string | null {
  if (typeof meta.video_id === 'string') return meta.video_id;
  if (typeof meta.link_id === 'string') return meta.link_id;
  return null;
}

function resolveResourceLinkId(meta: Record<string, unknown>): string | null {
  if (typeof meta.link_id === 'string') return meta.link_id;
  return null;
}

function resolveTeacherSectionId(meta: Record<string, unknown>): string | null {
  if (typeof meta.section_id === 'string') return meta.section_id;
  if (typeof meta.section === 'string') return meta.section;
  return null;
}

function computeCompletionRate(pagesViewed: number, pagesCompleted: number): number {
  if (pagesViewed <= 0) return 0;
  return Math.round((pagesCompleted / pagesViewed) * 100);
}

type SessionFinishTrigger = 'finish_button' | 'unload' | 'unknown';

function resolveSessionFinishTrigger(events: AnalyticsEvent[]): SessionFinishTrigger {
  const finishedEvents = events.filter(
    (event) => event.event_name === ANALYTICS_EVENT_NAMES.sessionFinished,
  );
  if (finishedEvents.length === 0) return 'unknown';

  const last = finishedEvents[finishedEvents.length - 1];
  const trigger = last.metadata?.finish_trigger;
  if (trigger === 'finish_button' || trigger === 'unload') {
    return trigger;
  }

  if (events.some((event) => event.event_name === ANALYTICS_EVENT_NAMES.chapterFinished)) {
    return 'finish_button';
  }

  return 'unknown';
}

function sessionFinishedRequiresChapterFinished(events: AnalyticsEvent[]): boolean {
  const trigger = resolveSessionFinishTrigger(events);
  return trigger === 'finish_button';
}

function collectPageSetsFromEvents(events: AnalyticsEvent[]) {
  const pagesViewed = new Set<number>();
  const pagesCompleted = new Set<number>();

  for (const event of events) {
    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.pageViewed && typeof meta.page === 'number') {
      pagesViewed.add(meta.page);
    }
    if (
      event.event_name === ANALYTICS_EVENT_NAMES.pageCompleted &&
      typeof meta.page === 'number'
    ) {
      pagesCompleted.add(meta.page);
    }
  }

  return { pagesViewed, pagesCompleted };
}

function meetsChapterCompletedCriteriaFromEvents(
  events: AnalyticsEvent[],
  bookId: string,
  chapterId: string,
): boolean {
  const bounds = resolveChapterPageBounds({ book_id: bookId, chapter_id: chapterId });
  const totalPages = getChapterTotalPages(bounds);
  const minRate = getMinCompletionRateForChapter(bookId, chapterId);
  const { pagesViewed, pagesCompleted } = collectPageSetsFromEvents(events);
  const pagesViewedCount = pagesViewed.size;
  const pagesCompletedCount = pagesCompleted.size;
  const completionRate = computeCompletionRate(pagesViewedCount, pagesCompletedCount);

  const sessionFinished = events.find(
    (event) => event.event_name === ANALYTICS_EVENT_NAMES.sessionFinished,
  );
  const durationSeconds =
    typeof sessionFinished?.metadata?.duration_seconds === 'number'
      ? sessionFinished.metadata.duration_seconds
      : 0;

  const readingQuality = computeReadingQuality(events, durationSeconds, pagesViewedCount);

  const status = computeChapterCompletionStatus(
    pagesViewedCount,
    completionRate,
    totalPages,
    readingQuality.reading_depth,
    minRate,
  );

  return status === 'completed';
}

function resolveIntegrityStatus(
  score: number,
  hasCritical: boolean,
): EventIntegrityStatus {
  if (hasCritical || score < 60) return 'error';
  if (score < 85) return 'warning';
  return 'ok';
}

function deductScore(score: number, points: number): number {
  return Math.max(0, score - points);
}

export function buildCollectionQualityChecks(
  events: AnalyticsEvent[],
  summary: Pick<
    EventSummary,
    | 'book_id'
    | 'chapter_id'
    | 'pages_viewed'
    | 'pages_completed'
    | 'pages_viewed_count'
    | 'pages_completed_count'
    | 'completion_rate'
    | 'chapter_finished_count'
    | 'chapter_completed_count'
    | 'teacher_button_opened_count'
    | 'teacher_button_closed_count'
    | 'teacher_button_total_seconds'
    | 'teacher_button_usage_by_section'
    | 'by_event_name'
    | 'participant_ids'
    | 'session_ids'
  >,
): QualityCheckItem[] {
  const checks: QualityCheckItem[] = [];
  const by = summary.by_event_name;
  const has = (name: string) => (by[name] ?? 0) > 0;

  checks.push({
    id: 'session_started',
    category: 'session',
    label: 'Sessão iniciada (session_started)',
    ok: has(ANALYTICS_EVENT_NAMES.sessionStarted),
    severity: 'critical',
  });

  checks.push({
    id: 'book_opened',
    category: 'session',
    label: 'Livro aberto (book_opened)',
    ok: has(ANALYTICS_EVENT_NAMES.bookOpened),
    severity: 'major',
  });

  checks.push({
    id: 'session_finished',
    category: 'session',
    label: 'Sessão finalizada (session_finished)',
    ok: has(ANALYTICS_EVENT_NAMES.sessionFinished),
    severity: 'major',
  });

  checks.push({
    id: 'events_exported',
    category: 'session',
    label: 'Exportação registrada (events_exported)',
    ok: has(ANALYTICS_EVENT_NAMES.eventsExported),
    severity: 'minor',
  });

  checks.push({
    id: 'participant_id',
    category: 'session',
    label: 'Participante identificado (participant_id válido)',
    ok:
      summary.participant_ids.length === 1 &&
      summary.participant_ids.every((id) => isValidParticipantId(id)) &&
      events.every((e) => isValidParticipantId(e.participant_id)),
    severity: 'critical',
  });

  checks.push({
    id: 'session_id_unique',
    category: 'session',
    label: 'session_id único em todos os eventos',
    ok: summary.session_ids.length <= 1,
    severity: 'critical',
  });

  const pagesViewedSet = new Set(summary.pages_viewed);
  const orphanCompleted = summary.pages_completed.filter((page) => !pagesViewedSet.has(page));
  checks.push({
    id: 'page_completed_requires_viewed',
    category: 'journey',
    label: 'page_completed apenas em páginas visualizadas',
    ok: orphanCompleted.length === 0,
    severity: 'major',
  });

  const recomputedRate = computeCompletionRate(
    summary.pages_viewed_count,
    summary.pages_completed_count,
  );
  checks.push({
    id: 'completion_rate_consistent',
    category: 'journey',
    label: 'completion_rate consistente com páginas concluídas/visualizadas',
    ok: recomputedRate === summary.completion_rate,
    severity: 'major',
  });

  const chapterCompletedCriteriaMet = meetsChapterCompletedCriteriaFromEvents(
    events,
    summary.book_id,
    summary.chapter_id,
  );

  checks.push({
    id: 'chapter_completed_criteria',
    category: 'journey',
    label: 'chapter_completed só com critério mínimo atingido',
    ok:
      summary.chapter_completed_count === 0 ||
      (summary.chapter_completed_count > 0 && chapterCompletedCriteriaMet),
    severity: 'major',
  });

  checks.push({
    id: 'chapter_finished_on_finalize',
    category: 'journey',
    label: 'chapter_finished ao finalizar o capítulo',
    ok:
      !has(ANALYTICS_EVENT_NAMES.sessionFinished) ||
      summary.chapter_finished_count > 0 ||
      !sessionFinishedRequiresChapterFinished(events),
    severity: 'major',
  });

  const imagesViewed = new Set<string>();
  const imagesZoomed = new Set<string>();
  for (const event of events) {
    const meta = event.metadata ?? {};
    if (event.event_name === ANALYTICS_EVENT_NAMES.imageViewed && typeof meta.image_id === 'string') {
      imagesViewed.add(meta.image_id);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.imageZoomed && typeof meta.image_id === 'string') {
      imagesZoomed.add(meta.image_id);
    }
  }
  const zoomWithoutView = [...imagesZoomed].filter((id) => !imagesViewed.has(id));
  checks.push({
    id: 'image_zoom_requires_view',
    category: 'content',
    label: 'image_zoomed com image_viewed correspondente',
    ok: zoomWithoutView.length === 0,
    severity: 'minor',
  });

  const videoStarted = new Set<string>();
  const videoCompleted = new Set<string>();
  for (const event of events) {
    const meta = event.metadata ?? {};
    const isVideoEvent =
      event.event_name === ANALYTICS_EVENT_NAMES.videoStarted ||
      event.event_name === ANALYTICS_EVENT_NAMES.videoCompleted ||
      event.event_name === ANALYTICS_EVENT_NAMES.videoProgressRecorded;
    if (!isVideoEvent) continue;

    const videoId = resolveVideoId(meta) ?? (isEscolaDigitalVideo(meta) ? 'escola_digital_video' : null);
    if (!videoId) continue;

    if (event.event_name === ANALYTICS_EVENT_NAMES.videoStarted) {
      videoStarted.add(videoId);
    }
    if (event.event_name === ANALYTICS_EVENT_NAMES.videoCompleted) {
      videoCompleted.add(videoId);
    }
  }
  const completedWithoutStart = [...videoCompleted].filter((id) => !videoStarted.has(id));
  checks.push({
    id: 'video_completed_requires_start',
    category: 'content',
    label: 'video_completed com video_started correspondente',
    ok: completedWithoutStart.length === 0,
    severity: 'major',
  });

  const resourcesOpened = new Set<string>();
  for (const event of events) {
    const linkId = resolveResourceLinkId(event.metadata ?? {});
    if (isResourceOpenedEvent(event) && linkId) {
      resourcesOpened.add(linkId);
    }
  }
  const orphanEngagements = new Set<string>();
  for (const event of events) {
    const linkId = resolveResourceLinkId(event.metadata ?? {});
    if (isResourceEngagementEvent(event) && linkId && !resourcesOpened.has(linkId)) {
      orphanEngagements.add(linkId);
    }
  }
  checks.push({
    id: 'resource_engagement_requires_open',
    category: 'content',
    label: 'resource_engagement_recorded após resource_opened',
    ok: orphanEngagements.size === 0,
    severity: 'major',
  });

  let teacherCloseWithoutOpen = false;
  let teacherSecondsMismatch = false;
  let teacherOpenCloseMismatch = false;
  let summedTeacherSeconds = 0;

  for (const event of events) {
    if (event.event_name === ANALYTICS_EVENT_NAMES.teacherButtonClosed) {
      const duration = event.metadata?.duration_seconds;
      if (typeof duration === 'number') summedTeacherSeconds += duration;
    }
  }

  for (const section of summary.teacher_button_usage_by_section) {
    if (section.close_count > section.open_count) {
      teacherOpenCloseMismatch = true;
    }
    if (section.close_count > 0 && section.open_count === 0) {
      teacherCloseWithoutOpen = true;
    }
  }

  if (summary.teacher_button_closed_count > 0) {
    teacherSecondsMismatch =
      Math.abs(summedTeacherSeconds - summary.teacher_button_total_seconds) > 1;
  }

  checks.push({
    id: 'teacher_close_requires_open',
    category: 'teacher',
    label: 'teacher_button_closed com abertura correspondente',
    ok: !teacherCloseWithoutOpen && !teacherOpenCloseMismatch,
    severity: 'major',
  });

  checks.push({
    id: 'teacher_total_seconds',
    category: 'teacher',
    label: 'teacher_button_total_seconds bate com soma das durações',
    ok: !teacherSecondsMismatch,
    severity: 'minor',
  });

  checks.push({
    id: 'teacher_section_repetition',
    category: 'teacher',
    label: 'teacher_button_usage_by_section indica repetição por seção',
    ok:
      summary.teacher_button_opened_count === 0 ||
      summary.teacher_button_usage_by_section.every(
        (row) => row.opened_more_than_once === row.open_count > 1,
      ),
    severity: 'minor',
  });

  return checks;
}

export function buildCollectionQuality(
  events: AnalyticsEvent[],
  summary: Pick<
    EventSummary,
    | 'book_id'
    | 'chapter_id'
    | 'pages_viewed'
    | 'pages_completed'
    | 'pages_viewed_count'
    | 'pages_completed_count'
    | 'completion_rate'
    | 'chapter_finished_count'
    | 'chapter_completed_count'
    | 'teacher_button_opened_count'
    | 'teacher_button_closed_count'
    | 'teacher_button_total_seconds'
    | 'teacher_button_usage_by_section'
    | 'by_event_name'
    | 'participant_ids'
    | 'session_ids'
  >,
): CollectionQualitySummary {
  const missing_expected_events: string[] = [];
  const duplicate_event_warnings: string[] = [];
  const inconsistent_event_warnings: string[] = [];
  const unexpected_event_warnings: string[] = [];

  const by = summary.by_event_name;
  const has = (name: string) => (by[name] ?? 0) > 0;

  for (const eventName of EXPECTED_LIFECYCLE_EVENTS) {
    if (!has(eventName)) {
      missing_expected_events.push(eventName);
    }
  }

  if (summary.participant_ids.length !== 1) {
    inconsistent_event_warnings.push(
      `Esperado 1 participant_id na sessão; encontrado(s): ${summary.participant_ids.length}.`,
    );
  } else if (!isValidParticipantId(summary.participant_ids[0] ?? '')) {
    inconsistent_event_warnings.push('participant_id não segue o padrão P01, P02…');
  }

  if (summary.session_ids.length > 1) {
    inconsistent_event_warnings.push(
      `Múltiplos session_id no export: ${summary.session_ids.join(', ')}.`,
    );
  }

  const eventsMissingParticipant = events.filter((e) => !e.participant_id?.trim());
  if (eventsMissingParticipant.length > 0) {
    inconsistent_event_warnings.push(
      `${eventsMissingParticipant.length} evento(s) sem participant_id.`,
    );
  }

  for (const eventName of ONCE_PER_SESSION_EVENTS) {
    const count = by[eventName] ?? 0;
    if (count > 1) {
      duplicate_event_warnings.push(`${eventName} registrado ${count} vezes na mesma sessão.`);
    }
  }

  const pagesViewedSet = new Set(summary.pages_viewed);
  const orphanCompleted = summary.pages_completed.filter((page) => !pagesViewedSet.has(page));
  if (orphanCompleted.length > 0) {
    inconsistent_event_warnings.push(
      `page_completed sem page_viewed nas páginas: ${orphanCompleted.join(', ')}.`,
    );
  }

  const recomputedRate = computeCompletionRate(
    summary.pages_viewed_count,
    summary.pages_completed_count,
  );
  if (recomputedRate !== summary.completion_rate) {
    inconsistent_event_warnings.push(
      `completion_rate no summary (${summary.completion_rate}%) difere do calculado (${recomputedRate}%).`,
    );
  }

  if (summary.chapter_completed_count > 0) {
    if (!meetsChapterCompletedCriteriaFromEvents(events, summary.book_id, summary.chapter_id)) {
      inconsistent_event_warnings.push(
        'chapter_completed registrado sem atingir o critério mínimo do capítulo.',
      );
    }
  }

  if (
    has(ANALYTICS_EVENT_NAMES.sessionFinished) &&
    summary.chapter_finished_count === 0 &&
    sessionFinishedRequiresChapterFinished(events)
  ) {
    inconsistent_event_warnings.push(
      'session_finished sem chapter_finished correspondente.',
    );
  }

  if (
    summary.chapter_finished_count > 0 &&
    summary.chapter_completed_count === 0
  ) {
    const bounds = resolveChapterPageBounds(summary);
    const totalPages = getChapterTotalPages(bounds);
    const { pagesViewed, pagesCompleted } = collectPageSetsFromEvents(events);
    const pagesViewedCount = pagesViewed.size;
    const completionRate = computeCompletionRate(pagesViewedCount, pagesCompleted.size);
    const minRate = getMinCompletionRateForChapter(summary.book_id, summary.chapter_id);

    if (pagesViewedCount === totalPages && completionRate >= minRate) {
      inconsistent_event_warnings.push(
        'Critério de chapter_completed aparentemente atingido, mas evento ausente.',
      );
    }
  }

  const imagesViewed = new Set<string>();
  const imagesZoomed = new Set<string>();
  const videoStarted = new Set<string>();
  const videoCompleted = new Set<string>();
  const videoProgressById = new Map<string, number>();
  const resourcesOpened = new Set<string>();
  const orphanEngagementLinks = new Set<string>();

  for (const event of events) {
    const linkId = resolveResourceLinkId(event.metadata ?? {});
    if (isResourceOpenedEvent(event) && linkId) {
      resourcesOpened.add(linkId);
    }
  }

  for (const event of events) {
    const meta = event.metadata ?? {};
    const eventName = event.event_name;

    if (!EVENT_CATALOG[eventName]) {
      unexpected_event_warnings.push(`Evento desconhecido: ${eventName}.`);
    } else if (!EVENT_CATALOG[eventName].active) {
      unexpected_event_warnings.push(`Evento inativo no catálogo: ${eventName}.`);
    }

    if (eventName === ANALYTICS_EVENT_NAMES.imageViewed && typeof meta.image_id === 'string') {
      imagesViewed.add(meta.image_id);
    }
    if (eventName === ANALYTICS_EVENT_NAMES.imageZoomed && typeof meta.image_id === 'string') {
      imagesZoomed.add(meta.image_id);
    }

    const videoId = resolveVideoId(meta);
    const isVideoEvent =
      eventName === ANALYTICS_EVENT_NAMES.videoStarted ||
      eventName === ANALYTICS_EVENT_NAMES.videoCompleted ||
      eventName === ANALYTICS_EVENT_NAMES.videoProgressRecorded;

    if (isVideoEvent && (videoId || isEscolaDigitalVideo(meta))) {
      const id = videoId ?? 'escola_digital_video';
      if (eventName === ANALYTICS_EVENT_NAMES.videoStarted) videoStarted.add(id);
      if (eventName === ANALYTICS_EVENT_NAMES.videoCompleted) videoCompleted.add(id);
      if (eventName === ANALYTICS_EVENT_NAMES.videoProgressRecorded) {
        const progress =
          typeof meta.max_progress_percent === 'number' ? meta.max_progress_percent : 0;
        videoProgressById.set(id, Math.max(videoProgressById.get(id) ?? 0, progress));
      }
    }

    const linkId = resolveResourceLinkId(meta);
    if (isResourceEngagementEvent(event) && linkId && !resourcesOpened.has(linkId)) {
      orphanEngagementLinks.add(linkId);
    }
  }

  for (const linkId of orphanEngagementLinks) {
    inconsistent_event_warnings.push(
      `resource_engagement_recorded para "${linkId}" sem resource_opened prévio.`,
    );
  }

  const zoomWithoutView = [...imagesZoomed].filter((id) => !imagesViewed.has(id));
  if (zoomWithoutView.length > 0) {
    inconsistent_event_warnings.push(
      `image_zoomed sem image_viewed: ${zoomWithoutView.join(', ')}.`,
    );
  }

  const completedWithoutStart = [...videoCompleted].filter((id) => !videoStarted.has(id));
  if (completedWithoutStart.length > 0) {
    inconsistent_event_warnings.push(
      `video_completed sem video_started: ${completedWithoutStart.join(', ')}.`,
    );
  }

  for (const videoId of videoCompleted) {
    const progress = videoProgressById.get(videoId);
    if (typeof progress === 'number' && progress >= 95) {
      duplicate_event_warnings.push(
        `video_completed e video_progress_recorded (${progress}%) para o mesmo vídeo "${videoId}".`,
      );
    }
  }

  let summedTeacherSeconds = 0;
  const teacherOpenStacks = new Map<string, number>();

  for (const event of events) {
    const meta = event.metadata ?? {};
    const sectionId = resolveTeacherSectionId(meta);

    if (event.event_name === ANALYTICS_EVENT_NAMES.teacherButtonOpened && sectionId) {
      teacherOpenStacks.set(sectionId, (teacherOpenStacks.get(sectionId) ?? 0) + 1);
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.teacherButtonClosed) {
      if (sectionId) {
        const opens = teacherOpenStacks.get(sectionId) ?? 0;
        if (opens <= 0) {
          inconsistent_event_warnings.push(
            `teacher_button_closed na seção "${sectionId}" sem abertura correspondente.`,
          );
        } else {
          teacherOpenStacks.set(sectionId, opens - 1);
        }
      }
      const duration = meta.duration_seconds;
      if (typeof duration === 'number') summedTeacherSeconds += duration;
    }
  }

  for (const [sectionId, pendingOpens] of teacherOpenStacks) {
    if (pendingOpens > 0) {
      inconsistent_event_warnings.push(
        `${pendingOpens} abertura(s) do botão do professor na seção "${sectionId}" sem fechamento registrado.`,
      );
    }
  }

  if (
    summary.teacher_button_closed_count > 0 &&
    Math.abs(summedTeacherSeconds - summary.teacher_button_total_seconds) > 1
  ) {
    inconsistent_event_warnings.push(
      `teacher_button_total_seconds (${summary.teacher_button_total_seconds}) difere da soma dos fechamentos (${summedTeacherSeconds}).`,
    );
  }

  for (const section of summary.teacher_button_usage_by_section) {
    if (section.opened_more_than_once !== section.open_count > 1) {
      inconsistent_event_warnings.push(
        `teacher_button_usage_by_section: flag opened_more_than_once inconsistente na seção "${section.section_id}".`,
      );
    }
    if (section.open_count > 1 && !section.opened_more_than_once) {
      inconsistent_event_warnings.push(
        `Seção "${section.section_id}" aberta ${section.open_count} vezes sem marcar repetição.`,
      );
    }
  }

  const checks = buildCollectionQualityChecks(events, summary);
  let score = 100;
  let hasCritical = false;

  for (const check of checks) {
    if (check.ok) continue;
    if (check.severity === 'critical') {
      hasCritical = true;
      score = deductScore(score, 20);
    } else if (check.severity === 'major') {
      score = deductScore(score, 10);
    } else {
      score = deductScore(score, 5);
    }
  }

  score = deductScore(score, Math.min(missing_expected_events.length * 5, 15));
  score = deductScore(score, Math.min(duplicate_event_warnings.length * 8, 24));
  score = deductScore(score, Math.min(inconsistent_event_warnings.length * 6, 30));
  score = deductScore(score, Math.min(unexpected_event_warnings.length * 4, 12));

  const data_quality_score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    data_quality_score,
    event_integrity_status: resolveIntegrityStatus(data_quality_score, hasCritical),
    missing_expected_events,
    duplicate_event_warnings,
    inconsistent_event_warnings,
    unexpected_event_warnings,
  };
}
