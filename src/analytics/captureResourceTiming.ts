const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i;
const TOP_IMAGES_LIMIT = 5;

export interface LoadedImageWeight {
  src: string;
  bytes: number;
}

export interface ResourceTimingSnapshot {
  session_bytes_transferred: number;
  session_image_bytes_transferred: number;
  resources_loaded_count: number;
  largest_images: LoadedImageWeight[];
  /** true quando bytes vieram só de cache (transferSize zerado em todos). */
  bytes_from_cache_only: boolean;
}

export const EMPTY_RESOURCE_TIMING_SNAPSHOT: ResourceTimingSnapshot = {
  session_bytes_transferred: 0,
  session_image_bytes_transferred: 0,
  resources_loaded_count: 0,
  largest_images: [],
  bytes_from_cache_only: false,
};

function normalizeResourcePath(name: string): string {
  try {
    const url = new URL(name, window.location.origin);
    return url.pathname + url.search;
  } catch {
    return name;
  }
}

function getResourceBytes(entry: PerformanceResourceTiming): number {
  if (entry.transferSize > 0) return entry.transferSize;
  if (entry.encodedBodySize > 0) return entry.encodedBodySize;
  if (entry.decodedBodySize > 0) return entry.decodedBodySize;
  return 0;
}

function isImageResource(entry: PerformanceResourceTiming): boolean {
  if (entry.initiatorType === 'img') return true;
  return IMAGE_EXT.test(entry.name);
}

/** Soma bytes dos recursos carregados durante a sessão (Performance API). */
export function captureResourceTimingSnapshot(): ResourceTimingSnapshot {
  if (typeof performance === 'undefined') {
    return { ...EMPTY_RESOURCE_TIMING_SNAPSHOT };
  }

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  if (entries.length === 0) {
    return { ...EMPTY_RESOURCE_TIMING_SNAPSHOT };
  }

  let session_bytes_transferred = 0;
  let session_image_bytes_transferred = 0;
  let hadNetworkTransfer = false;
  const imageBySrc = new Map<string, number>();

  for (const entry of entries) {
    const bytes = getResourceBytes(entry);
    if (entry.transferSize > 0) {
      hadNetworkTransfer = true;
    }
    if (bytes > 0) {
      session_bytes_transferred += bytes;
    }

    if (!isImageResource(entry)) continue;

    if (bytes > 0) {
      session_image_bytes_transferred += bytes;
      const src = normalizeResourcePath(entry.name);
      imageBySrc.set(src, (imageBySrc.get(src) ?? 0) + bytes);
    }
  }

  const largest_images = [...imageBySrc.entries()]
    .map(([src, bytes]) => ({ src, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, TOP_IMAGES_LIMIT);

  return {
    session_bytes_transferred,
    session_image_bytes_transferred,
    resources_loaded_count: entries.length,
    largest_images,
    bytes_from_cache_only: !hadNetworkTransfer && entries.length > 0,
  };
}

/** Campos do snapshot para gravar em metadata de eventos. */
export function resourceTimingSnapshotMetadata(
  snapshot: ResourceTimingSnapshot,
): Record<string, unknown> {
  return {
    session_bytes_transferred: snapshot.session_bytes_transferred,
    session_image_bytes_transferred: snapshot.session_image_bytes_transferred,
    resources_loaded_count: snapshot.resources_loaded_count,
    largest_images: snapshot.largest_images,
    bytes_from_cache_only: snapshot.bytes_from_cache_only,
  };
}
