import { useBookPageTracking } from './useBookPageTracking';

/**
 * @deprecated Use `useBookPageTracking` com marcadores `[data-book-page]` no DOM.
 */
export function useTrackPageView(_page: number) {
  useBookPageTracking();
  return { current: null };
}
