/** Duração legível (dashboard, resumos). */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest > 0 ? `${minutes}min ${rest}s` : `${minutes}min`;
}

/** Tempo de carregamento da página (Performance API). */
export function formatLoadTimeMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Relógio MM:SS ou H:MM:SS para contador ao vivo. */
export function formatDurationClock(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
