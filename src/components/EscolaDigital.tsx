import { publicUrl } from '../lib/publicUrl';
import GameModal from './GameModal';
import TrackedVideo from './TrackedVideo';

interface EscolaDigitalProps {
  videoSrc?: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  introHint?: string;
}

function EscolaDigital({
  videoSrc = 'images/SAE26_AI43_HIS_C07_VA1.mp4',
  thumbnailSrc = 'images/thumbEscolaDigital.svg',
  thumbnailAlt = 'Abrir vídeo Escola Digital',
  introHint = 'Clique para assistir a videoaula.',
}: EscolaDigitalProps) {
  return (
    <section className="my-6">
      <div className="mb-4 flex items-center gap-3">
        <img
          src={publicUrl('images/escolaDigital.svg')}
          alt="Escola Digital"
          className="object-contain"
        />
        <h2
          style={{
            color: '#00000',
            fontFamily: "'Filson Soft', sans-serif",
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            textTransform: 'uppercase',
          }}
        >
          Escola Digital
        </h2>
      </div>

      <div className="flex w-full justify-center">
        <GameModal
          thumbnailSrc={thumbnailSrc}
          thumbnailAlt={thumbnailAlt}
          introHint={introHint}
          closeAriaLabel="Fechar Escola Digital"
          analyticsResource={{
            linkId: 'escola_digital_video',
            page: 3,
            type: 'escola_digital_opened',
          }}
        >
          <TrackedVideo
            controls
            playsInline
            preload="metadata"
            className="block h-full min-h-0 w-full flex-1 bg-black object-contain"
            analytics={{
              linkId: 'escola_digital_video',
              page: 3,
              videoId: 'escola_digital_video',
              type: 'escola_digital_video',
            }}
          >
            <source src={publicUrl(videoSrc)} type="video/mp4" />
            Seu navegador não suporta a reprodução de vídeo.
          </TrackedVideo>
        </GameModal>
      </div>
    </section>
  );
}

export default EscolaDigital;
