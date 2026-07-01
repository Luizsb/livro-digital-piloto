import { useEffect, useId, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { publicUrl } from '../lib/publicUrl';
import { ANALYTICS_CONFIG } from '../analytics/analyticsConfig';
import { isPageTrackingReady } from '../analytics/analyticsBootstrap';
import {
  trackImageViewedOnce,
  trackImageZoomed,
} from '../analytics/contentInteractionTracking';
import { normalizeImageSrcPath } from '../analytics/contentInteractionTypes';
import { useOptionalAnalytics } from '../analytics/AnalyticsProvider';
import { subscribeToEventsUpdates } from '../analytics/trackEvent';

export interface TrackedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  imageId: string;
  page: number;
  /** Caminho em public/ (ex.: images/page_3_img.png) */
  src: string;
  children?: ReactNode;
  enableZoom?: boolean;
  containerClassName?: string;
  frameClassName?: string;
  /** Use top-right em imagens com legenda sobreposta na base. */
  zoomPlacement?: 'bottom-right' | 'top-right';
  /** Botão Ampliar sempre visível (sem depender de hover em desktop). */
  alwaysShowZoomButton?: boolean;
}

function TrackedImage({
  imageId,
  page,
  src,
  className,
  alt = '',
  children,
  enableZoom = true,
  containerClassName,
  frameClassName,
  zoomPlacement = 'bottom-right',
  alwaysShowZoomButton = false,
  ...imgProps
}: TrackedImageProps) {
  const analytics = useOptionalAnalytics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const zoomTitleId = useId();
  const srcPath = normalizeImageSrcPath(src);
  const resolvedSrc = publicUrl(srcPath);

  useEffect(() => {
    if (!analytics || !containerRef.current) return;

    const { sessionId, track } = analytics;
    let viewTimer: ReturnType<typeof setTimeout> | null = null;
    let hasIntersected = false;

    const { viewThreshold, viewDelayMs } = ANALYTICS_CONFIG.image;

    const tryTrackView = () => {
      if (!isPageTrackingReady(sessionId)) return;
      if (!hasIntersected) return;

      viewTimer = setTimeout(() => {
        trackImageViewedOnce({
          sessionId,
          imageId,
          page,
          src: srcPath,
          track,
        });
      }, viewDelayMs);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= viewThreshold) {
          hasIntersected = true;
          tryTrackView();
          return;
        }

        if (viewTimer) {
          clearTimeout(viewTimer);
          viewTimer = null;
        }
      },
      { threshold: viewThreshold },
    );

    observer.observe(containerRef.current);

    const unsubscribe = subscribeToEventsUpdates(() => {
      tryTrackView();
    });

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
      observer.disconnect();
      unsubscribe();
    };
  }, [analytics, imageId, page, srcPath]);

  useEffect(() => {
    if (!isZoomOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsZoomOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isZoomOpen]);

  const handleZoomOpen = () => {
    if (!enableZoom || !analytics) return;

    trackImageZoomed({
      sessionId: analytics.sessionId,
      imageId,
      page,
      src: srcPath,
      track: analytics.track,
    });
    setIsZoomOpen(true);
  };

  const zoomButtonPosition =
    zoomPlacement === 'top-right' ? 'top-2 right-2' : 'bottom-2 right-2';
  const zoomButtonVisibility = alwaysShowZoomButton
    ? 'opacity-100'
    : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100';

  return (
    <>
      <div
        ref={containerRef}
        className={containerClassName ?? 'flex flex-col items-center'}
      >
        <div
          className={
            frameClassName ?? 'group relative inline-block max-w-full'
          }
        >
          <img
            {...imgProps}
            src={resolvedSrc}
            alt={alt}
            className={className}
          />
          {enableZoom ? (
            <button
              type="button"
              onClick={handleZoomOpen}
              className={`absolute ${zoomButtonPosition} z-10 flex items-center gap-1 rounded-full bg-[#80298F]/90 px-2.5 py-1 text-xs font-semibold text-white shadow-md transition hover:bg-[#6b2278] ${zoomButtonVisibility}`}
              aria-label="Ampliar imagem"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" />
              </svg>
              Ampliar
            </button>
          ) : null}
        </div>
        {children}
      </div>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Fechar imagem ampliada"
            onClick={() => setIsZoomOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={zoomTitleId}
            className="relative z-[71] flex h-[min(90dvh,920px)] w-[min(95vw,1200px)] min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <span id={zoomTitleId} className="sr-only">
              Imagem ampliada{alt ? `: ${alt}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-[#80298F] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#6b2278] sm:right-4 sm:top-4"
            >
              Fechar
            </button>
            <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-12 sm:p-6 sm:pt-14">
              <img
                src={resolvedSrc}
                alt={alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TrackedImage;
