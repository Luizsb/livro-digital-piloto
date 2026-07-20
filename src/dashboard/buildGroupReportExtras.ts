import type { ChapterManifest } from '@book/chapter/chapterManifest';
import type { ParsedDashboardReport } from './types';
import { getParticipantLabel } from './reportExtractors';
import { getLoadTimeRating } from './reportExtractors';
import { assessEscolaDigitalVideoCredibility } from './videoCredibility';

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function shortResourceId(id: string): string {
  if (id.includes('video') || id.includes('escola')) return 'Vídeo Escola Digital';
  if (id.includes('oda')) {
    const page = id.match(/page_(\d+)/)?.[1];
    return page ? `ODA (pág. ${page})` : 'ODA';
  }
  return id.replace(/_/g, ' ');
}

function shortImageId(id: string): string {
  const page = id.match(/page_(\d+)/)?.[1];
  if (page) return `Pág. ${page}`;
  return id.replace(/_/g, ' ');
}

export interface GroupResourceCoverageItem {
  resource_id: string;
  label: string;
  sessions_opened: number;
  sessions_total: number;
  open_pct: number;
}

export interface GroupImageCoverageItem {
  image_id: string;
  label: string;
  sessions_viewed: number;
  sessions_zoomed: number;
  zoom_total: number;
  view_pct: number;
}

export interface GroupParticipantResourceRow {
  participant_id: string;
  file_name: string;
  oda_opened: boolean;
  oda_seconds: number;
  escola_seconds: number;
  video_played: boolean;
  video_progress_pct: number;
  video_watch_seconds: number;
  video_playback_wall_seconds: number;
  video_seek_count: number;
  video_completed: boolean;
  video_skip_suspected: boolean;
  image_zoom_total: number;
  resources_missed: string[];
  images_not_seen: string[];
}

export interface GroupResourcesDetail {
  coverage_resources: GroupResourceCoverageItem[];
  coverage_images: GroupImageCoverageItem[];
  participants: GroupParticipantResourceRow[];
  video_skip_suspected_count: number;
}

export interface GroupTechnicalSessionDetail {
  participant_id: string;
  file_name: string;
  device_label: string;
  os_name: string;
  browser_label: string;
  viewport: string;
  page_load_time_ms: number | null;
  ttfb_ms: number | null;
  session_bytes: number | null;
  runtime_errors: number;
  asset_errors: number;
  render_errors: number;
  has_technical_issues: boolean;
  data_quality_score: number | null;
  load_rating: string | null;
}

export interface GroupTechnicalDetail {
  avg_page_load_ms: number | null;
  avg_ttfb_ms: number | null;
  avg_session_bytes: number | null;
  sessions: GroupTechnicalSessionDetail[];
  qa_ready: boolean;
  qa_notes: string[];
}

function resolveManifest(sessions: ParsedDashboardReport[]): ChapterManifest | null {
  return sessions[0]?.chapterManifest ?? null;
}

export function buildGroupResourcesDetail(
  sessions: ParsedDashboardReport[],
): GroupResourcesDetail {
  const n = sessions.length;
  const manifest = resolveManifest(sessions);
  const expectedResources = manifest?.expected_resources ?? [];
  const expectedImages = manifest?.expected_images ?? [];

  const coverage_resources: GroupResourceCoverageItem[] = expectedResources.map((resource_id) => {
    const sessions_opened = sessions.filter(
      (s) => !(s.summary.resources_not_opened ?? []).includes(resource_id),
    ).length;
    return {
      resource_id,
      label: shortResourceId(resource_id),
      sessions_opened,
      sessions_total: n,
      open_pct: n > 0 ? Math.round((sessions_opened / n) * 100) : 0,
    };
  });

  const coverage_images: GroupImageCoverageItem[] = expectedImages.map((image_id) => {
    const sessions_viewed = sessions.filter(
      (s) => !(s.summary.images_not_exposed ?? []).includes(image_id),
    ).length;
    const sessions_zoomed = sessions.filter((s) =>
      s.events.some(
        (e) => e.event_name === 'image_zoomed' && e.metadata?.image_id === image_id,
      ),
    ).length;
    const zoom_total = sessions.reduce((sum, s) => {
      const count = s.events.filter(
        (e) => e.event_name === 'image_zoomed' && e.metadata?.image_id === image_id,
      ).length;
      return sum + count;
    }, 0);
    return {
      image_id,
      label: shortImageId(image_id),
      sessions_viewed,
      sessions_zoomed,
      zoom_total,
      view_pct: n > 0 ? Math.round((sessions_viewed / n) * 100) : 0,
    };
  });

  const participants: GroupParticipantResourceRow[] = sessions.map((session) => {
    const { summary } = session;
    const videoCredibility = assessEscolaDigitalVideoCredibility(summary);
    return {
      participant_id: getParticipantLabel(summary),
      file_name: session.sourceFileName ?? '—',
      oda_opened: summary.oda_opened_count > 0,
      oda_seconds: summary.oda_engagement_total_seconds,
      escola_seconds: summary.escola_digital_engagement_total_seconds,
      video_played: summary.escola_digital_video_play_count > 0,
      video_progress_pct: summary.escola_digital_video_max_progress_percent,
      video_watch_seconds: summary.escola_digital_video_watch_total_seconds,
      video_playback_wall_seconds: summary.escola_digital_video_playback_wall_seconds,
      video_seek_count: summary.escola_digital_video_seek_count,
      video_completed: summary.escola_digital_video_watched_to_end,
      video_skip_suspected: videoCredibility.suspectedSkip,
      image_zoom_total: summary.image_zoom_total,
      resources_missed: summary.resources_not_opened ?? [],
      images_not_seen: summary.images_not_exposed ?? [],
    };
  });

  const video_skip_suspected_count = participants.filter((row) => row.video_skip_suspected).length;

  return { coverage_resources, coverage_images, participants, video_skip_suspected_count };
}

