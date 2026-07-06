import { useBookPageTracking } from '../ld/useBookPageTracking';
import { getActiveChapterPageConfig } from '../ld/chapterPageConfig';

/**
 * Rastreia page_viewed e page_completed via scroll (mesma regra da paginação do livro).
 * Marcador da primeira página do miolo — ver chapterPageConfig.ts.
 */
function BookPageTracker() {
  useBookPageTracking();
  const { firstPage } = getActiveChapterPageConfig();

  return (
    <div
      data-book-page={firstPage}
      className="pointer-events-none h-px w-full shrink-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

export default BookPageTracker;
