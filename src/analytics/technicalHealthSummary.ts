import type { AnalyticsEvent } from './eventTypes';
import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import type { LoadedImageWeight } from './captureResourceTiming';

export interface AssetLoadFailure {
  asset_type: string;
  src: string;
}

export interface LinkOpenFailure {
  link_id: string;
  page: number;
  href: string;
  http_status: number | null;
}

export interface TechnicalHealthSummary {
  page_load_time_ms: number | null;
  dom_content_loaded_ms: number | null;
  ttfb_ms: number | null;
  session_bytes_transferred: number | null;
  session_image_bytes_transferred: number | null;
  resources_loaded_count: number | null;
  largest_images_loaded: LoadedImageWeight[];
  bytes_from_cache_only: boolean;
  runtime_errors_count: number;
  render_errors_count: number;
  asset_load_errors_count: number;
  links_open_failed_count: number;
  runtime_error_messages: string[];
  render_error_boundaries: string[];
  render_error_pages: number[];
  asset_load_failures: AssetLoadFailure[];
  links_open_failed: LinkOpenFailure[];
  has_technical_issues: boolean;
}

const EMPTY_TECHNICAL_HEALTH: TechnicalHealthSummary = {
  page_load_time_ms: null,
  dom_content_loaded_ms: null,
  ttfb_ms: null,
  session_bytes_transferred: null,
  session_image_bytes_transferred: null,
  resources_loaded_count: null,
  largest_images_loaded: [],
  bytes_from_cache_only: false,
  runtime_errors_count: 0,
  render_errors_count: 0,
  asset_load_errors_count: 0,
  links_open_failed_count: 0,
  runtime_error_messages: [],
  render_error_boundaries: [],
  render_error_pages: [],
  asset_load_failures: [],
  links_open_failed: [],
  has_technical_issues: false,
};

function pickLoadTiming(events: AnalyticsEvent[]): Partial<TechnicalHealthSummary> {
  const timingEvents = events.filter(
    (event) =>
      event.event_name === ANALYTICS_EVENT_NAMES.bookOpened ||
      event.event_name === ANALYTICS_EVENT_NAMES.sessionResumed,
  );

  const last = timingEvents[timingEvents.length - 1];
  if (!last?.metadata) return {};

  const meta = last.metadata;
  const page_load_time_ms =
    typeof meta.page_load_time_ms === 'number' ? meta.page_load_time_ms : null;
  const dom_content_loaded_ms =
    typeof meta.dom_content_loaded_ms === 'number' ? meta.dom_content_loaded_ms : null;
  const ttfb_ms = typeof meta.ttfb_ms === 'number' ? meta.ttfb_ms : null;

  if (page_load_time_ms === null && dom_content_loaded_ms === null && ttfb_ms === null) {
    return {};
  }

  return { page_load_time_ms, dom_content_loaded_ms, ttfb_ms };
}

const RESOURCE_TIMING_EVENT_NAMES = new Set([
  ANALYTICS_EVENT_NAMES.resourceTimingSnapshot,
  ANALYTICS_EVENT_NAMES.eventsExported,
  ANALYTICS_EVENT_NAMES.sessionFinished,
]);

function parseResourceTimingMeta(
  meta: Record<string, unknown> | undefined,
): Partial<TechnicalHealthSummary> | null {
  if (!meta || typeof meta.resources_loaded_count !== 'number') return null;

  const largestRaw = meta.largest_images;

  return {
    session_bytes_transferred:
      typeof meta.session_bytes_transferred === 'number'
        ? meta.session_bytes_transferred
        : 0,
    session_image_bytes_transferred:
      typeof meta.session_image_bytes_transferred === 'number'
        ? meta.session_image_bytes_transferred
        : 0,
    resources_loaded_count: meta.resources_loaded_count,
    largest_images_loaded: Array.isArray(largestRaw)
      ? largestRaw
          .filter(
            (item): item is LoadedImageWeight =>
              typeof item === 'object' &&
              item !== null &&
              typeof (item as LoadedImageWeight).src === 'string' &&
              typeof (item as LoadedImageWeight).bytes === 'number',
          )
          .map((item) => ({ src: item.src, bytes: item.bytes }))
      : [],
    bytes_from_cache_only: meta.bytes_from_cache_only === true,
  };
}

