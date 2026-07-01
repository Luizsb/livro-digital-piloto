import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { publicUrl } from '../lib/publicUrl';
import type { LinkTrackType } from '../analytics/contentInteractionTypes';
import {
  endModalResourceSession,
  registerModalResourceSession,
} from '../analytics/modalResourceTracking';
import { useOptionalAnalytics } from '../analytics/AnalyticsProvider';

interface GameModalAnalytics {
  linkId: string;
  page: number;
  type: LinkTrackType;
  href?: string;
}

interface GameModalProps {
  /** Texto do botão quando não há miniatura */
  buttonLabel?: string;
  /** Caminho público da miniatura (ex.: images/thumbODA.png) — se definido, substitui o botão de texto */
  thumbnailSrc?: string;
  /** Texto acima da miniatura */
  introTitle?: string;
  /** Texto abaixo da miniatura */
  introHint?: string;
  /** Atributo alt da imagem */
  thumbnailAlt?: string;
  /** Conteúdo do jogo: iframe, componente React, etc. */
  children: ReactNode;
  /** Rastreamento MVP-03: abertura + tempo de uso ao fechar. */
  analyticsResource?: GameModalAnalytics;
}

function GameModal({
  buttonLabel = 'Abrir jogo',
  thumbnailSrc,
  introTitle,
  introHint = 'Clique para jogar',
  thumbnailAlt,
  children,
  analyticsResource,
}: GameModalProps) {
  const analytics = useOptionalAnalytics();
  const instanceId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;

      if (analytics && analyticsResource) {
        endModalResourceSession(instanceId, analytics.track);
      }
    };
  }, [analytics, analyticsResource, closeModal, instanceId, isOpen]);

  const altText =
    thumbnailAlt ?? introTitle ?? 'Abrir atividade interativa';

  const thumbResolved =
    thumbnailSrc &&
    (thumbnailSrc.startsWith('http:') || thumbnailSrc.startsWith('https:') || thumbnailSrc.startsWith('data:'))
      ? thumbnailSrc
      : thumbnailSrc
        ? publicUrl(thumbnailSrc.replace(/^\//, ''))
        : undefined;

  const openModal = () => {
    if (analytics && analyticsResource) {
      registerModalResourceSession({
        instanceId,
        sessionId: analytics.sessionId,
        track: analytics.track,
        ...analyticsResource,
      });
    }
    setIsOpen(true);
  };

  return (
    <>
      {thumbResolved ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 text-center sm:max-w-[380px] md:max-w-[480px] lg:max-w-[520px]">
          {introTitle && (
            <p className="font-myriad-vf text-base font-semibold text-black md:text-lg">{introTitle}</p>
          )}
          <button
            type="button"
            onClick={openModal}
            className="group relative w-full overflow-hidden rounded-[24px] border-0 p-0 shadow-md ring-2 ring-transparent transition hover:ring-[#80298F] focus:outline-none focus:ring-2 focus:ring-[#80298F] focus:ring-offset-2"
            aria-label={altText}
          >
            <img
              src={thumbResolved}
              alt={altText}
              className="h-auto w-full max-w-[320px] rounded-[5px] sm:max-w-[380px] md:max-w-[480px] lg:max-w-[520px]"
            />
          </button>
          {introHint && (
            <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '10px' }}>{introHint}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-full border-2 border-[#80298F] bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow-sm transition hover:bg-[#F9DDFF] focus:outline-none focus:ring-2 focus:ring-[#80298F] focus:ring-offset-2 md:text-base"
        >
          {buttonLabel}
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Fechar atividade (fundo)"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[61] flex h-[min(90dvh,900px)] w-[min(95vw,1100px)] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/15 sm:h-[min(90vh,900px)] sm:w-[min(75vw,1100px)]"
          >
            <span id={titleId} className="sr-only">
              Atividade interativa
            </span>
            <button
              type="button"
              onClick={closeModal}
              className="pointer-events-auto absolute right-3 top-3 z-[100] flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[46px] border-[3px] border-solid border-white bg-[#80298F] shadow-md transition hover:bg-[#6b2178] focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-transparent sm:right-4 sm:top-4"
              aria-label="Fechar atividade"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                className="aspect-[1/1] h-[14px] w-[14px] shrink-0"
                aria-hidden
              >
                <path
                  fill="#FFF"
                  d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                />
              </svg>
            </button>
            <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden [&_iframe]:block [&_iframe]:h-full [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:border-0 [&_video]:h-full [&_video]:min-h-0 [&_video]:w-full">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GameModal;
