import { useLayoutEffect } from 'react';

/** Rola a página ao topo quando uma dependência muda (ex.: troca de aba no relatório). */
export function useScrollToTopOnChange(...deps: unknown[]): void {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
