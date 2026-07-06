import { useState, useEffect, useCallback } from 'react';
import { getActiveChapterPageConfig } from '@book/chapter/chapterPageConfig';
import { getActiveBookPage } from '@analytics/bookPageScroll';

/**
 * Hook customizado para gerenciar paginação baseada em scroll
 */
export function usePagination(defaultPage: number = getActiveChapterPageConfig().defaultBookPage) {
  const [currentPage, setCurrentPage] = useState(defaultPage);

  useEffect(() => {
    const updateCurrentPage = () => {
      setCurrentPage(getActiveBookPage(defaultPage));
    };

    updateCurrentPage();

    window.addEventListener('scroll', updateCurrentPage, { passive: true });
    window.addEventListener('resize', updateCurrentPage);

    const observer = new MutationObserver(updateCurrentPage);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener('scroll', updateCurrentPage);
      window.removeEventListener('resize', updateCurrentPage);
      observer.disconnect();
    };
  }, [defaultPage]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setCurrentPage(defaultPage);
    }, 500);
  }, [defaultPage]);

  return {
    currentPage,
    scrollToTop,
  };
}
