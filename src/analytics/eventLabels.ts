import type { ChapterCompletionStatus } from './chapterMetrics';
import { COMPLETION_REASON_LABELS, type PageCompletionReason } from './pageReadingState';
import { READING_DEPTH_LABELS, type ReadingDepth } from './readingQuality';
import {
  LINK_TYPE_LABELS,
  getLinkClickedDescription,
  getLinkClickedLabel,
  type LinkTrackType,
} from './contentInteractionTypes';
import {
  VIDEO_TYPE_LABELS,
  type VideoTrackType,
} from './videoInteractionTypes';
import { ANALYTICS_EVENT_NAMES } from './eventTypes';
import type { AnalyticsEvent } from './eventTypes';
import {
  isResourceEngagementEvent,
  isResourceOpenedEvent,
} from './resourceEvents';

export interface EventCatalogEntry {
  label: string;
  description: string;
  /** Se o evento já está sendo disparado no piloto atual. */
  active: boolean;
}

export const EVENT_CATALOG: Record<string, EventCatalogEntry> = {
  [ANALYTICS_EVENT_NAMES.sessionStarted]: {
    label: 'Sessão iniciada',
    description:
      'Participante entrou com código válido; registra tipo de dispositivo, SO e navegador.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.sessionResumed]: {
    label: 'Sessão retomada',
    description: 'Participante recarregou a página (F5) com sessão ativa.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.bookOpened]: {
    label: 'Livro aberto',
    description: 'Capítulo foi exibido após o código do participante.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.pageViewed]: {
    label: 'Página visualizada',
    description:
      'A página apareceu na tela (marcador `data-book-page` cruzou o gatilho de scroll).',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.pageCompleted]: {
    label: 'Página concluída',
    description:
      'Página ficou visível pelo tempo mínimo configurado ou foi concluída ao encerrar a sessão.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.imageViewed]: {
    label: 'Imagem exposta',
    description:
      'Imagem entrou na viewport (exposição na tela). Não indica atenção ou engajamento — apenas que o asset foi exibido.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.imageZoomed]: {
    label: 'Zoom de imagem',
    description: 'Interação intencional: participante ampliou a imagem.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.imageLoadError]: {
    label: 'Erro ao carregar imagem',
    description: 'Uma imagem não carregou corretamente.',
    active: false,
  },
  [ANALYTICS_EVENT_NAMES.resourceOpened]: {
    label: 'Recurso aberto',
    description: 'Participante abriu ODA, Escola Digital, link externo ou QR.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.resourceEngagementRecorded]: {
    label: 'Tempo no recurso',
    description: 'Participante fechou um recurso modal; registra duração de uso.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.videoStarted]: {
    label: 'Vídeo iniciado',
    description: 'Participante deu play em um vídeo do capítulo (reprodução intencional).',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.videoCompleted]: {
    label: 'Vídeo concluído',
    description: 'Participante assistiu o vídeo até o final (evento ended).',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.videoProgressRecorded]: {
    label: 'Progresso do vídeo',
    description:
      'Participante fechou o vídeo ou encerrou a sessão sem assistir até o fim; registra progresso máximo.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.linkClicked]: {
    label: 'Link acessado',
    description: 'Evento legado — substituído por recurso aberto / tempo no recurso.',
    active: false,
  },
  [ANALYTICS_EVENT_NAMES.teacherButtonOpened]: {
    label: 'Botão do professor aberto',
    description: 'Usuário abriu o conteúdo do botão Para o Professor.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.teacherButtonClosed]: {
    label: 'Botão do professor fechado',
    description: 'Usuário fechou o conteúdo do professor; registra tempo aberto.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.activityStarted]: {
    label: 'Atividade iniciada',
    description: 'Usuário começou uma atividade interativa.',
    active: false,
  },
  [ANALYTICS_EVENT_NAMES.activityCompleted]: {
    label: 'Atividade concluída',
    description: 'Usuário finalizou uma atividade interativa.',
    active: false,
  },
  [ANALYTICS_EVENT_NAMES.accessibilityChanged]: {
    label: 'Acessibilidade alterada',
    description: 'Usuário mudou tamanho da fonte, contraste ou leitura em voz alta.',
    active: false,
  },
  [ANALYTICS_EVENT_NAMES.feedbackSubmitted]: {
    label: 'Feedback enviado',
    description:
      'Participante respondeu ao formulário de feedback. Comentários ficam em `feedback_comments` no export.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.chapterFinished]: {
    label: 'Capítulo finalizado',
    description:
      'Participante clicou em Finalizar teste — encerrou o fluxo do capítulo (não implica leitura completa).',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.chapterCompleted]: {
    label: 'Capítulo concluído',
    description:
      'Critério mínimo atingido: todas as páginas visualizadas e ≥70% concluídas ao finalizar.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.eventsExported]: {
    label: 'Eventos exportados',
    description: 'Relatório JSON foi baixado pelo botão de exportação.',
    active: true,
  },
  [ANALYTICS_EVENT_NAMES.sessionFinished]: {
    label: 'Sessão finalizada',
    description: 'Fim da sessão de teste (distinto da conclusão pedagógica do capítulo).',
    active: true,
  },
};

