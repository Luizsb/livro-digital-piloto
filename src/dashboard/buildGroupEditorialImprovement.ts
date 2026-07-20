import type { GroupReport } from './types';
import { DEVICE_TYPE_LABELS, type DeviceType } from '@analytics/deviceContext';
import { formatDuration } from './reportExtractors';
import { pluralSessao } from '@shared/lib/pluralizePt';

export type EditorialBacklogArea = 'conteudo' | 'recurso' | 'ux' | 'tecnico';

export interface EditorialBacklogItem {
  id: string;
  area: EditorialBacklogArea;
  priority: 'high' | 'medium';
  title: string;
  detail: string;
}

export interface EditorialPageReviewItem {
  page: number;
  viewedPct: number;
  completedPct: number;
  avg_dwell_seconds: number | null;
  issue: string;
}

export interface EditorialImageHighlight {
  image_id: string;
  label: string;
  interaction_pct: number;
  zoom_total: number;
  viewed_sessions: number;
}

export interface EditorialResourceGap {
  label: string;
  open_pct: number;
  sessions_missed: number;
}

export interface EditorialDeviceExperience {
  device_label: string;
  session_count: number;
  avg_load_ms: number | null;
  technical_issue_sessions: number;
}

export interface GroupEditorialImprovement {
  backlog: EditorialBacklogItem[];
  pages_for_review: EditorialPageReviewItem[];
  interactive_images: EditorialImageHighlight[];
  underused_resources: EditorialResourceGap[];
  device_experience: EditorialDeviceExperience[];
  feedback_summary: {
    avg_rating: number | null;
    avg_navigation_clarity: number | null;
    avg_visual_comfort: number | null;
    avg_resource_usefulness: number | null;
    feedback_count: number;
  };
}

const QUICK_READING_LABELS = ['Leitura rápida', 'Varredura rápida'];
const LOW_SCORE_THRESHOLD = 3.5;
const LOW_DWELL_SECONDS = 8;

function shortImageLabel(imageId: string): string {
  const page = imageId.match(/page_(\d+)/)?.[1];
  return page ? `Imagem pág. ${page}` : imageId.replace(/_/g, ' ');
}

export function editorialBacklogAreaLabel(area: EditorialBacklogArea): string {
  switch (area) {
    case 'conteudo':
      return 'Conteúdo';
    case 'recurso':
      return 'Recurso digital';
    case 'ux':
      return 'UX / leitura';
    case 'tecnico':
      return 'Experiência técnica';
  }
}

