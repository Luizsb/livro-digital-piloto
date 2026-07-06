import {
  getChapterTotalPages,
  getMinCompletionRateForChapter,
  resolveChapterPageBounds,
} from '../ld/chapterPageConfig';
import type { EventSummary } from '../ld/sessionSummary';
import type { DashboardAlert, HealthCheckItem, ParsedDashboardReport } from './types';
import {
  buildCollectionQualityChecks,
  type EventIntegrityStatus,
  type QualityCheckItem,
} from '../ld/collectionQuality';
import {
  extractSessionDurationSeconds,
  extractSessionVisibleSeconds,
  formatDuration,
  getChapterStatusLabel,
  getParticipantLabel,
} from './reportExtractors';
import { formatBrowserLabel } from '../ld/deviceContext';

export function buildChapterStatusInsight(summary: EventSummary): string {
  const bounds = resolveChapterPageBounds(summary);
  const totalPages = getChapterTotalPages(bounds);
  const minCompletionRate = getMinCompletionRateForChapter(summary.book_id, summary.chapter_id);
  const status = getChapterStatusLabel(summary);

  if (summary.chapter_completed_count > 0 && summary.completion_rate >= minCompletionRate) {
    return 'Capítulo concluído conforme critério mínimo.';
  }

  if (summary.chapter_finished_count > 0 && summary.completion_rate < minCompletionRate) {
    const depth = summary.reading_depth_label ?? 'leitura não classificada';
    let text = `Capítulo finalizado, mas não concluído plenamente. O participante visualizou ${summary.pages_viewed_count} de ${totalPages} páginas, concluiu ${summary.completion_rate}% delas e realizou ${depth.toLowerCase()}.`;
    if (summary.abandoned_before_end && summary.abandonment_page != null) {
      text += ` A última página em que esteve foi a pág. ${summary.abandonment_page} (não chegou ao fim do capítulo).`;
    }
    return text;
  }

  if (summary.abandoned_before_end && summary.abandonment_page != null) {
    return `O participante não visualizou todas as páginas do capítulo. A última página em que esteve foi a pág. ${summary.abandonment_page}.`;
  }

  if (
    summary.pages_viewed_count === totalPages &&
    summary.reading_depth === 'quick_scan'
  ) {
    return 'Usuário percorreu o capítulo rapidamente.';
  }

  if (status === 'Não finalizado') {
    return 'O participante ainda não registrou finalização do capítulo nesta sessão.';
  }

  return 'Situação do capítulo registrada no relatório.';
}

