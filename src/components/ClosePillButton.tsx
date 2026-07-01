import type { ButtonHTMLAttributes } from 'react';

const CLOSE_PILL_BASE_CLASS =
  'rounded-full bg-[#80298F] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#6b2278] focus:outline-none focus:ring-2 focus:ring-[#80298F]/40 focus:ring-offset-2';

export interface ClosePillButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'type' | 'title' | 'aria-label'
  > {
  ariaLabel: string;
}

/** Botão roxo “Fechar” usado em modais de imagem, ODA e Escola Digital. */
export function ClosePillButton({
  ariaLabel,
  className = '',
  ...props
}: ClosePillButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`${CLOSE_PILL_BASE_CLASS} ${className}`.trim()}
      {...props}
    >
      Fechar
    </button>
  );
}
