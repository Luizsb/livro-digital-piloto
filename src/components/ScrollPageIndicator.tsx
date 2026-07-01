import { useEffect, useRef, useState } from 'react';
import { getActiveBookPage } from '../analytics/bookPageScroll';
import { getActiveChapterPageConfig } from '../analytics/chapterPageConfig';

const HIDE_DELAY_MS = 900;
const MIN_THUMB_PX = 48;

function getScrollbarThumbCenterY(): number {
  const { scrollHeight, clientHeight } = document.documentElement;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);

  if (maxScroll <= 0) {
    return clientHeight / 2;
  }

  const scrollTop = window.scrollY;
  const scrollRatio = scrollTop / maxScroll;
  const thumbHeight = Math.max(
    MIN_THUMB_PX,
    (clientHeight / scrollHeight) * clientHeight,
  );
  const thumbTravel = Math.max(0, clientHeight - thumbHeight);
  const thumbTop = scrollRatio * thumbTravel;

  return thumbTop + thumbHeight / 2;
}

/**
 * Indicador lateral de página ao rolar — estilo Google Docs ("8 de 12").
 * Aparece durante o scroll e some após breve pausa.
 */
function ScrollPageIndicator() {
  const { defaultBookPage, lastPage } = getActiveChapterPageConfig();
  const [visible, setVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(defaultBookPage);
  const [thumbCenterY, setThumbCenterY] = useState(() => window.innerHeight / 2);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => {
      setCurrentPage(getActiveBookPage(defaultBookPage));
      setThumbCenterY(getScrollbarThumbCenterY());
      setVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, HIDE_DELAY_MS);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [defaultBookPage]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-40 transition-opacity duration-200"
      style={{
        top: thumbCenterY,
        right: '14px',
        transform: 'translateY(-50%)',
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="inline-flex rounded-md bg-[#202124] px-2 py-0.5 text-[11px] font-medium leading-tight text-white shadow-md">
        {currentPage} de {lastPage}
      </span>
    </div>
  );
}

export default ScrollPageIndicator;
