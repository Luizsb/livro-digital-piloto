/** Rótulos de exibição — evitam interpretação pedagógica equivocada. */

/** Das páginas abertas na sessão, quantas atingiram tempo mínimo (não é progresso no capítulo). */
export const PAGE_COMPLETION_RATE_LABEL = 'Conclusão das páginas vistas';

export const PAGE_COMPLETION_RATE_EXPLANATION =
  'Percentual das páginas visualizadas que atingiram o tempo mínimo — distinto da abertura e da conclusão no capítulo.';

/** Páginas do capítulo que apareceram na tela (scroll/viewport). */
export const CHAPTER_PAGES_OPENED_LABEL = 'Abertura do capítulo';

export const CHAPTER_PAGES_OPENED_EXPLANATION =
  'Páginas visualizadas em relação ao total do capítulo.';

/** Páginas do capítulo que atingiram tempo mínimo de permanência. */
export const CHAPTER_PAGES_COMPLETED_LABEL = 'Conclusão no capítulo';

export const CHAPTER_PAGES_COMPLETED_EXPLANATION =
  'Páginas concluídas (tempo mínimo) em relação ao total do capítulo — distinto da conclusão entre as vistas.';

export const CHAPTER_STATUS_LABEL = 'Status no capítulo';

export const CHAPTER_MANIFEST_COVERAGE_TITLE = 'Inventário editorial do capítulo';

export const CHAPTER_MANIFEST_COVERAGE_EXPLANATION =
  'Compara o que foi coletado com páginas, imagens, recursos e atividades previstos no manifest.';

/** @deprecated Preferir CHAPTER_PAGES_OPENED_LABEL */
export const CHAPTER_COVERAGE_LABEL = CHAPTER_PAGES_OPENED_LABEL;

/** @deprecated Preferir CHAPTER_PAGES_OPENED_EXPLANATION */
export const CHAPTER_COVERAGE_EXPLANATION = CHAPTER_PAGES_OPENED_EXPLANATION;

export const READING_DEPTH_LABEL = 'Ritmo por página vista';

export const READING_DEPTH_EXPLANATION =
  'Tempo visível médio em cada página aberta — indica se a leitura foi rápida ou demorada, não quanto do capítulo foi percorrido.';

export function computeChapterCoveragePercent(
  count: number,
  totalPages: number,
): number {
  return totalPages > 0 ? Math.round((count / totalPages) * 100) : 0;
}

export function resolvePagesViewedCoveragePercent(
  summary: { pages_viewed_count: number; pages_viewed_coverage_rate?: number | null },
  totalPages: number,
): number {
  if (typeof summary.pages_viewed_coverage_rate === 'number') {
    return summary.pages_viewed_coverage_rate;
  }
  return computeChapterCoveragePercent(summary.pages_viewed_count, totalPages);
}

export function resolvePagesCompletedCoveragePercent(
  summary: { pages_completed_count: number; pages_completed_coverage_rate?: number | null },
  totalPages: number,
): number {
  if (typeof summary.pages_completed_coverage_rate === 'number') {
    return summary.pages_completed_coverage_rate;
  }
  return computeChapterCoveragePercent(summary.pages_completed_count, totalPages);
}

export function formatPagesFractionWithPercent(
  count: number,
  totalPages: number,
  percent?: number,
): string {
  const pct = percent ?? computeChapterCoveragePercent(count, totalPages);
  return `${count}/${totalPages} (${pct}%)`;
}

export function formatViewedPagesCompletionDisplay(summary: {
  completion_rate: number;
  pages_completed_count: number;
  pages_viewed_count: number;
}): string {
  if (summary.pages_viewed_count <= 0) return '—';
  return `${summary.completion_rate}% (${summary.pages_completed_count}/${summary.pages_viewed_count} vistas)`;
}

export const LAST_PAGE_VIEWED_LABEL = 'Última página vista';

