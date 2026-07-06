import { useEffect } from 'react';
import { ANALYTICS_CONFIG } from './ldConfig';
import { ANALYTICS_EVENT_NAMES } from './sessionTypes';
import { useOptionalAnalytics } from './SessionProvider';
import { isPageTrackingReady } from './ldBootstrap';
import { tryCompletePage } from './pageCompletion';
import { recordPageViewedAt, setLastActivePage } from './pageReadingState';
import { trackOncePerSession, wasSessionEventTracked } from './sessionDedup';
import { subscribeToEventsUpdates } from './recordEvent';
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
    let committedPage: number | null = null;
    let pendingPage: number | null = null;
    let commitTimer: ReturnType<typeof setTimeout> | null = null;

    const pageViewedKey = (page: number) => `${ANALYTICS_EVENT_NAMES.pageViewed}_${page}`;

    const hasPageBeenViewed = (page: number) =>
      wasSessionEventTracked(sessionId, pageViewedKey(page));

    const emitFirstPageView = (page: number) => {
      if (hasPageBeenViewed(page)) return;
      trackOncePerSession(sessionId, pageViewedKey(page), () => {
        track(ANALYTICS_EVENT_NAMES.pageViewed, { page });
      });
      recordPageViewedAt(page);
    };

    const commitPageTransition = (targetPage: number) => {
      const activePage = getActiveBookPage();
      if (activePage !== targetPage) return;
      if (!isPageTrackingReady(sessionId)) return;

      const previousPage = committedPage;
      if (targetPage === previousPage) return;

      if (previousPage === null) {
        emitFirstPageView(targetPage);
      } else if (targetPage > previousPage) {
        for (let page = previousPage + 1; page <= targetPage; page += 1) {
          emitFirstPageView(page);
        }
        tryCompletePage({
          sessionId,
          page: previousPage,
          reason: 'page_changed',
          track,
        });
      } else if (!hasPageBeenViewed(targetPage)) {
        emitFirstPageView(targetPage);
      }

      committedPage = targetPage;
      setLastActivePage(targetPage);
    };

    const schedulePageCommit = () => {
      if (!isPageTrackingReady(sessionId)) return;

      const candidate = getActiveBookPage();
      if (candidate === committedPage) return;

      pendingPage = candidate;
      if (commitTimer !== null) {
        clearTimeout(commitTimer);
      }

      commitTimer = setTimeout(() => {
        commitTimer = null;
        if (pendingPage === null) return;
        commitPageTransition(pendingPage);
        pendingPage = null;
      }, ANALYTICS_CONFIG.scroll.pageCommitDelayMs);
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
      schedulePageCommit();
      scanEndMarkers();
    };

    startTracking();

    const onScroll = () => schedulePageCommit();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const unsubscribeEvents = subscribeToEventsUpdates(() => {
      startTracking();
      schedulePageCommit();
    });

    const mutationObserver = new MutationObserver(() => {
      scanEndMarkers();
      schedulePageCommit();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (commitTimer !== null) {
        clearTimeout(commitTimer);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      unsubscribeEvents();
      endMarkerObservers.forEach((observer) => observer.disconnect());
      mutationObserver.disconnect();
    };
  }, [analytics]);
}
