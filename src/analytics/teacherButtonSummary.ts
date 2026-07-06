import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import type { AnalyticsEvent } from './sessionTypes';

export interface TeacherButtonSectionUsage {
  section_id: string;
  teacher_button_id: string;
  page: number;
  open_count: number;
  close_count: number;
  total_seconds: number;
  avg_seconds: number;
  opened_more_than_once: boolean;
}

export interface MostOpenedTeacherSection {
  section_id: string;
  page: number;
  open_count: number;
  total_seconds: number;
}

export interface TeacherButtonSummary {
  teacher_button_opened_count: number;
  teacher_button_closed_count: number;
  teacher_button_total_seconds: number;
  teacher_sections_opened: string[];
  teacher_button_usage_by_section: TeacherButtonSectionUsage[];
  teacher_button_unique_count: number;
  teacher_button_repeated_count: number;
  teacher_button_repeated_sections: string[];
  most_opened_teacher_section: MostOpenedTeacherSection | null;
}

interface SectionAccumulator {
  section_id: string;
  teacher_button_id: string;
  page: number;
  open_count: number;
  close_count: number;
  total_seconds: number;
}

function resolveSectionId(meta: Record<string, unknown>): string | null {
  if (typeof meta.section_id === 'string') return meta.section_id;
  if (typeof meta.section === 'string') return meta.section;
  return null;
}

function getOrCreateSection(
  map: Map<string, SectionAccumulator>,
  sectionId: string,
  meta: Record<string, unknown>,
): SectionAccumulator {
  const existing = map.get(sectionId);
  if (existing) return existing;

  const page = typeof meta.page === 'number' ? meta.page : 0;
  const teacherButtonId =
    typeof meta.teacher_button_id === 'string'
      ? meta.teacher_button_id
      : `teacher_button_page_${page}`;

  const entry: SectionAccumulator = {
    section_id: sectionId,
    teacher_button_id: teacherButtonId,
    page,
    open_count: 0,
    close_count: 0,
    total_seconds: 0,
  };
  map.set(sectionId, entry);
  return entry;
}

function roundAvgSeconds(totalSeconds: number, closeCount: number): number {
  if (closeCount <= 0) return 0;
  return Math.round((totalSeconds / closeCount) * 10) / 10;
}

export function buildTeacherButtonSummary(events: AnalyticsEvent[]): TeacherButtonSummary {
  const bySection = new Map<string, SectionAccumulator>();
  let teacherButtonOpenedCount = 0;
  let teacherButtonClosedCount = 0;
  let teacherButtonTotalSeconds = 0;

  for (const event of events) {
    const meta = event.metadata ?? {};

    if (event.event_name === ANALYTICS_EVENT_NAMES.teacherButtonOpened) {
      teacherButtonOpenedCount += 1;
      const sectionId = resolveSectionId(meta);
      if (!sectionId) continue;
      const entry = getOrCreateSection(bySection, sectionId, meta);
      entry.open_count += 1;
      if (typeof meta.page === 'number') entry.page = meta.page;
      if (typeof meta.teacher_button_id === 'string') {
        entry.teacher_button_id = meta.teacher_button_id;
      }
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.teacherButtonClosed) {
      teacherButtonClosedCount += 1;
      const sectionId = resolveSectionId(meta);
      if (!sectionId) continue;
      const entry = getOrCreateSection(bySection, sectionId, meta);
      entry.close_count += 1;
      if (typeof meta.page === 'number') entry.page = meta.page;
      if (typeof meta.teacher_button_id === 'string') {
        entry.teacher_button_id = meta.teacher_button_id;
      }
      const duration = meta.duration_seconds;
      if (typeof duration === 'number') {
        entry.total_seconds += duration;
        teacherButtonTotalSeconds += duration;
      }
    }
  }

  const teacher_button_usage_by_section: TeacherButtonSectionUsage[] = [...bySection.values()]
    .sort((a, b) => a.page - b.page || a.section_id.localeCompare(b.section_id))
    .map((entry) => ({
      section_id: entry.section_id,
      teacher_button_id: entry.teacher_button_id,
      page: entry.page,
      open_count: entry.open_count,
      close_count: entry.close_count,
      total_seconds: entry.total_seconds,
      avg_seconds: roundAvgSeconds(entry.total_seconds, entry.close_count),
      opened_more_than_once: entry.open_count > 1,
    }));

  const teacher_button_repeated_sections = teacher_button_usage_by_section
    .filter((row) => row.opened_more_than_once)
    .map((row) => row.section_id);

  const mostOpened = teacher_button_usage_by_section.reduce<TeacherButtonSectionUsage | null>(
    (best, row) => {
      if (!best) return row;
      if (row.open_count > best.open_count) return row;
      if (row.open_count === best.open_count && row.total_seconds > best.total_seconds) return row;
      return best;
    },
    null,
  );

  return {
    teacher_button_opened_count: teacherButtonOpenedCount,
    teacher_button_closed_count: teacherButtonClosedCount,
    teacher_button_total_seconds: teacherButtonTotalSeconds,
    teacher_sections_opened: teacher_button_usage_by_section.map((row) => row.section_id),
    teacher_button_usage_by_section,
    teacher_button_unique_count: teacher_button_usage_by_section.length,
    teacher_button_repeated_count: teacher_button_repeated_sections.length,
    teacher_button_repeated_sections,
    most_opened_teacher_section: mostOpened
      ? {
          section_id: mostOpened.section_id,
          page: mostOpened.page,
          open_count: mostOpened.open_count,
          total_seconds: mostOpened.total_seconds,
        }
      : null,
  };
}
