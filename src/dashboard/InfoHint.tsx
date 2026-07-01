import { useState } from 'react';

interface InfoHintProps {
  text: string;
  label?: string;
}

/** Botão (i) com explicação — clique ou foco para abrir. */
export function InfoHint({ text, label = 'Mais informações' }: InfoHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative ml-1 inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold leading-none text-slate-500 transition hover:border-[#80298F] hover:text-[#80298F] focus:outline-none focus:ring-2 focus:ring-[#80298F]/30"
        aria-expanded={open}
        aria-label={label}
        title={text}
      >
        i
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2.5 text-left text-xs font-normal normal-case leading-snug text-slate-600 shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

export const TECHNICAL_HEALTH_HINTS = {
  loadTime:
    'Tempo até a página do livro terminar de carregar no navegador do participante (evento load).',
  domReady:
    'Momento em que o HTML principal já foi interpretado e a estrutura inicial pode ser exibida (DOMContentLoaded).',
  ttfb:
    'TTFB (Time to First Byte): tempo até o primeiro byte da resposta chegar do servidor ou CDN. Mede a latência inicial da rede antes do conteúdo começar a baixar.',
  sessionWeight:
    'Soma dos bytes transferidos de todos os arquivos carregados nesta sessão (JS, CSS, imagens etc.). Só inclui o que o participante de fato abriu.',
  imageWeight:
    'Parte do peso observado referente apenas a imagens carregadas durante a navegação.',
  resourcesLoaded:
    'Quantidade de arquivos registrados pelo navegador na Performance API durante a sessão.',
  scriptErrors:
    'Erros de JavaScript ou promises rejeitadas capturados enquanto o participante usava o livro.',
  renderErrors:
    'Falhas ao renderizar componentes React — a interface não pôde ser exibida naquele trecho.',
  missingAssets:
    'Scripts, folhas de estilo ou imagens que o navegador tentou carregar e falharam.',
  brokenImages: 'Imagens rastreadas do capítulo que não carregaram (evento de erro no img).',
  brokenLinks:
    'Links internos (mesmo site) que o participante clicou e retornaram erro HTTP.',
} as const;

interface MetricTermProps {
  label: string;
  hint: string;
}

export function MetricTerm({ label, hint }: MetricTermProps) {
  return (
    <span className="inline-flex items-center">
      {label}
      <InfoHint text={hint} label={`Mais informações sobre ${label}`} />
    </span>
  );
}
