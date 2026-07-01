export interface PageLoadTiming {
  page_load_time_ms: number;
  dom_content_loaded_ms: number;
  ttfb_ms: number;
}

/** Métricas da carga da página que o participante acabou de abrir (Performance API). */
export function capturePageLoadTiming(): PageLoadTiming | null {
  if (typeof performance === 'undefined') return null;

  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (!nav || nav.loadEventEnd <= 0) return null;

  return {
    page_load_time_ms: Math.round(nav.loadEventEnd - nav.startTime),
    dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    ttfb_ms: Math.round(nav.responseStart - nav.startTime),
  };
}
