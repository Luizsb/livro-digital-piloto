import { odaIndexUrl } from './config';

type OdaEmbedProps = {
  className?: string;
  /** Título acessível para leitores de ecrã. */
  title?: string;
};

/**
 * Carrega o ODA completo (`public/ODAS/.../index.html`) dentro de um iframe no modal.
 */
export function OdaEmbed({ className, title = 'Atividade interativa' }: OdaEmbedProps) {
  return (
    <iframe
      title={title}
      src={odaIndexUrl()}
      className={['h-full min-h-0 w-full max-w-full flex-1 rounded-none border-0 bg-black', className]
        .filter(Boolean)
        .join(' ')}
      allow="fullscreen; autoplay"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
