import { isPageTrackingReady } from './ldBootstrap';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';

export interface TeacherButtonIds {
  page: number;
  teacher_button_id: string;
  section_id: string;
}

export function buildTeacherButtonIds(page: number): TeacherButtonIds {
  return {
    page,
    teacher_button_id: `teacher_button_page_${page}`,
    section_id: `teacher_section_page_${page}`,
  };
}

interface OpenTeacherButtonSession extends TeacherButtonIds {
  openedAtMs: number;
}

const openSessions: OpenTeacherButtonSession[] = [];

function computeDurationSeconds(openedAtMs: number): number {
  return Math.max(1, Math.round((Date.now() - openedAtMs) / 1000));
}

export interface TrackTeacherButtonOpenedInput extends TeacherButtonIds {
  sessionId: string;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackTeacherButtonOpened({
  sessionId,
  page,
  teacher_button_id,
  section_id,
  track,
}: TrackTeacherButtonOpenedInput): void {
  if (!isPageTrackingReady(sessionId)) return;

  // Chamado apenas a partir do onClick em TeacherButton — não em efeitos de render.
  track(ANALYTICS_EVENT_NAMES.teacherButtonOpened, {
    page,
    teacher_button_id,
    section_id,
  });

  openSessions.push({
    page,
    teacher_button_id,
    section_id,
    openedAtMs: Date.now(),
  });
}

export interface TrackTeacherButtonClosedInput extends TeacherButtonIds {
  durationSeconds: number;
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
}

export function trackTeacherButtonClosed({
  page,
  teacher_button_id,
  section_id,
  durationSeconds,
  track,
}: TrackTeacherButtonClosedInput): void {
  track(ANALYTICS_EVENT_NAMES.teacherButtonClosed, {
    page,
    teacher_button_id,
    section_id,
    duration_seconds: durationSeconds,
  });
}

function removeOpenSession(sectionId: string): OpenTeacherButtonSession | null {
  const index = openSessions.findIndex((session) => session.section_id === sectionId);
  if (index === -1) return null;
  const [session] = openSessions.splice(index, 1);
  return session;
}

export function closeTeacherButtonBySection(
  sectionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): boolean {
  const session = removeOpenSession(sectionId);
  if (!session) return false;

  trackTeacherButtonClosed({
    page: session.page,
    teacher_button_id: session.teacher_button_id,
    section_id: session.section_id,
    durationSeconds: computeDurationSeconds(session.openedAtMs),
    track,
  });
  return true;
}

/** Fecha modais do professor ainda abertos antes de encerrar capítulo/sessão. */
export function closeAllOpenTeacherButtons(
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
): void {
  while (openSessions.length > 0) {
    const session = openSessions.shift();
    if (!session) break;

    trackTeacherButtonClosed({
      page: session.page,
      teacher_button_id: session.teacher_button_id,
      section_id: session.section_id,
      durationSeconds: computeDurationSeconds(session.openedAtMs),
      track,
    });
  }
}
