/** Fuso usado na exibição e nos campos `*_br` do export JSON. */
export const ANALYTICS_TIMEZONE_BR = 'America/Sao_Paulo' as const;

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ANALYTICS_TIMEZONE_BR,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ANALYTICS_TIMEZONE_BR,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Data e hora em pt-BR, fuso de Brasília — ex.: `30/06/2026, 14:32:12`. */
export function formatDateTimeBr(iso: string): string {
  if (!iso) return '—';
  try {
    return dateTimeFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Somente a data em pt-BR, fuso de Brasília — ex.: `30/06/2026`. */
export function formatDateBr(iso: string): string {
  if (!iso) return '—';
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}
