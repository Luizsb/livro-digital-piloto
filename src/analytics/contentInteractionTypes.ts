/** Tipos de recurso em `resource_opened` / `resource_engagement_recorded`. */
export type LinkTrackType =
  | 'external_link'
  | 'qr_code'
  | 'oda_opened'
  | 'oda_engagement'
  | 'escola_digital_opened'
  | 'escola_digital_engagement'
  | 'embedded_resource';

export const LINK_TYPE_LABELS: Record<LinkTrackType, string> = {
  external_link: 'Link externo',
  qr_code: 'QR Code',
  oda_opened: 'ODA aberto',
  oda_engagement: 'Tempo no ODA',
  escola_digital_opened: 'Escola Digital aberta',
  escola_digital_engagement: 'Tempo na Escola Digital',
  embedded_resource: 'Recurso embutido',
};

/** Tipos disparados ao abrir modal — mapeiam para o evento de tempo ao fechar. */
export const LINK_ENGAGEMENT_BY_OPEN_TYPE: Partial<Record<LinkTrackType, LinkTrackType>> = {
  oda_opened: 'oda_engagement',
  escola_digital_opened: 'escola_digital_engagement',
};

export function getEngagementTypeForOpen(openType: LinkTrackType): LinkTrackType | null {
  return LINK_ENGAGEMENT_BY_OPEN_TYPE[openType] ?? null;
}

const LINK_CLICKED_DESCRIPTIONS: Partial<Record<LinkTrackType, string>> = {
  oda_opened: 'Participante clicou para abrir o ODA (jogo/atividade digital).',
  oda_engagement: 'Participante fechou o ODA; registra quanto tempo ficou no recurso.',
  escola_digital_opened: 'Participante clicou para abrir o vídeo da Escola Digital.',
  escola_digital_engagement:
    'Participante fechou o vídeo da Escola Digital; registra tempo de uso.',
  external_link: 'Participante clicou em um link externo do capítulo.',
  qr_code: 'Participante acessou um recurso via QR Code.',
  embedded_resource: 'Participante abriu um recurso embutido no capítulo.',
};

export function getLinkClickedDescription(type: LinkTrackType): string {
  return (
    LINK_CLICKED_DESCRIPTIONS[type] ??
    'Participante interagiu com um link ou recurso digital do capítulo.'
  );
}

export function getLinkClickedLabel(type: LinkTrackType | string | undefined): string | null {
  if (!type || typeof type !== 'string') return null;
  return LINK_TYPE_LABELS[type as LinkTrackType] ?? null;
}

/** Extrai domínio para metadata sem registrar URL completa. */
export function extractHrefDomain(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.hostname.replace(/^www\./, '');
    }
  } catch {
    // ignore
  }
  return undefined;
}

/** Caminho relativo para metadata (ex.: images/foo.png). */
export function normalizeImageSrcPath(src: string): string {
  return src.replace(/^\//, '').replace(/^.*\/public\//, '');
}
