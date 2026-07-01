import { ANALYTICS_CONFIG } from './analyticsConfig';
import { getActiveChapterPageConfig } from './chapterPageConfig';

/** Marcadores de início de página no miolo do capítulo. */
export const BOOK_PAGE_MARKERS = '[data-book-page]';

/** Marcadores de fim de página (última página do capítulo). */
export const BOOK_PAGE_END_MARKERS = '[data-page-end]';

/**
 * Distância do topo da viewport: o marcador da página precisa subir até aqui
 * para essa página passar a valer (valores menores = troca mais tarde).
 */
export function getScrollTriggerY(): number {
  const { triggerMinPx, triggerMaxPx, triggerViewportRatio } = ANALYTICS_CONFIG.scroll;
  return Math.min(
    triggerMaxPx,
    Math.max(triggerMinPx, Math.round(window.innerHeight * triggerViewportRatio)),
  );
}

/** Página ativa conforme scroll — mesma regra do `usePagination`. */
export function getActiveBookPage(
  defaultPage = getActiveChapterPageConfig().defaultBookPage,
): number {
  const triggerY = getScrollTriggerY();
  let activePage = defaultPage;

  document.querySelectorAll(BOOK_PAGE_MARKERS).forEach((el) => {
    const raw = el.getAttribute('data-book-page');
    const page = parseInt(raw ?? String(defaultPage), 10);
    if (Number.isNaN(page)) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= triggerY) {
      activePage = Math.max(activePage, page);
    }
  });

  return activePage;
}
