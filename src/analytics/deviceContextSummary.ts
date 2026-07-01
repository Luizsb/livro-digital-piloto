import type { AnalyticsEvent } from './eventTypes';
import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import type { SessionDeviceContext } from './deviceContext';

const DEVICE_METADATA_KEYS = [
  'device_type',
  'device_type_label',
  'os_name',
  'browser_name',
  'browser_version',
  'screen_width',
  'screen_height',
  'viewport_width',
  'viewport_height',
  'pixel_ratio',
  'is_touch_device',
  'app_language',
  'browser_language',
  'browser_languages',
] as const satisfies ReadonlyArray<keyof SessionDeviceContext>;

export type SessionDeviceSummary = Pick<SessionDeviceContext, (typeof DEVICE_METADATA_KEYS)[number]>;

function normalizeLanguageFields(
  metadata: Record<string, unknown>,
): Pick<SessionDeviceSummary, 'app_language' | 'browser_language' | 'browser_languages'> {
  if (typeof metadata.app_language === 'string') {
    return {
      app_language: metadata.app_language,
      browser_language:
        typeof metadata.browser_language === 'string' ? metadata.browser_language : '—',
      browser_languages:
        typeof metadata.browser_languages === 'string' ? metadata.browser_languages : '—',
    };
  }

  const legacyLanguage = typeof metadata.language === 'string' ? metadata.language : '—';
  return {
    app_language: 'pt-BR',
    browser_language: legacyLanguage,
    browser_languages: legacyLanguage,
  };
}

export function extractDeviceContextFromMetadata(
  metadata: Record<string, unknown> | undefined,
): SessionDeviceSummary | null {
  if (!metadata || typeof metadata.device_type !== 'string') return null;

  const device_type = metadata.device_type;
  if (device_type !== 'desktop' && device_type !== 'tablet' && device_type !== 'mobile') {
    return null;
  }

  return {
    device_type,
    device_type_label:
      typeof metadata.device_type_label === 'string' ? metadata.device_type_label : device_type,
    os_name: typeof metadata.os_name === 'string' ? metadata.os_name : 'Outro',
    browser_name: typeof metadata.browser_name === 'string' ? metadata.browser_name : 'Outro',
    browser_version:
      typeof metadata.browser_version === 'string' ? metadata.browser_version : '',
    screen_width: typeof metadata.screen_width === 'number' ? metadata.screen_width : 0,
    screen_height: typeof metadata.screen_height === 'number' ? metadata.screen_height : 0,
    viewport_width: typeof metadata.viewport_width === 'number' ? metadata.viewport_width : 0,
    viewport_height: typeof metadata.viewport_height === 'number' ? metadata.viewport_height : 0,
    pixel_ratio: typeof metadata.pixel_ratio === 'number' ? metadata.pixel_ratio : 1,
    is_touch_device: metadata.is_touch_device === true,
    ...normalizeLanguageFields(metadata),
  };
}

export function extractDeviceContextFromEvents(
  events: AnalyticsEvent[],
): SessionDeviceSummary | null {
  const started = events.find(
    (event) => event.event_name === ANALYTICS_EVENT_NAMES.sessionStarted,
  );
  if (!started) return null;
  return extractDeviceContextFromMetadata(started.metadata);
}

export function enrichSummaryDeviceContext<T extends Record<string, unknown>>(
  summary: T,
  events: AnalyticsEvent[],
): T & Partial<SessionDeviceSummary> {
  const fromEvents = extractDeviceContextFromEvents(events);
  if (fromEvents) {
    return { ...summary, ...fromEvents };
  }
  if (typeof summary.device_type !== 'string') return summary;
  return {
    ...summary,
    ...normalizeLanguageFields(summary),
  };
}