export function buildSessionInsight(parsed: ParsedDashboardReport): string {
  const { summary, events } = parsed;
  const participant = getParticipantLabel(summary);
  const totalPages =
    summary.chapter_total_pages ?? getChapterTotalPages(resolveChapterPageBounds(summary));
  const viewedPct =
    totalPages > 0 ? Math.round((summary.pages_viewed_count / totalPages) * 100) : 0;
  const duration = formatDuration(extractSessionDurationSeconds(events));
  const visibleDuration = formatDuration(extractSessionVisibleSeconds(events, summary));
  const depth = summary.reading_depth_label ?? 'não classificada';
  const status = getChapterStatusLabel(summary).toLowerCase();
  const deviceLine =
    summary.device_type_label && summary.os_name && summary.browser_name
      ? ` Acesso via ${summary.device_type_label.toLowerCase()} (${summary.os_name}, ${formatBrowserLabel(summary.browser_name, summary.browser_version)}).`
      : '';
  const feedbackRating = summary.feedback.submitted
    ? `${summary.feedback.rating}/5`
    : 'sem feedback';
  const wouldUse = summary.feedback.submitted
    ? formatWouldUseAgain(summary.feedback.would_use_again)
    : null;

  let text = `O participante ${participant} visualizou ${viewedPct}% das páginas do capítulo, com taxa de conclusão de páginas de ${summary.completion_rate}%, foi exposto a ${summary.images_viewed_unique_count} imagem(ns) e interagiu com ${summary.image_zoom_unique_count} delas por meio de zoom, abriu ${summary.resources_opened_total} recurso(s) digital(is) e finalizou o capítulo com status ${status}.`;
  if (duration !== visibleDuration) {
    text += ` O tempo visível no livro foi ${visibleDuration} e o participante passou ${duration} no total da sessão (incluindo tempo fora da aba).`;
  } else {
    text += ` O tempo no livro foi ${visibleDuration}.`;
  }
  text += ` A leitura foi classificada como ${depth}.${deviceLine}`;

  if (typeof summary.idle_time_seconds === 'number' && summary.idle_time_seconds > 0) {
    text += ` Permaneceu cerca de ${formatDuration(summary.idle_time_seconds)} sem interagir com a aba visível.`;
  }

  if (summary.abandoned_before_end && summary.abandonment_page != null) {
    text += ` Não percorreu o capítulo até o fim — última página em que esteve: pág. ${summary.abandonment_page}.`;
  }

  if (summary.feedback.submitted) {
    text += ` O feedback geral foi ${feedbackRating}`;
    if (wouldUse) {
      text += `, com intenção de uso marcada como "${wouldUse}".`;
    } else {
      text += '.';
    }
  }

  if (summary.teacher_button_opened_count > 0) {
    const uniqueCount = summary.teacher_button_unique_count;
    const totalOpens = summary.teacher_button_opened_count;
    const uniqueLabel =
      uniqueCount === 1 ? '1 seção' : `${uniqueCount} seções diferentes`;

    text += ` O botão do professor foi aberto ${totalOpens} ${totalOpens === 1 ? 'vez' : 'vezes'} em ${uniqueLabel}, com tempo total de ${summary.teacher_button_total_seconds} segundos.`;

    if (summary.most_opened_teacher_section && summary.teacher_button_repeated_count > 0) {
      const top = summary.most_opened_teacher_section;
      text += ` A seção mais acessada foi a da página ${top.page}, aberta ${top.open_count} vezes, com ${top.total_seconds} segundos de uso total.`;
    } else if (uniqueCount > 0) {
      text += ' Não houve repetição na mesma seção.';
    }
  } else {
    text += ' O botão do professor não foi acessado nesta sessão.';
  }

  if (summary.escola_digital_opened_count > 0) {
    if (summary.escola_digital_video_play_count > 0) {
      if (summary.escola_digital_video_watched_to_end) {
        text += ' Assistiu o vídeo da Escola Digital até o final.';
      } else {
        text += ` Reproduziu o vídeo da Escola Digital com progresso máximo de ${summary.escola_digital_video_max_progress_percent}%, sem conclusão até o fim.`;
      }
    } else {
      text += ' Abriu o modal da Escola Digital, mas não iniciou a reprodução do vídeo.';
    }
  }

  if (typeof summary.expected_pages_count === 'number') {
    const coverageParts: string[] = [];
    if ((summary.expected_images_count ?? 0) > 0) {
      const exposed =
        (summary.expected_images_count ?? 0) - (summary.images_not_exposed?.length ?? 0);
      coverageParts.push(
        `${exposed}/${summary.expected_images_count} imagens rastreáveis expostas`,
      );
    }
    if ((summary.expected_resources_count ?? 0) > 0) {
      const opened =
        (summary.expected_resources_count ?? 0) - (summary.resources_not_opened?.length ?? 0);
      coverageParts.push(`${opened}/${summary.expected_resources_count} recursos digitais abertos`);
    }
    if ((summary.expected_teacher_buttons_count ?? 0) > 0) {
      const used =
        (summary.expected_teacher_buttons_count ?? 0) -
        (summary.teacher_buttons_not_used?.length ?? 0);
      coverageParts.push(
        `${used}/${summary.expected_teacher_buttons_count} seções do professor consultadas`,
      );
    }
    if (coverageParts.length > 0) {
      text += ` Em relação ao inventário do capítulo: ${coverageParts.join('; ')}.`;
    }
    if ((summary.expected_activities_count ?? 0) === 0) {
      text += ' Este capítulo não possui atividades interativas rastreáveis nesta versão.';
    }
  }

  return text;
}

function formatWouldUseAgain(value: string | undefined): string {
  if (!value) return '—';
  const map: Record<string, string> = { sim: 'Sim', nao: 'Não', talvez: 'Talvez' };
  return map[value] ?? value;
}

const QUALITY_CATEGORY_LABELS: Record<QualityCheckItem['category'], string> = {
  session: 'Sessão',
  journey: 'Jornada',
  content: 'Conteúdo',
  teacher: 'Professor',
};

export function getIntegrityStatusLabel(status: EventIntegrityStatus): string {
  if (status === 'ok') return 'Confiável';
  if (status === 'warning') return 'Atenção';
  return 'Comprometida';
}

export function getIntegrityStatusClass(status: EventIntegrityStatus): string {
  if (status === 'ok') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'warning') return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-red-800 bg-red-50 border-red-200';
}

export function buildQualityChecksByCategory(
  events: ParsedDashboardReport['events'],
  summary: EventSummary,
): Record<QualityCheckItem['category'], QualityCheckItem[]> {
  const checks = buildCollectionQualityChecks(events, summary);
  return {
    session: checks.filter((item) => item.category === 'session'),
    journey: checks.filter((item) => item.category === 'journey'),
    content: checks.filter((item) => item.category === 'content'),
    teacher: checks.filter((item) => item.category === 'teacher'),
  };
}

export { QUALITY_CATEGORY_LABELS };