export function buildGroupEditorialImprovement(report: GroupReport): GroupEditorialImprovement {
  const n = report.valid_sessions_count;
  const { page_analytics, resources_detail, advanced_analytics, feedback_analytics, technical_analytics } =
    report;

  const dwellByPage = new Map(advanced_analytics.page_dwell.map((row) => [row.page, row]));

  const pages_for_review: EditorialPageReviewItem[] = page_analytics.heatmap
    .map((item) => {
      const dwell = dwellByPage.get(item.page);
      const issues: string[] = [];

      if (item.viewedPct >= 25 && item.completedPct < item.viewedPct - 20) {
        issues.push('Alta visualização com baixa conclusão no grupo');
      }
      if (
        dwell?.avg_seconds != null &&
        dwell.sample_count >= 2 &&
        dwell.avg_seconds <= LOW_DWELL_SECONDS &&
        item.viewedPct >= 20
      ) {
        issues.push(`Tempo médio baixo (${Math.round(dwell.avg_seconds)}s) entre quem concluiu`);
      }
      if (item.viewedPct >= 30 && item.completedPct === 0) {
        issues.push('Visualizada por vários, ninguém atingiu tempo mínimo');
      }

      if (issues.length === 0) return null;

      return {
        page: item.page,
        viewedPct: item.viewedPct,
        completedPct: item.completedPct,
        avg_dwell_seconds: dwell?.avg_seconds ?? null,
        issue: issues.join(' · '),
      };
    })
    .filter((item): item is EditorialPageReviewItem => item !== null)
    .sort((a, b) => a.completedPct - b.completedPct || b.viewedPct - a.viewedPct);

  const interactive_images: EditorialImageHighlight[] = advanced_analytics.image_interaction
    .filter((item) => item.viewed_sessions > 0 && item.interaction_pct > 0)
    .sort((a, b) => b.interaction_pct - a.interaction_pct || b.zoom_total - a.zoom_total)
    .slice(0, 8)
    .map((item) => ({
      image_id: item.image_id,
      label: shortImageLabel(item.image_id),
      interaction_pct: item.interaction_pct,
      zoom_total: item.zoom_total,
      viewed_sessions: item.viewed_sessions,
    }));

  const underused_resources: EditorialResourceGap[] = resources_detail.coverage_resources
    .filter((item) => item.open_pct < 60)
    .map((item) => ({
      label: item.label,
      open_pct: item.open_pct,
      sessions_missed: item.sessions_total - item.sessions_opened,
    }))
    .sort((a, b) => a.open_pct - b.open_pct);

  const deviceIssueCounts: Record<string, number> = {};
  for (const row of report.technical_detail.sessions) {
    if (!row.has_technical_issues) continue;
    deviceIssueCounts[row.device_label] = (deviceIssueCounts[row.device_label] ?? 0) + 1;
  }

  const device_experience: EditorialDeviceExperience[] =
    advanced_analytics.load_time_by_device.length > 0
      ? advanced_analytics.load_time_by_device.map((item) => ({
          device_label: item.device_label,
          session_count: item.session_count,
          avg_load_ms: item.avg_load_ms,
          technical_issue_sessions: deviceIssueCounts[item.device_label] ?? 0,
        }))
      : Object.entries(technical_analytics.device_type_distribution).map(([deviceType, count]) => {
          const label = DEVICE_TYPE_LABELS[deviceType as DeviceType] ?? deviceType;
          return {
            device_label: label,
            session_count: count,
            avg_load_ms: null,
            technical_issue_sessions: deviceIssueCounts[label] ?? 0,
          };
        });

  const backlog: EditorialBacklogItem[] = [];
  let backlogId = 0;
  const push = (
    area: EditorialBacklogArea,
    priority: 'high' | 'medium',
    title: string,
    detail: string,
  ) => {
    backlog.push({ id: `eb-${++backlogId}`, area, priority, title, detail });
  };

  const topPage = pages_for_review[0];
  if (topPage) {
    push(
      'conteudo',
      'high',
      `Revisar pág. ${topPage.page}`,
      topPage.issue,
    );
  }

  const quickReadingCount = QUICK_READING_LABELS.reduce(
    (sum, label) => sum + (report.summary.reading_depth_distribution[label] ?? 0),
    0,
  );
  if (quickReadingCount > 0 && n > 0 && quickReadingCount / n >= 0.3) {
    push(
      'conteudo',
      'medium',
      'Validar densidade e escaneabilidade do capítulo',
      `${quickReadingCount} de ${n} ${pluralSessao(n)} com ritmo rápido ou varredura — revisar layout, títulos e blocos de texto.`,
    );
  }

  if (underused_resources.length > 0) {
    const top = underused_resources[0];
    push(
      'recurso',
      top.open_pct < 30 ? 'high' : 'medium',
      `Reforçar ${top.label}`,
      `Apenas ${top.open_pct}% do grupo abriu (${top.sessions_missed} de ${n} ignoraram).`,
    );
  }

  if (report.resource_analytics.sessions_with_video_play_pct < 50 && n > 0) {
    push(
      'recurso',
      'medium',
      'Revisar posicionamento do vídeo Escola Digital',
      `${report.resource_analytics.sessions_with_video_play_pct}% iniciaram o vídeo; ${report.resource_analytics.sessions_with_video_completed_pct}% concluíram.`,
    );
  }

  if (resources_detail.video_skip_suspected_count > 0) {
    push(
      'recurso',
      'medium',
      'Checar duração e gancho do vídeo',
      `${resources_detail.video_skip_suspected_count} ${pluralSessao(resources_detail.video_skip_suspected_count)} com sinal de possível pulo no timeline.`,
    );
  }

  if (
    feedback_analytics.avg_visual_comfort !== null &&
    feedback_analytics.avg_visual_comfort < LOW_SCORE_THRESHOLD
  ) {
    push(
      'ux',
      'high',
      'Melhorar conforto visual',
      `Média ${feedback_analytics.avg_visual_comfort.toFixed(1)}/5 em conforto visual (${feedback_analytics.feedback_count} resposta(s)).`,
    );
  }

  if (
    feedback_analytics.avg_navigation_clarity !== null &&
    feedback_analytics.avg_navigation_clarity < LOW_SCORE_THRESHOLD
  ) {
    push(
      'ux',
      'medium',
      'Clarear navegação do capítulo',
      `Média ${feedback_analytics.avg_navigation_clarity.toFixed(1)}/5 em clareza da navegação.`,
    );
  }

  if (
    feedback_analytics.avg_resource_usefulness !== null &&
    feedback_analytics.avg_resource_usefulness < LOW_SCORE_THRESHOLD
  ) {
    push(
      'ux',
      'medium',
      'Repensar utilidade percebida dos recursos',
      `Média ${feedback_analytics.avg_resource_usefulness.toFixed(1)}/5 em utilidade dos recursos digitais.`,
    );
  }

  const slowDevice = device_experience.find(
    (item) => item.avg_load_ms != null && item.avg_load_ms >= 3000,
  );
  if (slowDevice) {
    push(
      'tecnico',
      'medium',
      `Otimizar carga em ${slowDevice.device_label.toLowerCase()}`,
      `Tempo médio de carregamento ${formatDuration(Math.round(slowDevice.avg_load_ms! / 1000))} (${slowDevice.session_count} ${pluralSessao(slowDevice.session_count)}).`,
    );
  }

  if (technical_analytics.sessions_with_technical_issues > 0) {
    push(
      'tecnico',
      'high',
      'Corrigir alertas técnicos antes de escalar',
      `${technical_analytics.sessions_with_technical_issues} ${pluralSessao(technical_analytics.sessions_with_technical_issues)} com erros ou carga problemática.`,
    );
  }

  if (interactive_images.length > 0) {
    const top = interactive_images[0];
    if (top.interaction_pct >= 40) {
      push(
        'conteudo',
        'medium',
        `Referência positiva: ${top.label}`,
        `${top.interaction_pct}% deram zoom (${top.zoom_total} zooms) — replicar padrão visual/interativo.`,
      );
    }
  }

  if (backlog.length === 0) {
    push(
      'conteudo',
      'medium',
      'Manter monitoramento do capítulo',
      'Nenhum sinal crítico neste lote — expandir amostra ou comparar com outros capítulos.',
    );
  }

  return {
    backlog: backlog.slice(0, 10),
    pages_for_review,
    interactive_images,
    underused_resources,
    device_experience,
    feedback_summary: {
      avg_rating: feedback_analytics.avg_rating,
      avg_navigation_clarity: feedback_analytics.avg_navigation_clarity,
      avg_visual_comfort: feedback_analytics.avg_visual_comfort,
      avg_resource_usefulness: feedback_analytics.avg_resource_usefulness,
      feedback_count: feedback_analytics.feedback_count,
    },
  };
}