const CHAPTER_COMPLETION_STATUS_LABELS: Record<ChapterCompletionStatus, string> = {
  completed: 'Concluído',
  partial: 'Parcial',
  quick_finished: 'Finalização rápida',
  abandoned: 'Abandonado',
};

const FINISH_SOURCE_LABELS: Record<string, string> = {
  finish_button: 'Botão Finalizar teste',
  page_unload: 'Saída da aba',
};

const WOULD_USE_AGAIN_LABELS: Record<string, string> = {
  sim: 'Sim',
  nao: 'Não',
  talvez: 'Talvez',
};

const METADATA_LABELS: Record<string, string> = {
  page: 'Página',
  duration_seconds: 'Duração (s)',
  completion_reason: 'Motivo da conclusão',
  pages_viewed_count: 'Páginas visualizadas',
  pages_completed_count: 'Páginas concluídas',
  avg_seconds_per_viewed_page: 'Média por página visualizada (s)',
  avg_seconds_per_completed_page: 'Média por página concluída (s)',
  avg_seconds_per_page: 'Média por página (s)',
  reading_depth: 'Profundidade de leitura',
  reading_depth_label: 'Profundidade (label)',
  completion_status: 'Status do capítulo',
  finish_source: 'Origem do encerramento',
  total_pages: 'Total de páginas',
  last_page_viewed: 'Última página vista',
  event_count_before_export: 'Eventos antes da exportação',
  export_format: 'Formato',
  export_source: 'Origem da exportação',
  activity_id: 'Atividade',
  section: 'Seção do professor',
  section_id: 'Seção do professor',
  teacher_button_id: 'Botão do professor',
  image_id: 'Imagem',
  src: 'Arquivo',
  link_id: 'Recurso',
  type: 'Tipo',
  video_id: 'Vídeo',
  watched_to_end: 'Assistiu até o fim',
  watch_duration_seconds: 'Tempo assistido (s)',
  video_duration_seconds: 'Duração do vídeo (s)',
  max_progress_percent: 'Progresso máximo (%)',
  href_domain: 'Domínio',
  export_count: 'Exportação nº',
  event_count_at_export: 'Total de eventos na exportação',
  font_scale: 'Tamanho da fonte',
  high_contrast: 'Alto contraste',
  screen_reader: 'Leitor de tela',
  rating: 'Avaliação geral',
  navigation_clarity: 'Clareza da navegação',
  visual_comfort: 'Conforto de leitura',
  resource_usefulness: 'Utilidade dos recursos',
  would_use_again: 'Usaria novamente',
  has_comment: 'Incluiu comentário',
  comment_length: 'Tamanho do comentário (car.)',
  device_type: 'Tipo de dispositivo',
  device_type_label: 'Dispositivo',
  os_name: 'Sistema operacional',
  browser_name: 'Navegador',
  browser_version: 'Versão do navegador',
  screen_width: 'Largura da tela (px)',
  screen_height: 'Altura da tela (px)',
  viewport_width: 'Largura da janela (px)',
  viewport_height: 'Altura da janela (px)',
  is_touch_device: 'Tela touch',
  app_language: 'Idioma do app',
  browser_language: 'Idioma do navegador',
  language: 'Idioma do navegador (legado)',
};

function formatMetadataValue(key: string, value: unknown): string {
  if (key === 'completion_reason' && typeof value === 'string') {
    return COMPLETION_REASON_LABELS[value as PageCompletionReason] ?? value;
  }
  if (key === 'reading_depth' && typeof value === 'string') {
    return READING_DEPTH_LABELS[value as ReadingDepth] ?? value;
  }
  if (key === 'completion_status' && typeof value === 'string') {
    return (
      CHAPTER_COMPLETION_STATUS_LABELS[value as ChapterCompletionStatus] ?? value
    );
  }
  if (key === 'finish_source' && typeof value === 'string') {
    return FINISH_SOURCE_LABELS[value] ?? value;
  }
  if (key === 'type' && typeof value === 'string') {
    return (
      LINK_TYPE_LABELS[value as LinkTrackType] ??
      VIDEO_TYPE_LABELS[value as VideoTrackType] ??
      value
    );
  }
  if (key === 'would_use_again' && typeof value === 'string') {
    return WOULD_USE_AGAIN_LABELS[value] ?? value;
  }
  if (key === 'device_type' && typeof value === 'string') {
    const map: Record<string, string> = {
      desktop: 'Computador',
      tablet: 'Tablet',
      mobile: 'Celular',
    };
    return map[value] ?? value;
  }
  if (typeof value === 'boolean') return value ? 'sim' : 'não';
  if (value === null || value === undefined) return '—';
  return String(value);
}

