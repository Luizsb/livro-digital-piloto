import {
  getChapterTotalPages,
  getMinCompletionRateForChapter,
  resolveChapterPageBounds,
} from '../analytics/chapterPageConfig';
import type { EventSummary } from '../analytics/eventSummary';
import type { DashboardAlert, HealthCheckItem, ParsedDashboardReport } from './types';
import {
  extractSessionDurationSeconds,
  formatDuration,
  getChapterStatusLabel,
  getParticipantLabel,
} from './reportExtractors';
import { formatBrowserLabel } from '../analytics/deviceContext';

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
    return `Capítulo finalizado, mas não concluído plenamente. O participante visualizou ${summary.pages_viewed_count} de ${totalPages} páginas, concluiu ${summary.completion_rate}% delas e realizou ${depth.toLowerCase()}.`;
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

  let text = `O participante ${participant} visualizou ${viewedPct}% das páginas do capítulo, concluiu ${summary.completion_rate}%, foi exposto a ${summary.images_viewed_unique_count} imagem(ns) e interagiu com ${summary.image_zoom_unique_count} delas por meio de zoom, abriu ${summary.resources_opened_total} recurso(s) digital(is) e finalizou o capítulo com status ${status}. A sessão durou ${duration} e foi classificada como ${depth}.${deviceLine}`;

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

  return text;
}

function formatWouldUseAgain(value: string | undefined): string {
  if (!value) return '—';
  const map: Record<string, string> = { sim: 'Sim', nao: 'Não', talvez: 'Talvez' };
  return map[value] ?? value;
}

export function buildHealthChecks(summary: EventSummary): HealthCheckItem[] {
  const by = summary.by_event_name;
  const has = (name: string) => (by[name] ?? 0) > 0;

  return [
    { id: 'session_started', label: 'Sessão iniciada', ok: has('session_started') },
    { id: 'book_opened', label: 'Livro aberto', ok: has('book_opened') },
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
    {
      id: 'session_finished',
      label: 'Sessão finalizada',
      ok: has('session_finished'),
    },
    {
      id: 'events_exported',
      label: 'Eventos exportados',
      ok: has('events_exported'),
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