function pickResourceTiming(events: AnalyticsEvent[]): Partial<TechnicalHealthSummary> {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!RESOURCE_TIMING_EVENT_NAMES.has(event.event_name)) continue;

    const parsed = parseResourceTimingMeta(event.metadata);
    if (parsed) return parsed;
  }

  return {};
}

export function buildTechnicalHealthSummary(events: AnalyticsEvent[]): TechnicalHealthSummary {
  const runtimeMessages = new Set<string>();
  const renderBoundaries = new Set<string>();
  const renderPages = new Set<number>();
  const assetFailures = new Map<string, AssetLoadFailure>();
  const linkFailures = new Map<string, LinkOpenFailure>();
  let runtime_errors_count = 0;
  let render_errors_count = 0;
  let asset_load_errors_count = 0;
  let links_open_failed_count = 0;

  for (const event of events) {
    const meta = event.metadata ?? {};

    if (event.event_name === ANALYTICS_EVENT_NAMES.runtimeError) {
      runtime_errors_count += 1;
      if (typeof meta.error_message === 'string') {
        runtimeMessages.add(meta.error_message);
      }
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.renderError) {
      render_errors_count += 1;
      if (typeof meta.boundary === 'string') {
        renderBoundaries.add(meta.boundary);
      }
      if (typeof meta.page === 'number') {
        renderPages.add(meta.page);
      }
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.assetLoadError) {
      asset_load_errors_count += 1;
      const asset_type = typeof meta.asset_type === 'string' ? meta.asset_type : 'unknown';
      const src = typeof meta.src === 'string' ? meta.src : '—';
      assetFailures.set(`${asset_type}:${src}`, { asset_type, src });
    }

    if (event.event_name === ANALYTICS_EVENT_NAMES.linkOpenFailed) {
      links_open_failed_count += 1;
      const link_id = typeof meta.link_id === 'string' ? meta.link_id : '—';
      const page = typeof meta.page === 'number' ? meta.page : 0;
      const href = typeof meta.href === 'string' ? meta.href : '—';
      const http_status = typeof meta.http_status === 'number' ? meta.http_status : null;
      linkFailures.set(link_id, { link_id, page, href, http_status });
    }
  }

  const loadTiming = pickLoadTiming(events);
  const resourceTiming = pickResourceTiming(events);
  const has_technical_issues =
    runtime_errors_count > 0 ||
    render_errors_count > 0 ||
    asset_load_errors_count > 0 ||
    links_open_failed_count > 0 ||
    events.some((event) => event.event_name === ANALYTICS_EVENT_NAMES.imageLoadError);

  return {
    ...EMPTY_TECHNICAL_HEALTH,
    ...loadTiming,
    ...resourceTiming,
    runtime_errors_count,
    render_errors_count,
    asset_load_errors_count,
    links_open_failed_count,
    runtime_error_messages: [...runtimeMessages],
    render_error_boundaries: [...renderBoundaries],
    render_error_pages: [...renderPages].sort((a, b) => a - b),
    asset_load_failures: [...assetFailures.values()],
    links_open_failed: [...linkFailures.values()],
    has_technical_issues,
  };
}

export function enrichSummaryTechnicalHealth<T extends Record<string, unknown>>(
  summary: T,
  events: AnalyticsEvent[],
): T & TechnicalHealthSummary {
  if (events.length === 0) {
    return {
      ...EMPTY_TECHNICAL_HEALTH,
      ...summary,
      has_technical_issues:
        Boolean(summary.has_technical_issues) ||
        (Array.isArray(summary.images_with_errors) && summary.images_with_errors.length > 0),
    } as T & TechnicalHealthSummary;
  }

  const built = buildTechnicalHealthSummary(events);
  const imagesWithErrors = Array.isArray(summary.images_with_errors)
    ? summary.images_with_errors
    : [];

  return {
    ...summary,
    ...built,
    has_technical_issues: built.has_technical_issues || imagesWithErrors.length > 0,
  } as T & TechnicalHealthSummary;
}
