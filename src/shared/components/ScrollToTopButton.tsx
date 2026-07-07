import { useEffect, useState } from 'react';
import { publicUrl } from '@shared/lib/publicUrl';

export function ScrollToTopButton({ threshold = 320 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-4 z-40 p-3 transition-all hover:scale-110"
      title="Voltar ao topo"
      aria-label="Voltar ao topo"
    >
      <img src={publicUrl('images/setaTopo.svg')} alt="" />
    </button>
  );
}