export function getEventLabel(eventName: string): string {
  return EVENT_CATALOG[eventName]?.label ?? eventName;
}

export interface EventDisplayInfo {
  label: string;
  description?: string;
}

function getResourceSubtypeDescription(event: AnalyticsEvent): string | undefined {
  const type = event.metadata?.type;
  if (typeof type !== 'string') return undefined;
  return getLinkClickedDescription(type as LinkTrackType);
}

export function getEventDisplayInfo(event: AnalyticsEvent): EventDisplayInfo {
  if (isResourceOpenedEvent(event)) {
    const type = event.metadata?.type;
    const subtype =
      typeof type === 'string' ? getLinkClickedLabel(type) : null;
    return {
      label: 'Recurso aberto',
      description: subtype
        ? `${subtype} — ${getLinkClickedDescription(type as LinkTrackType)}`
        : EVENT_CATALOG[ANALYTICS_EVENT_NAMES.resourceOpened]?.description,
    };
  }

  if (isResourceEngagementEvent(event)) {
    const type = event.metadata?.type;
    const subtype =
      typeof type === 'string' ? getLinkClickedLabel(type) : null;
    return {
      label: 'Tempo no recurso',
      description: subtype
        ? `${subtype} — ${getLinkClickedDescription(type as LinkTrackType)}`
        : EVENT_CATALOG[ANALYTICS_EVENT_NAMES.resourceEngagementRecorded]?.description,
    };
  }

  const catalog = EVENT_CATALOG[event.event_name];
  return {
    label: getEventLabel(event.event_name),
    description: catalog?.description,
  };
}

export interface EventBadge {
  key: string;
  label: string;
  count: number;
  description?: string;
}

/** Contadores do topo do painel. */
export function buildEventBadges(events: AnalyticsEvent[]): EventBadge[] {
  const byEventName = new Map<string, number>();
  const resourceOpenByType = new Map<string, number>();
  const resourceEngagementByType = new Map<string, number>();

  for (const event of events) {
    if (isResourceOpenedEvent(event)) {
      const type =
        typeof event.metadata?.type === 'string' ? event.metadata.type : 'desconhecido';
      resourceOpenByType.set(type, (resourceOpenByType.get(type) ?? 0) + 1);
      continue;
    }

    if (isResourceEngagementEvent(event)) {
      const type =
        typeof event.metadata?.type === 'string' ? event.metadata.type : 'desconhecido';
      resourceEngagementByType.set(type, (resourceEngagementByType.get(type) ?? 0) + 1);
      continue;
    }

    byEventName.set(event.event_name, (byEventName.get(event.event_name) ?? 0) + 1);
  }

  const badges: EventBadge[] = [...byEventName.entries()].map(([name, count]) => ({
    key: name,
    label: getEventLabel(name),
    count,
    description: EVENT_CATALOG[name]?.description,
  }));

  for (const [type, count] of resourceOpenByType.entries()) {
    const subtype = getLinkClickedLabel(type) ?? type;
    badges.push({
      key: `resource_opened:${type}`,
      label: `Recurso aberto (${subtype})`,
      count,
      description: getLinkClickedDescription(type as LinkTrackType),
    });
  }

  for (const [type, count] of resourceEngagementByType.entries()) {
    const subtype = getLinkClickedLabel(type) ?? type;
    badges.push({
      key: `resource_engagement:${type}`,
      label: `Tempo no recurso (${subtype})`,
      count,
      description: getLinkClickedDescription(type as LinkTrackType),
    });
  }

  return badges.sort((a, b) => b.count - a.count);
}

export function formatMetadataForDisplay(metadata: Record<string, unknown>): string | null {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return null;

  return keys
    .map((key) => {
      const label = METADATA_LABELS[key] ?? key.replace(/_/g, ' ');
      return `${label}: ${formatMetadataValue(key, metadata[key])}`;
    })
    .join(' · ');
}

export function getActiveEventCatalog(): EventCatalogEntry[] {
  return Object.values(EVENT_CATALOG).filter((entry) => entry.active);
}
