import { useEffect } from 'react';

const SCROLL_POSITION_KEY = 'book_scroll_position';

/**
 * Hook para salvar e restaurar a posição de scroll
 */
export function useScrollPosition() {
  useEffect(() => {
    // Restaura a posição de scroll salva
    const savedPosition = localStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Aguarda um pouco para garantir que o DOM está carregado
      setTimeout(() => {
        window.scrollTo({
          top: position,
          behavior: 'auto', // Usa 'auto' para scroll instantâneo na restauração
        });
      }, 100);
    }

    // Salva a posição de scroll periodicamente
    const saveScrollPosition = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(SCROLL_POSITION_KEY, scrollY.toString());
    };

    // Salva a posição quando o usuário faz scroll
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 150); // Debounce de 150ms
    };

    // Salva a posição antes de sair da página
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Salva a posição quando a página está sendo ocultada (mudança de aba, etc)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveScrollPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(scrollTimeout);
      // Salva a posição final ao desmontar
      saveScrollPosition();
    };
  }, []);
}

