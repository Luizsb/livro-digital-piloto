import type { AnalyticsEvent } from '@analytics/sessionTypes';
import type { ParsedDashboardReport } from './types';
import { DEVICE_TYPE_LABELS, type DeviceType } from '@analytics/deviceContext';
import { getChapterPageNumbers } from './reportExtractors';

export interface EventRankingItem {
  event_name: string;
  count: number;
}

export interface PageDwellItem {
  page: number;
  avg_seconds: number | null;
  sample_count: number;
}

export interface TeacherSectionItem {
  section_id: string;
  page: number | null;
  open_count: number;
  sessions_count: number;
}

export interface ImageInteractionItem {
  image_id: string;
  viewed_sessions: number;
  zoomed_sessions: number;
  zoom_total: number;
  interaction_pct: number;
}

export interface ResourceRankingItem {
  resource_id: string;
  resource_type: string;
  open_count: number;
  sessions_count: number;
}

export interface LoadTimeByDeviceItem {
  device_type: string;
  device_label: string;
  avg_load_ms: number;
  session_count: number;
}

export interface GroupAdvancedAnalytics {
  top_events: EventRankingItem[];
  page_dwell: PageDwellItem[];
  teacher_sections: TeacherSectionItem[];
  image_interaction: ImageInteractionItem[];
  resource_ranking: ResourceRankingItem[];
  load_time_by_device: LoadTimeByDeviceItem[];
}

function increment(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function extractPageFromTeacherId(sectionId: string): number | null {
  const match = sectionId.match(/page_(\d+)/);
  return match ? Number(match[1]) : null;
}

function getResourceId(event: AnalyticsEvent): string {
  const meta = event.metadata ?? {};
  if (typeof meta.link_id === 'string') return meta.link_id;
  if (typeof meta.resource_id === 'string') return meta.resource_id;
  if (typeof meta.video_id === 'string') return meta.video_id;
  return 'desconhecido';
}

export function buildGroupAdvancedAnalytics(
  sessions: ParsedDashboardReport[],
): GroupAdvancedAnalytics {
  const eventTotals: Record<string, number> = {};
  const pageDwellSamples: Record<number, number[]> = {};
  const teacherOpens: Record<string, { opens: number; sessions: Set<string> }> = {};
  const imageViewedSessions: Record<string, Set<string>> = {};
  const imageZoomedSessions: Record<string, Set<string>> = {};
  const imageZoomTotals: Record<string, number> = {};
  const resourceOpens: Record<string, { type: string; opens: number; sessions: Set<string> }> =
    {};
  const loadTimeByDevice: Record<string, number[]> = {};

  for (const session of sessions) {
    const sessionId = session.summary.session_ids[0] ?? session.sourceFileName ?? 'unknown';
    const deviceType = session.summary.device_type ?? 'unknown';

    for (const [name, count] of Object.entries(session.summary.by_event_name)) {
      increment(eventTotals, name, count);
    }

    for (const row of session.summary.teacher_button_usage_by_section ?? []) {
      const key = row.section_id;
      if (!teacherOpens[key]) {
        teacherOpens[key] = { opens: 0, sessions: new Set() };
      }
      teacherOpens[key].opens += row.open_count;
      if (row.open_count > 0) teacherOpens[key].sessions.add(sessionId);
    }

    const loadMs = session.summary.page_load_time_ms;
    if (typeof loadMs === 'number' && loadMs > 0) {
      if (!loadTimeByDevice[deviceType]) loadTimeByDevice[deviceType] = [];
      loadTimeByDevice[deviceType].push(loadMs);
    }

    for (const event of session.events) {
      if (event.event_name === 'page_completed') {
        const page = event.metadata?.page;
        const duration = event.metadata?.duration_seconds;
        if (typeof page === 'number' && typeof duration === 'number') {
          if (!pageDwellSamples[page]) pageDwellSamples[page] = [];
          pageDwellSamples[page].push(duration);
        }
      }

      if (event.event_name === 'image_viewed' && typeof event.metadata?.image_id === 'string') {
        const id = event.metadata.image_id;
        if (!imageViewedSessions[id]) imageViewedSessions[id] = new Set();
        imageViewedSessions[id].add(sessionId);
      }

      if (event.event_name === 'image_zoomed' && typeof event.metadata?.image_id === 'string') {
        const id = event.metadata.image_id;
        if (!imageZoomedSessions[id]) imageZoomedSessions[id] = new Set();
        imageZoomedSessions[id].add(sessionId);
        increment(imageZoomTotals, id);
      }

      if (event.event_name === 'resource_opened') {
        const id = getResourceId(event);
        const type = String(event.metadata?.type ?? 'recurso');
        if (!resourceOpens[id]) {
          resourceOpens[id] = { type, opens: 0, sessions: new Set() };
        }
        resourceOpens[id].opens += 1;
        resourceOpens[id].sessions.add(sessionId);
      }
    }
  }

  const chapterPages = sessions.length > 0 ? getChapterPageNumbers(sessions[0].summary) : [];

  const top_events = Object.entries(eventTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([event_name, count]) => ({ event_name, count }));

  const page_dwell = chapterPages.map((page) => {
    const samples = pageDwellSamples[page] ?? [];
    return {
      page,
      avg_seconds: average(samples),
      sample_count: samples.length,
    };
  });

  const teacher_sections = Object.entries(teacherOpens)
    .map(([section_id, data]) => ({
      section_id,
      page: extractPageFromTeacherId(section_id),
      open_count: data.opens,
      sessions_count: data.sessions.size,
    }))
    .sort((a, b) => b.open_count - a.open_count);

  const allImageIds = new Set([
    ...Object.keys(imageViewedSessions),
    ...Object.keys(imageZoomedSessions),
  ]);

  const image_interaction = [...allImageIds]
    .map((image_id) => {
      const viewed = imageViewedSessions[image_id]?.size ?? 0;
      const zoomed = imageZoomedSessions[image_id]?.size ?? 0;
      return {
        image_id,
        viewed_sessions: viewed,
        zoomed_sessions: zoomed,
        zoom_total: imageZoomTotals[image_id] ?? 0,
        interaction_pct: viewed > 0 ? Math.round((zoomed / viewed) * 100) : 0,
      };
    })
    .sort((a, b) => b.viewed_sessions - a.viewed_sessions);

  const resource_ranking = Object.entries(resourceOpens)
    .map(([resource_id, data]) => ({
      resource_id,
      resource_type: data.type,
      open_count: data.opens,
      sessions_count: data.sessions.size,
    }))
    .sort((a, b) => b.open_count - a.open_count);

  const load_time_by_device = Object.entries(loadTimeByDevice)
    .map(([device_type, values]) => ({
      device_type,
      device_label:
        device_type in DEVICE_TYPE_LABELS
          ? DEVICE_TYPE_LABELS[device_type as DeviceType]
          : device_type,
      avg_load_ms: Math.round(average(values) ?? 0),
      session_count: values.length,
    }))
    .sort((a, b) => b.session_count - a.session_count);

  return {
    top_events,
    page_dwell,
    teacher_sections,
    image_interaction,
    resource_ranking,
    load_time_by_device,
  };
}