export function buildGroupTechnicalDetail(
  sessions: ParsedDashboardReport[],
  technicalIssuesCount: number,
  reliableSessionCount: number,
  sessionCount: number,
): GroupTechnicalDetail {
  const loadTimes: number[] = [];
  const ttfbTimes: number[] = [];
  const byteSizes: number[] = [];
  const qa_notes: string[] = [];

  const sessionRows: GroupTechnicalSessionDetail[] = sessions.map((session) => {
    const { summary } = session;
    if (typeof summary.page_load_time_ms === 'number' && summary.page_load_time_ms > 0) {
      loadTimes.push(summary.page_load_time_ms);
    }
    if (typeof summary.ttfb_ms === 'number' && summary.ttfb_ms > 0) {
      ttfbTimes.push(summary.ttfb_ms);
    }
    if (typeof summary.session_bytes_transferred === 'number' && summary.session_bytes_transferred > 0) {
      byteSizes.push(summary.session_bytes_transferred);
    }

    const viewport =
      summary.viewport_width && summary.viewport_height
        ? `${summary.viewport_width}×${summary.viewport_height}`
        : '—';

    const page_load_time_ms = summary.page_load_time_ms ?? null;
    const load_rating =
      page_load_time_ms !== null ? getLoadTimeRating(page_load_time_ms)?.label ?? null : null;

    return {
      participant_id: getParticipantLabel(summary),
      file_name: session.sourceFileName ?? '—',
      device_label: summary.device_type_label ?? summary.device_type ?? '—',
      os_name: summary.os_name ?? '—',
      browser_label: summary.browser_name
        ? `${summary.browser_name}${summary.browser_version ? ` ${summary.browser_version}` : ''}`
        : '—',
      viewport,
      page_load_time_ms,
      ttfb_ms: summary.ttfb_ms ?? null,
      session_bytes: summary.session_bytes_transferred ?? null,
      runtime_errors: summary.runtime_errors_count ?? 0,
      asset_errors: summary.asset_load_errors_count ?? 0,
      render_errors: summary.render_errors_count ?? 0,
      has_technical_issues: summary.has_technical_issues === true,
      data_quality_score:
        typeof summary.data_quality_score === 'number' ? summary.data_quality_score : null,
      load_rating,
    };
  });

  if (technicalIssuesCount > 0) {
    qa_notes.push(
      `${technicalIssuesCount} sessão(ões) com alertas técnicos — revisar antes de escalar.`,
    );
  }
  if (reliableSessionCount < sessionCount) {
    qa_notes.push(
      `${sessionCount - reliableSessionCount} sessão(ões) com qualidade da coleta abaixo do limiar.`,
    );
  }
  const slowLoads = sessionRows.filter(
    (row) => row.page_load_time_ms !== null && row.page_load_time_ms > 4000,
  ).length;
  if (slowLoads > 0) {
    qa_notes.push(`${slowLoads} sessão(ões) com carregamento acima de 4s.`);
  }
  if (qa_notes.length === 0) {
    qa_notes.push('Nenhum bloqueador crítico identificado neste lote.');
  }

  const qa_ready = technicalIssuesCount === 0 && reliableSessionCount === sessionCount;

  return {
    avg_page_load_ms: average(loadTimes),
    avg_ttfb_ms: average(ttfbTimes),
    avg_session_bytes: average(byteSizes),
    sessions: sessionRows,
    qa_ready,
    qa_notes,
  };
}
