import { ANALYTICS_CONFIG } from './analyticsConfig';

/** @deprecated Use ANALYTICS_CONFIG.page.completeMinSeconds */
export const PAGE_COMPLETE_MIN_SECONDS = ANALYTICS_CONFIG.page.completeMinSeconds;

export type PageCompletionReason = 'page_changed' | 'time_threshold' | 'session_finished';

export const COMPLETION_REASON_LABELS: Record<PageCompletionReason, string> = {
  page_changed: 'Avançou para a próxima página',
  time_threshold: 'Chegou ao fim do capítulo',
  session_finished: 'Encerrou a sessão nesta página',
};

const pageViewedAtMs = new Map<number, number>();
let lastActivePage: number | null = null;

export function recordPageViewedAt(page: number, atMs: number = Date.now()): void {
  if (!pageViewedAtMs.has(page)) {
    pageViewedAtMs.set(page, atMs);
  }
}

export function getPageViewedAt(page: number): number | undefined {
  return pageViewedAtMs.get(page);
}

export function getPageDurationSeconds(page: number, atMs: number = Date.now()): number {
  const viewedAt = pageViewedAtMs.get(page);
  if (viewedAt === undefined) return 0;
  return Math.max(0, Math.round((atMs - viewedAt) / 1000));
}

export function setLastActivePage(page: number): void {
  lastActivePage = page;
}

export function getLastActivePage(): number | null {
  return lastActivePage;
}

export function meetsMinimumReadingTime(page: number, atMs: number = Date.now()): boolean {
  return getPageDurationSeconds(page, atMs) >= PAGE_COMPLETE_MIN_SECONDS;
}

export function resetPageReadingState(): void {
  pageViewedAtMs.clear();
  lastActivePage = null;
}
