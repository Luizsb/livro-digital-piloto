import { publicUrl } from '@shared/lib/publicUrl';

interface PaginationProps {
  currentPage: number;
  /** Marcador de scroll no miolo; alarga o alinhamento à largura da coluna (como a barra do topo). */
  expandToBookColumn?: boolean;
}

function Pagination({ currentPage, expandToBookColumn = false }: PaginationProps) {
  const page4Plus = currentPage >= 4;
  const page4Padding = page4Plus ? 'pt-[25px] pb-[25px]' : '';

  const bar = (
    <div
      data-page={currentPage}
      data-book-page={expandToBookColumn ? currentPage : undefined}
      className="pagination-bar-spec relative isolate overflow-visible"
    >
      <span className="shrink-0">Página - {currentPage}</span>
      <img src={publicUrl('images/seta.svg')} alt="" className="h-3 w-3 shrink-0 object-contain" />
    </div>
  );

  const inner =
    expandToBookColumn ? (
      <div className="-mx-8 flex w-[calc(100%+4rem)] max-w-none shrink-0 justify-center md:-mx-12 md:w-[calc(100%+6rem)]">
        {bar}
      </div>
    ) : (
      bar
    );

  if (page4Padding) {
    return <div className={page4Padding}>{inner}</div>;
  }

  return inner;
}

export default Pagination;