export function buildHealthChecks(summary: EventSummary): HealthCheckItem[] {
  const by = summary.by_event_name;
  const has = (name: string) => (by[name] ?? 0) > 0;

  const lifecycle: HealthCheckItem[] = [
    { id: 'session_started', label: 'Sessão iniciada', ok: has('session_started') },
    { id: 'book_opened', label: 'Livro aberto', ok: has('book_opened') },
    { id: 'session_finished', label: 'Sessão finalizada', ok: has('session_finished') },
    { id: 'events_exported', label: 'Eventos exportados', ok: has('events_exported') },
  ];

  if (typeof summary.data_quality_score === 'number') {
    return lifecycle;
  }

  return [
    ...lifecycle,
    {
      id: 'page_viewed',
      label: 'Páginas visualizadas',
      ok: summary.pages_viewed_count > 0,
    },
    {
      id: 'page_completed',
      label: 'Páginas concluídas',
      ok: summary.pages_completed_count > 0,
    },
    {
      id: 'images',
      label: 'Exposição de imagens rastreada',
      ok: summary.images_viewed_unique_count > 0,
    },
    {
      id: 'resources',
      label: 'Recursos rastreados',
      ok: summary.resources_opened_total > 0,
    },
    ...(summary.teacher_button_opened_count > 0
      ? [
          {
            id: 'teacher_button',
            label: 'Botão do professor rastreado',
            ok: true,
          } satisfies HealthCheckItem,
        ]
      : []),
    {
      id: 'feedback',
      label: 'Feedback enviado',
      ok: summary.feedback_count > 0,
    },
    {
      id: 'chapter_finished',
      label: 'Capítulo finalizado',
      ok: summary.chapter_finished_count > 0,
    },
  ];
}

export function buildAlerts(summary: EventSummary): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (summary.chapter_finished_count > 0 && summary.chapter_completed_count === 0) {
    alerts.push({
      id: 'partial_chapter',
      message: 'Capítulo finalizado, mas não concluído conforme critério.',
      severity: 'warning',
    });
  }

  if (summary.reading_depth === 'quick_scan') {
    const depthLabel = summary.reading_depth_label ?? 'Varredura rápida';
    alerts.push({
      id: 'quick_scan',
      message: `Leitura classificada como ${depthLabel}.`,
      severity: 'warning',
    });
  }

  const hiddenSeconds = summary.hidden_time_seconds;
  if (typeof hiddenSeconds === 'number' && hiddenSeconds > 0) {
    alerts.push({
      id: 'tab_hidden',
      message:
        'O participante saiu da aba durante a sessão. O tempo visível foi usado para análise de leitura.',
      severity: 'info',
    });
  }

  if (summary.feedback.has_comment) {
    alerts.push({
      id: 'open_comment',
      message: 'Existe comentário aberto separado do evento principal.',
      severity: 'info',
    });
  }

  if (summary.teacher_button_opened_count === 0) {
    alerts.push({
      id: 'teacher_not_used',
      message: 'Botão do professor não foi acessado nesta sessão.',
      severity: 'info',
    });
  }

  if (!(summary.by_event_name.events_exported > 0)) {
    alerts.push({
      id: 'no_export_event',
      message: 'Exportação não registrada no relatório.',
      severity: 'warning',
    });
  }

  if (summary.images_with_errors.length > 0) {
    alerts.push({
      id: 'image_errors',
      message: 'Existem imagens com erro de carregamento.',
      severity: 'warning',
    });
  }

  if (summary.runtime_errors_count > 0) {
    alerts.push({
      id: 'runtime_errors',
      message: `Foram registrados ${summary.runtime_errors_count} erro(s) de script na sessão.`,
      severity: 'warning',
    });
  }

  if (summary.render_errors_count > 0) {
    alerts.push({
      id: 'render_errors',
      message: 'Houve falha de renderização em parte do livro.',
      severity: 'warning',
    });
  }

  if (summary.asset_load_errors_count > 0) {
    alerts.push({
      id: 'asset_load_errors',
      message: 'Um ou mais assets (script, CSS ou imagem) não carregaram.',
      severity: 'warning',
    });
  }

  if (summary.links_open_failed_count > 0) {
    alerts.push({
      id: 'link_open_failed',
      message: 'Um ou mais links internos falharam ao ser acessados.',
      severity: 'warning',
    });
  }

  return alerts;
}

const INTERPRETATION_ALERT_IDS = new Set([
  'partial_chapter',
  'quick_scan',
  'tab_hidden',
  'open_comment',
  'teacher_not_used',
]);

const TECHNICAL_ALERT_IDS = new Set([
  'no_export_event',
  'image_errors',
  'runtime_errors',
  'render_errors',
  'asset_load_errors',
  'link_open_failed',
]);

export function buildInterpretationAlerts(summary: EventSummary): DashboardAlert[] {
  return buildAlerts(summary).filter((alert) => INTERPRETATION_ALERT_IDS.has(alert.id));
}

export function buildTechnicalAlerts(summary: EventSummary): DashboardAlert[] {
  return buildAlerts(summary).filter((alert) => TECHNICAL_ALERT_IDS.has(alert.id));
}
