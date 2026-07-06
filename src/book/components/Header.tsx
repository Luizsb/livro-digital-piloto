import { publicUrl } from '@shared/lib/publicUrl';

interface HeaderProps {
  chapterNumber?: number | string;
  chapterTitle?: string;
}

function Header({ chapterNumber = 7, chapterTitle = 'Comércio' }: HeaderProps) {
  return (
    <header
      className="relative w-full min-w-0 bg-[#80298F] bg-no-repeat py-8 px-8 text-white"
      style={{
        backgroundImage: `url('${publicUrl('images/Capa-1.svg')}')`,
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
      }}
    >
      {/* Conteúdo do header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col" style={{ marginLeft: '90px' }}>
            <p
              className="font-inter rounded-[20px]"
              style={{
                backgroundColor: '#F4C2FF',
                color: '#80298F',
                textAlign: 'center',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: '500',
                lineHeight: '30px', /* 428.571% */
                letterSpacing: '-0.5px',
                width: '108px',
                height: '27px',
              }}
            >
              LIVRO DIGITAL
            </p>
            <h1
              className="font-inter font-bold"
              style={{
                fontWeight: 900,
                fontSize: '48px',
              }}
            >
              <span style={{ color: '#FBB733' }}>{chapterNumber}.</span> {chapterTitle}
            </h1>

          </div>
        </div>
      </div>
    </header >
  );
}

export default Header;

