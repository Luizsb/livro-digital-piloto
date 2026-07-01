import { useEffect } from 'react';
import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import { useOptionalAnalytics } from './AnalyticsProvider';
import { isPageTrackingReady } from './analyticsBootstrap';
import { tryCompletePage } from './pageCompletion';
import {
  getLastActivePage,
  recordPageViewedAt,
  setLastActivePage,
} from './pageReadingState';
import { trackOncePerSession } from './sessionDedup';
import { subscribeToEventsUpdates } from './trackEvent';
import {
  BOOK_PAGE_END_MARKERS,
  getActiveBookPage,
} from './bookPageScroll';

function parseEndPageNumber(element: Element): number | null {
  const raw = element.getAttribute('data-page-end');
  if (!raw) return null;
  const page = parseInt(raw, 10);
  return Number.isNaN(page) ? null : page;
}

export function useBookPageTracking(): void {
  const analytics = useOptionalAnalytics();

  useEffect(() => {
    if (!analytics) return;

    const { sessionId, track } = analytics;
    const observedEndMarkers = new WeakSet<Element>();
    const endMarkerObservers = new Map<Element, IntersectionObserver>();
    let trackingStarted = false;
    let lastActivePage: number | null = null;

    const pageViewedKey = (page: number) => `${ANALYTICS_EVENT_NAMES.pageViewed}_${page}`;

    const emitPageViewed = (page: number) => {
      const emitted = trackOncePerSession(sessionId, pageViewedKey(page), () => {
        track(ANALYTICS_EVENT_NAMES.pageViewed, { page });
      });
      if (emitted) {
        recordPageViewedAt(page);
      }
    };

    const updateActivePage = () => {
      if (!isPageTrackingReady(sessionId)) return;

      const activePage = getActiveBookPage();
      const previousPage = lastActivePage;

      if (activePage === previousPage) return;

      emitPageViewed(activePage);

      if (previousPage !== null && activePage > previousPage) {
        tryCompletePage({
          sessionId,
          page: previousPage,
          reason: 'page_changed',
          track,
        });
      }

      lastActivePage = activePage;
      setLastActivePage(activePage);
    };

    const observeEndMarker = (element: Element) => {
      if (observedEndMarkers.has(element)) return;

      const page = parseEndPageNumber(element);
      if (page === null) return;

      observedEndMarkers.add(element);

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          if (!isPageTrackingReady(sessionId)) return;

          tryCompletePage({
            sessionId,
            page,
            reason: 'time_threshold',
            track,
          });
        },
        { threshold: 0 },
      );

      observer.observe(element);
      endMarkerObservers.set(element, observer);
    };

    const scanEndMarkers = () => {
      document.querySelectorAll(BOOK_PAGE_END_MARKERS).forEach(observeEndMarker);
    };

    const startTracking = () => {
      if (trackingStarted) return;
      if (!isPageTrackingReady(sessionId)) return;

      trackingStarted = true;
      updateActivePage();
      scanEndMarkers();
    };

    startTracking();

    const onScroll = () => updateActivePage();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const unsubscribeEvents = subscribeToEventsUpdates(() => {
      startTracking();
      updateActivePage();
    });

    const mutationObserver = new MutationObserver(() => {
      scanEndMarkers();
      updateActivePage();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      unsubscribeEvents();
      endMarkerObservers.forEach((observer) => observer.disconnect());
      mutationObserver.disconnect();
    };
  }, [analytics]);
}
