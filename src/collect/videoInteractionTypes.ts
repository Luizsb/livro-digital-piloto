/** Tipos em metadata de eventos `video_*`. */
export type VideoTrackType = 'escola_digital_video';

export const VIDEO_TYPE_LABELS: Record<VideoTrackType, string> = {
  escola_digital_video: 'Vídeo Escola Digital',
};

const VIDEO_TYPE_DESCRIPTIONS: Record<VideoTrackType, string> = {
  escola_digital_video:
    'Participante reproduziu o vídeo da Escola Digital (play intencional).',
};

export function getVideoTypeLabel(type: VideoTrackType | string | undefined): string | null {
  if (!type || typeof type !== 'string') return null;
  return VIDEO_TYPE_LABELS[type as VideoTrackType] ?? null;
}

export function getVideoTypeDescription(type: VideoTrackType | string | undefined): string {
  if (!type || typeof type !== 'string') {
    return 'Participante interagiu com um vídeo do capítulo.';
  }
  return (
    VIDEO_TYPE_DESCRIPTIONS[type as VideoTrackType] ??
    'Participante interagiu com um vídeo do capítulo.'
  );
}
