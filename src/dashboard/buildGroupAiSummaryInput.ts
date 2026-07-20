import type { GroupReport } from './types';
import { formatDuration } from './reportExtractors';

/** Payload compacto para o resumo com IA — só agregados, comentários e alertas já calculados. */
export interface GroupAiSummaryInput {
  meta: {
    book_id: string;
    chapter_id: string;
    valid_sessions: number;
    participants: number;
    generated_at_br: string;
  };
  aggregated: {
    avg_pages_viewed: number;
    avg_completion_rate: number;
    full_completion_pct: number;
    viewed_all_incomplete_pct: number;
    partial_view_pct: number;
    avg_visible_time: string | null;
    reading_depth_distribution: Record<string, number>;
  };
  engagement: {
    full_completion_count: number;
    viewed_all_incomplete_count: number;
    partial_view_count: number;
    sessions_with_video_pct: number;
    sessions_with_video_completed_pct: number;
    sessions_with_oda_pct: number;
    sessions_with_teacher_pct: number;
    sessions_with_image_zoom_pct: number;
  };
  resources: {
    sessions_with_video_play_pct: number;
    avg_video_max_progress_pct: number | null;
    avg_escola_modal_seconds: number | null;
    video_skip_suspected_count: number;
  };
  feedback: {
    feedback_rate_pct: number;
    avg_rating: number | null;
    would_use_again_distribution: Record<string, number>;
    written_comments: Array<{ participant_id: string; comment: string }>;
  };
  technical: {
    technical_issues_pct: number;
    sessions_with_technical_issues: number;
    avg_data_quality_score: number | null;
    reliable_session_count: number;
  };
  rule_based_insights: string[];
  warnings: string[];
  quality_alerts: Array<{ participant_id: string; score: number; warnings: string[] }>;
  sessions: Array<{
    participant_id: string;
    completion_rate: number;
    chapter_status: string;
    reading_depth: string | null;
    visible_time: string | null;
    feedback_rating: number | null;
    oda_opened: boolean;
    video_played: boolean;
    video_playback_wall_seconds: number;
    video_seek_count: number;
    video_skip_suspected: boolean;
    resources_missed: string[];
    chapter_completed: boolean;
  }>;
}

export function buildGroupAiSummaryInput(report: GroupReport): GroupAiSummaryInput {
  const { summary, engagement_analytics, resource_analytics, feedback_analytics, data_quality } =
    report;

  const participantById = new Map(
    report.resources_detail.participants.map((row) => [row.participant_id, row]),
  );

  return {
    meta: {
      book_id: report.book_id,
      chapter_id: report.chapter_id,
      valid_sessions: report.valid_sessions_count,
      participants: report.participants_count,
      generated_at_br: report.generated_at_br,
    },
    aggregated: {
      avg_pages_viewed: summary.avg_pages_viewed,
      avg_completion_rate: summary.avg_completion_rate,
      full_completion_pct: summary.full_completion_pct,
      viewed_all_incomplete_pct: summary.viewed_all_incomplete_pct,
      partial_view_pct: summary.partial_view_pct,
      avg_visible_time:
        summary.avg_visible_time_seconds !== null
          ? formatDuration(Math.round(summary.avg_visible_time_seconds))
          : null,
      reading_depth_distribution: summary.reading_depth_distribution,
    },
    engagement: {
      full_completion_count: engagement_analytics.full_completion_count,
      viewed_all_incomplete_count: engagement_analytics.viewed_all_incomplete_count,
      partial_view_count: engagement_analytics.partial_view_count,
      sessions_with_video_pct: engagement_analytics.sessions_with_video_pct,
      sessions_with_video_completed_pct: engagement_analytics.sessions_with_video_completed_pct,
      sessions_with_oda_pct: engagement_analytics.sessions_with_oda_pct,
      sessions_with_teacher_pct: engagement_analytics.sessions_with_teacher_pct,
      sessions_with_image_zoom_pct: engagement_analytics.sessions_with_image_zoom_pct,
    },
    resources: {
      sessions_with_video_play_pct: resource_analytics.sessions_with_video_play_pct,
      avg_video_max_progress_pct: resource_analytics.avg_video_max_progress_pct,
      avg_escola_modal_seconds: resource_analytics.avg_escola_digital_engagement_seconds,
      video_skip_suspected_count: report.resources_detail.video_skip_suspected_count,
    },
    feedback: {
      feedback_rate_pct: feedback_analytics.feedback_rate_pct,
      avg_rating: feedback_analytics.avg_rating,
      would_use_again_distribution: feedback_analytics.would_use_again_distribution,
      written_comments: feedback_analytics.written_comments.map((item) => ({
        participant_id: item.participant_id,
        comment: item.comment,
      })),
    },
    technical: {
      technical_issues_pct: report.technical_analytics.technical_issues_pct,
      sessions_with_technical_issues: report.technical_analytics.sessions_with_technical_issues,
      avg_data_quality_score: data_quality.avg_data_quality_score,
      reliable_session_count: data_quality.reliable_session_count,
    },
    rule_based_insights: report.insights,
    warnings: report.warnings,
    quality_alerts: data_quality.session_quality_issues.map((issue) => ({
      participant_id: issue.participant_id,
      score: issue.score,
      warnings: issue.warnings,
    })),
    sessions: report.sessions.map((row) => {
      const resources = participantById.get(row.participantId);
      return {
        participant_id: row.participantId,
        completion_rate: row.completionRate,
        chapter_status: row.chapterStatus,
        reading_depth: row.readingDepthLabel,
        visible_time:
          row.visibleTimeSeconds !== null ? formatDuration(row.visibleTimeSeconds) : null,
        feedback_rating: row.feedbackRating,
        oda_opened: row.odaOpened,
        video_played: row.videoPlayed,
        video_playback_wall_seconds: resources?.video_playback_wall_seconds ?? 0,
        video_seek_count: resources?.video_seek_count ?? 0,
        video_skip_suspected: resources?.video_skip_suspected ?? false,
        resources_missed: resources?.resources_missed ?? [],
        chapter_completed: row.chapterCompleted,
      };
    }),
  };
}

export function buildGroupAiSummaryPrompt(input: GroupAiSummaryInput): string {
  return `Analise o piloto do livro digital abaixo e produza um resumo executivo em português (PT-BR).

Regras:
- Use APENAS os dados fornecidos; não invente números.
- Diferencie fatos de hipóteses (marque hipóteses no texto com "HIPÓTESE:").
- Cite participantes por ID quando relevante (ex.: P11).
- Mencione comentários escritos quando existirem.
- Destaque contradições (nota alta vs recursos não usados; vídeo com pulo ou timeline inflado).
- Para vídeo: distinga tempo real de reprodução (playback_wall_seconds) de posição máxima no arquivo (video_watch_seconds).
- Tom objetivo para equipe de produto e pedagogia. Sem emojis. Sem markdown.

Limites:
- patterns: 2 a 4 itens
- attention_points: 2 a 4 itens (severity = warning quando houver risco ou contradição)
- recommendations: 2 a 4 itens

Dados (JSON):
${JSON.stringify(input)}`;
}
