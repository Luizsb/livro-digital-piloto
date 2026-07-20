import type { GroupReport } from './types';
import { pluralSessao } from '@shared/lib/pluralizePt';

export interface PedagogicalPagePriority {
  page: number;
  viewedPct: number;
  completedPct: number;
  gapCount: number;
  gapPct: number;
  abandonmentCount: number;
  priority: 'high' | 'medium';
  reason: string;
}

export interface PedagogicalParticipantFlag {
  participant_id: string;
  file_name: string;
  abandonment_page: number | null;
  open_completion_gap: number;
  reading_depth_label: string | null;
  resources_missed_count: number;
  video_skip_suspected: boolean;
  flags: string[];
}

export interface GroupPedagogicalResumption {
  discussion_points: string[];
  page_priorities: PedagogicalPagePriority[];
  ignored_resources: Array<{ label: string; sessions_missed: number; miss_pct: number }>;
  quick_reading_participants: Array<{ participant_id: string; label: string }>;
  participant_flags: PedagogicalParticipantFlag[];
}

const QUICK_DEPTHS = new Set(['Leitura rápida', 'Varredura rápida']);

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function buildGroupPedagogicalResumption(report: GroupReport): GroupPedagogicalResumption {
  const n = report.valid_sessions_count;
  const { page_analytics, resources_detail, sessions } = report;

  const page_priorities: PedagogicalPagePriority[] = page_analytics.heatmap
    .map((item) => {
      const score = item.gapCount * 2 + item.abandonmentCount * 3;
      const viewedWithoutCompletion =
        item.viewedCount > 0 && item.completedCount < item.viewedCount;
      const highGap = n > 0 && item.gapCount / n >= 0.25;
      const highAbandon = item.abandonmentCount >= 2;
      const viewedLowCompletion =
        item.viewedPct >= 30 && item.completedPct < item.viewedPct - 15;

      if (!viewedWithoutCompletion && item.abandonmentCount === 0) {
        return null;
      }
      if (!highGap && !highAbandon && !viewedLowCompletion && score < 2) {
        return null;
      }

      const priority: 'high' | 'medium' =
        highAbandon || highGap || score >= 4 ? 'high' : 'medium';

      const reasons: string[] = [];
      if (item.gapCount > 0) {
        reasons.push(
          `${item.gapCount} ${pluralSessao(item.gapCount)} viram sem concluir (${item.gapPct}%)`,
        );
      }
      if (item.abandonmentCount > 0) {
        reasons.push(
          `${item.abandonmentCount} ${pluralSessao(item.abandonmentCount)} pararam aqui`,
        );
      }
      if (viewedLowCompletion && item.gapCount === 0) {
        reasons.push('Alta visualização com baixa conclusão no grupo');
      }

      return {
        page: item.page,
        viewedPct: item.viewedPct,
        completedPct: item.completedPct,
        gapCount: item.gapCount,
        gapPct: item.gapPct,
        abandonmentCount: item.abandonmentCount,
        priority,
        reason: reasons.join(' · ') || 'Sinal de atenção na jornada',
      };
    })
    .filter((item): item is PedagogicalPagePriority => item !== null)
    .sort((a, b) => {
      const scoreA = a.gapCount * 2 + a.abandonmentCount * 3;
      const scoreB = b.gapCount * 2 + b.abandonmentCount * 3;
      return scoreB - scoreA;
    });

  const participantById = new Map(
    resources_detail.participants.map((row) => [row.participant_id, row]),
  );

  const participant_flags: PedagogicalParticipantFlag[] = sessions.map((row) => {
    const resources = participantById.get(row.participantId);
    const open_completion_gap = Math.max(0, row.pagesViewedCount - row.pagesCompletedCount);
    const flags: string[] = [];

    if (row.abandonedBeforeEnd && row.abandonmentPage != null) {
      flags.push(`Parou na pág. ${row.abandonmentPage}`);
    }
    if (open_completion_gap > 0) {
      flags.push(`${open_completion_gap} pág. vista(s) sem conclusão`);
    }
    if (row.readingDepthLabel && QUICK_DEPTHS.has(row.readingDepthLabel)) {
      flags.push(`Ritmo: ${row.readingDepthLabel.toLowerCase()}`);
    }
    if (resources && resources.resources_missed.length > 0) {
      flags.push(`${resources.resources_missed.length} recurso(s) não aberto(s)`);
    }
    if (resources?.video_skip_suspected) {
      flags.push('Possível pulo no vídeo');
    }
    if (!row.videoPlayed && n > 0) {
      const videoAdoption =
        report.resource_analytics.sessions_with_video_play_pct ?? 0;
      if (videoAdoption >= 50) {
        flags.push('Não iniciou o vídeo');
      }
    }
    if (!row.odaOpened && report.resource_analytics.sessions_with_oda_pct >= 50) {
      flags.push('Não abriu ODA');
    }

    return {
      participant_id: row.participantId,
      file_name: row.fileName,
      abandonment_page: row.abandonmentPage,
      open_completion_gap,
      reading_depth_label: row.readingDepthLabel,
      resources_missed_count: resources?.resources_missed.length ?? 0,
      video_skip_suspected: resources?.video_skip_suspected ?? false,
      flags,
    };
  });

  const flaggedParticipants = participant_flags
    .filter((row) => row.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);

  const quick_reading_participants = sessions
    .filter((row) => row.readingDepthLabel && QUICK_DEPTHS.has(row.readingDepthLabel))
    .map((row) => ({
      participant_id: row.participantId,
      label: row.readingDepthLabel!,
    }));

  const ignored_resources = resources_detail.coverage_resources
    .filter((item) => item.open_pct < 50 && item.sessions_total > 0)
    .map((item) => ({
      label: item.label,
      sessions_missed: item.sessions_total - item.sessions_opened,
      miss_pct: 100 - item.open_pct,
    }))
    .sort((a, b) => b.miss_pct - a.miss_pct);

  const discussion_points: string[] = [];

  const topAbandon = page_priorities.find((p) => p.abandonmentCount > 0);
  if (topAbandon) {
    discussion_points.push(
      `Pág. ${topAbandon.page}: ${topAbandon.abandonmentCount} de ${n} ${pluralSessao(n)} encerraram a sessão neste ponto — candidata a retomada em aula.`,
    );
  }

  const topGap = page_priorities.find((p) => p.gapCount > 0);
  if (topGap && topGap.page !== topAbandon?.page) {
    discussion_points.push(
      `Pág. ${topGap.page}: ${topGap.gapCount} ${pluralSessao(topGap.gapCount)} visualizaram sem atingir tempo mínimo — revisitar conteúdo ou checar clareza.`,
    );
  }

  if (quick_reading_participants.length > 0) {
    discussion_points.push(
      `${quick_reading_participants.length} participante(s) com ritmo rápido ou varredura — validar se houve leitura ou apenas navegação.`,
    );
  }

  if (ignored_resources.length > 0) {
    const top = ignored_resources[0];
    discussion_points.push(
      `${top.label}: ${top.miss_pct}% do grupo não abriu — considerar destaque ou contextualização em aula.`,
    );
  }

  if (resources_detail.video_skip_suspected_count > 0) {
    discussion_points.push(
      `${resources_detail.video_skip_suspected_count} ${pluralSessao(resources_detail.video_skip_suspected_count)} com sinal de possível pulo no vídeo — retomar trecho ou checar duração/percepção.`,
    );
  }

  if (flaggedParticipants.length === 0 && page_priorities.length === 0) {
    discussion_points.push(
      'Nenhum sinal forte de retomada neste lote — use o Consolidado para confirmar cobertura e feedback.',
    );
  }

  return {
    discussion_points,
    page_priorities,
    ignored_resources,
    quick_reading_participants,
    participant_flags: flaggedParticipants,
  };
}
