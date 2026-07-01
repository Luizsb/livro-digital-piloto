import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { getAndIncrementExportCount } from './sessionDedup';
import {
  captureResourceTimingMetadata,
  trackResourceTimingSnapshotOnce,
} from './resourceTimingSnapshot';
import { loadStoredEvents } from './trackEvent';
import { buildExportPayload, downloadEventsJson, type ExportPayload } from './exportEvents';

export type ExportSource =
  | 'manual_button'
  | 'finish_screen'
  | 'floating_button';

export interface ExportSessionReportOptions {
  export_source?: ExportSource;
}

/**
 * Registra `events_exported` antes de montar o JSON — o evento entra no arquivo baixado.
 */
export function exportSessionReport(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
  options: ExportSessionReportOptions = {},
): ExportPayload {
  trackResourceTimingSnapshotOnce(sessionId, track);
  const resourceTiming = captureResourceTimingMetadata();

  const eventCountBeforeExport = loadStoredEvents().length;
  const exportCount = getAndIncrementExportCount(sessionId);

  track(ANALYTICS_EVENT_NAMES.eventsExported, {
    event_count_before_export: eventCountBeforeExport,
    event_count_at_export: eventCountBeforeExport + 1,
    export_format: 'json',
    export_source: options.export_source ?? 'manual_button',
    export_count: exportCount,
    ...resourceTiming,
  });

  return downloadEventsJson();
}

/** Apenas monta o payload (sem download) — útil para testes. */
export function buildExportPayloadAfterTrack(
  sessionId: string,
  track: (eventName: string, metadata?: Record<string, unknown>) => void,
  options: ExportSessionReportOptions = {},
): ExportPayload {
  trackResourceTimingSnapshotOnce(sessionId, track);
  const resourceTiming = captureResourceTimingMetadata();

  const eventCountBeforeExport = loadStoredEvents().length;
  const exportCount = getAndIncrementExportCount(sessionId);

  track(ANALYTICS_EVENT_NAMES.eventsExported, {
    event_count_before_export: eventCountBeforeExport,
    event_count_at_export: eventCountBeforeExport + 1,
    export_format: 'json',
    export_source: options.export_source ?? 'manual_button',
    export_count: exportCount,
    ...resourceTiming,
  });

  return buildExportPayload();
}
