export type LoadTimeRating = 'good' | 'fair' | 'poor';

export interface LoadTimeRatingInfo {
  rating: LoadTimeRating;
  label: string;
  hint: string;
  badgeClass: string;
}

/** Limites inspirados em boas práticas de carregamento inicial (não são Core Web Vitals oficiais). */
const LOAD_TIME_THRESHOLDS_MS = {
  good: 2500,
  fair: 4000,
} as const;

export function getLoadTimeRating(ms: number | null | undefined): LoadTimeRatingInfo | null {
  if (ms == null || ms <= 0) return null;

  if (ms <= LOAD_TIME_THRESHOLDS_MS.good) {
    return {
      rating: 'good',
      label: 'Bom',
      hint: 'Carregamento rápido para o participante.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }

  if (ms <= LOAD_TIME_THRESHOLDS_MS.fair) {
    return {
      rating: 'fair',
      label: 'Moderado',
      hint: 'Aceitável, mas pode melhorar em conexões lentas.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }

  return {
    rating: 'poor',
    label: 'Lento',
    hint: 'O participante pode ter percebido demora ao abrir o livro.',
    badgeClass: 'border-red-200 bg-red-50 text-red-800',
  };
}
