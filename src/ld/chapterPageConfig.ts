/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PÁGINAS POR LIVRO / CAPÍTULO — limites da jornada de leitura
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cada livro/capítulo pode ter numeração e quantidade de páginas diferentes.
 * Ao portar um novo capítulo, adicione uma entrada em `CHAPTER_PAGE_REGISTRY`.
 *
 * Os marcadores no HTML (`data-book-page` em Pagination / BookPageTracker)
 * devem estar entre `firstPage` e `lastPage` (inclusive).
 *
 * Limiares universais (tempo, taxa %, scroll): `analyticsConfig.ts`
 * Documentação: `docs/CONFIGURACAO-ANALYTICS.md`
 */

import { ANALYTICS_CONFIG } from './ldConfig';
import { BOOK_PILOT } from './sessionTypes';
import type { EventSummary } from './sessionSummary';

/** Intervalo de páginas rastreadas no miolo do capítulo. */
export interface ChapterPageBounds {
  /**
   * Página exibida na paginação ao abrir o capítulo, antes do primeiro
   * marcador `data-book-page` cruzar o gatilho de scroll.
   */
  defaultBookPage: number;
  /** Primeira página do miolo com marcador `data-book-page`. */
  firstPage: number;
  /** Última página do miolo (inclusive). */
  lastPage: number;
}

export interface ChapterPageConfig extends ChapterPageBounds {
  /**
   * Override opcional da taxa mínima (%) para `chapter_completed`.
   * Se omitido, usa `ANALYTICS_CONFIG.chapter.minCompletionRateForChapterCompleted`.
   */
  minCompletionRateForChapterCompleted?: number;
}

function registryKey(bookId: string, chapterId: string): string {
  return `${bookId}::${chapterId}`;
}

/**
 * Registro por livro + capítulo.
 * Chave: `${book_id}::${chapter_id}` (ver `BOOK_PILOT` em eventTypes.ts).
 */
export const CHAPTER_PAGE_REGISTRY: Record<string, ChapterPageConfig> = {
  // Capítulo piloto atual — História AI43, cap. 07 (páginas do livro 3–12)
  [registryKey(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id)]: {
    defaultBookPage: 3,
    firstPage: 3,
    lastPage: 12,
  },
};

export function getChapterPageConfig(bookId: string, chapterId: string): ChapterPageConfig {
  const config = CHAPTER_PAGE_REGISTRY[registryKey(bookId, chapterId)];
  if (!config) {
    throw new Error(
      `Configuração de páginas não encontrada para ${bookId} / ${chapterId}. ` +
        'Adicione uma entrada em src/ld/chapterPageConfig.ts → CHAPTER_PAGE_REGISTRY.',
    );
  }
  return config;
}

/** Config do capítulo ativo no piloto (App com um único livro). */
export function getActiveChapterPageConfig(): ChapterPageConfig {
  return getChapterPageConfig(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id);
}

export function getChapterTotalPages(bounds: ChapterPageBounds): number {
  return bounds.lastPage - bounds.firstPage + 1;
}

export function listChapterPageNumbers(bounds: ChapterPageBounds): number[] {
  const total = getChapterTotalPages(bounds);
  return Array.from({ length: total }, (_, index) => bounds.firstPage + index);
}

export function getMinCompletionRateForChapter(bookId: string, chapterId: string): number {
  const config = getChapterPageConfig(bookId, chapterId);
  return (
    config.minCompletionRateForChapterCompleted ??
    ANALYTICS_CONFIG.chapter.minCompletionRateForChapterCompleted
  );
}

export interface ChapterPageSnapshot {
  chapter_first_page: number;
  chapter_last_page: number;
  chapter_total_pages: number;
  chapter_default_page: number;
}

export function buildChapterPageSnapshot(bookId: string, chapterId: string): ChapterPageSnapshot {
  const bounds = getChapterPageConfig(bookId, chapterId);
  return {
    chapter_first_page: bounds.firstPage,
    chapter_last_page: bounds.lastPage,
    chapter_total_pages: getChapterTotalPages(bounds),
    chapter_default_page: bounds.defaultBookPage,
  };
}

type SummaryWithChapterPages = Pick<
  EventSummary,
  | 'book_id'
  | 'chapter_id'
  | 'pages_viewed'
  | 'chapter_first_page'
  | 'chapter_last_page'
  | 'chapter_total_pages'
  | 'chapter_default_page'
>;

/**
 * Resolve limites a partir do JSON exportado (preferência) ou do registro por livro.
 * JSONs antigos sem snapshot usam o registro ou inferência pelas páginas vistas.
 */
export function resolveChapterPageBounds(summary: SummaryWithChapterPages): ChapterPageBounds {
  if (
    typeof summary.chapter_first_page === 'number' &&
    typeof summary.chapter_last_page === 'number'
  ) {
    return {
      firstPage: summary.chapter_first_page,
      lastPage: summary.chapter_last_page,
      defaultBookPage:
        typeof summary.chapter_default_page === 'number'
          ? summary.chapter_default_page
          : summary.chapter_first_page,
    };
  }

  try {
    return getChapterPageConfig(summary.book_id, summary.chapter_id);
  } catch {
    const pages = summary.pages_viewed;
    if (pages.length === 0) {
      const fallback = getActiveChapterPageConfig();
      return fallback;
    }
    const firstPage = Math.min(...pages);
    const lastPage = Math.max(...pages);
    return { firstPage, lastPage, defaultBookPage: firstPage };
  }
}

/**
 * Lê marcadores `[data-book-page]` no DOM (útil para validar o registro vs Book.tsx).
 * Só funciona no navegador com o capítulo renderizado.
 */
export function discoverChapterPageBoundsFromDom(): ChapterPageBounds | null {
  if (typeof document === 'undefined') return null;

  const pageNumbers: number[] = [];
  document.querySelectorAll('[data-book-page]').forEach((el) => {
    const raw = el.getAttribute('data-book-page');
    const page = parseInt(raw ?? '', 10);
    if (!Number.isNaN(page)) pageNumbers.push(page);
  });

  if (pageNumbers.length === 0) return null;

  const firstPage = Math.min(...pageNumbers);
  const lastPage = Math.max(...pageNumbers);
  return {
    firstPage,
    lastPage,
    defaultBookPage: firstPage,
  };
}
