import TrackedImage from '@analytics-ui/TrackedImage';
import { publicUrl } from '@shared/lib/publicUrl';

interface PosterProps {
  imageSrc?: string;
  alt?: string;
  creditLine1?: string;
  creditLine2?: string;
}

function Poster({
  imageSrc = 'images/page_1_img_39_225.png',
  alt = 'O mercado de peixe nos degraus da ponte de Rialto, Veneza',
  creditLine1 = 'Myles Birket Foster/Wikimedia Commons. FOSTER, Myles Birket.',
  creditLine2 = 'FOSTER, Myles Birket. O mercado de peixe nos degraus da ponte de Rialto, Veneza. 1875. Aquarela realçada com bodycolor, 43 x 67 cm. Assinado com monograma.',
}: PosterProps) {
  return (
    <section
      className="flex w-full items-center justify-center px-3 py-4 sm:px-4 sm:py-5 md:h-[371px] md:px-0 md:py-0"
      style={{
        backgroundImage: `url('${publicUrl('images/pattern_branco.png')}')`,
        backgroundRepeat: 'repeat',
        paddingTop: '0px!important',
        backgroundSize: 'contain',
      }}
    >
      <figure className="relative aspect-[533/335] w-full max-w-[533px] overflow-hidden rounded-[20px]">
        <TrackedImage
          imageId="page_3_abertura_rialto"
          page={3}
          src={imageSrc}
          alt={alt}
          className="block h-full w-full object-cover"
          containerClassName="h-full w-full"
          frameClassName="group relative h-full w-full"
          zoomPlacement="top-right"
          alwaysShowZoomButton
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pb-8 pt-16 text-center md:px-12">
          <p
            className="font-myriad-vf"
            style={{
              color: '#FFF',
              textAlign: 'center',
              fontSize: '12px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'normal',
              width: '497px',
              maxWidth: '100%',
              margin: '0 auto',
            }}
          >
            {creditLine1}
          </p>
          <p
            className="font-myriad-vf"
            style={{
              color: '#FFF',
              textAlign: 'center',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'normal',
              width: '497px',
              maxWidth: '100%',
              margin: '8px auto 0',
            }}
          >
            {creditLine2}
          </p>
        </div>
      </figure>
    </section>
  );
}

export default Poster;