export const ABANDONMENT_PAGE_LABEL = 'Ponto de abandono';

export const ABANDONMENT_EXPLANATION =
  'Última página em que esteve antes de encerrar, quando não percorreu o capítulo inteiro.';

export const AVG_SECONDS_PER_COMPLETED_PAGE_LABEL = 'Tempo médio por página concluída';

export const AVG_SECONDS_PER_COMPLETED_PAGE_EXPLANATION =
  'Média de tempo visível nas páginas que atingiram o critério mínimo (eventos page_completed).';

export const OPEN_COMPLETION_GAP_LABEL = 'Gap abertura × conclusão';

export const OPEN_COMPLETION_GAP_EXPLANATION =
  'Páginas visualizadas que não atingiram tempo mínimo — indício de varredura ou passagem rápida.';

export function computePagesOpenCompletionGap(summary: {
  pages_viewed: number[];
  pages_completed: number[];
}): { count: number; pages: number[] } {
  const completed = new Set(summary.pages_completed);
  const pages = summary.pages_viewed.filter((page) => !completed.has(page)).sort((a, b) => a - b);
  return { count: pages.length, pages };
}

export function formatOpenCompletionGapDisplay(gap: {
  count: number;
  pages: number[];
}): string {
  if (gap.count <= 0) return 'Nenhuma';
  if (gap.pages.length <= 4) {
    return `${gap.count} pág. (${gap.pages.map((p) => `p.${p}`).join(', ')})`;
  }
  return `${gap.count} pág. (${gap.pages
    .slice(0, 3)
    .map((p) => `p.${p}`)
    .join(', ')}…)`;
}

export function formatLastPageDisplay(summary: {
  last_page_viewed?: number | null;
  abandoned_before_end?: boolean;
  abandonment_page?: number | null;
}): string {
  const page =
    summary.abandoned_before_end && summary.abandonment_page != null
      ? summary.abandonment_page
      : summary.last_page_viewed;
  if (page == null) return '—';
  if (summary.abandoned_before_end && summary.abandonment_page != null) {
    return `Pág. ${page} (antes do fim)`;
  }
  return `Pág. ${page}`;
}

export const HEATMAP_GAP_LABEL = 'Vista sem conclusão';

export const IMAGE_EXPOSURE_LABEL = 'Imagem exposta';

export const IMAGE_EXPOSURE_NOTE =
  'Não representa atenção — apenas exposição na viewport.';

export const MODAL_TIME_LABEL = 'Tempo no modal';

/** Maior `currentTime` atingido no elemento de vídeo — não é tempo real de tela. */
export const VIDEO_WATCH_TIME_LABEL = 'Posição máxima no vídeo';

/** Percentual do arquivo alcançado no timeline — distinto de atenção ou tempo real. */
export const VIDEO_MAX_PROGRESS_LABEL = 'Alcance no vídeo';

/** Tempo real com o vídeo reproduzindo (relógio de parede, exclui pausa). */
export const VIDEO_PLAYBACK_WALL_LABEL = 'Tempo real de reprodução';

export const VIDEO_SEEK_COUNT_LABEL = 'Pulos no vídeo';

export const VIDEO_LARGEST_SKIP_LABEL = 'Maior salto no timeline';

export const VIDEO_METRICS_EXPLANATION =
  'Posição máxima = ponto mais avançado no arquivo. Tempo real de reprodução = relógio com o vídeo tocando (sem pausa). Compare ambos com o tempo no modal.';

export const VIDEO_COMPLETED_LABEL = 'Vídeo concluído';

export const RESOURCE_ENGAGEMENT_MODAL_LABEL = 'Tempo no modal';

export const TAB_HIDDEN_TIME_LABEL = 'Tempo fora da aba';

export const TAB_HIDDEN_COUNT_LABEL = 'Saídas da aba';

export const TAB_FOCUS_RETURN_COUNT_LABEL = 'Retornos à aba';
