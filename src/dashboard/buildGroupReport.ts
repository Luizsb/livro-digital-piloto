import type {
  ParsedDashboardReport,
  GroupReport,
  GroupSessionRow,
  PageHeatmapItem,
} from './types';
import {
  extractSessionVisibleSeconds,
  getChapterPageNumbers,
  getChapterStatusLabel,
  getParticipantLabel,
} from './reportExtractors';
import { formatBrowserLabel } from '../ld/deviceContext';
import { formatDateTimeBr } from '../lib/formatDateTimeBr';

const RELIABLE_QUALITY_THRESHOLD = 85;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function getSessionId(session: ParsedDashboardReport): string {
  const ids = session.summary.session_ids;
  if (ids.length > 0) return ids[0];
  if (session.events.length > 0) return session.events[0].session_id;
  return session.sourceFileName ?? 'unknown';
}

function deduplicateSessions(reports: ParsedDashboardReport[]): {
  valid: ParsedDashboardReport[];
  duplicateSessionIds: string[];
  duplicateWarnings: string[];
} {
  const seen = new Map<string, ParsedDashboardReport>();
  const duplicateSessionIds: string[] = [];
  const duplicateWarnings: string[] = [];

  for (const report of reports) {
    const sessionId = getSessionId(report);
    const existing = seen.get(sessionId);
    if (existing) {
      duplicateSessionIds.push(sessionId);
      duplicateWarnings.push(
        `Sessão duplicada ignorada (session_id: ${sessionId}). Mantido "${existing.sourceFileName ?? 'arquivo anterior'}"; ignorado "${report.sourceFileName ?? 'arquivo'}".`,
      );
      continue;
    }
    seen.set(sessionId, report);
  }

  return {
    valid: [...seen.values()],
    duplicateSessionIds,
    duplicateWarnings,
  };
}

function buildPageHeatmap(sessions: ParsedDashboardReport[]): PageHeatmapItem[] {
  if (sessions.length === 0) return [];

  const pages = getChapterPageNumbers(sessions[0].summary);
  const total = sessions.length;

  return pages.map((page) => {
    let viewedCount = 0;
    let completedCount = 0;
    let abandonmentCount = 0;

    for (const session of sessions) {
      const { summary } = session;
      if (summary.pages_viewed.includes(page)) viewedCount += 1;
      if (summary.pages_completed.includes(page)) completedCount += 1;
      if (summary.abandonment_page === page) abandonmentCount += 1;
    }

    return {
      page,
      viewedCount,
      viewedPct: pct(viewedCount, total),
      completedCount,
      completedPct: pct(completedCount, total),
      abandonmentCount,
    };
  });
}

function buildSessionRow(session: ParsedDashboardReport): GroupSessionRow {
  const { summary, events, sourceFileName } = session;
  const totalPages = summary.chapter_total_pages ?? 10;

  return {
    fileName: sourceFileName ?? '—',
    sessionId: getSessionId(session),
    participantId: getParticipantLabel(summary),
    pagesViewedCount: summary.pages_viewed_count,
    pagesCompletedCount: summary.pages_completed_count,
    totalPages,
    completionRate: summary.completion_rate,
    chapterStatus: getChapterStatusLabel(summary),
    visibleTimeSeconds: extractSessionVisibleSeconds(events, summary),
    idleTimeSeconds: summary.idle_time_seconds ?? null,
    abandonedBeforeEnd: summary.abandoned_before_end === true,
    abandonmentPage: summary.abandonment_page ?? null,
    readingDepthLabel: summary.reading_depth_label ?? null,
    dataQualityScore:
      typeof summary.data_quality_score === 'number' ? summary.data_quality_score : null,
    feedbackSubmitted: summary.feedback.submitted,
    feedbackRating: summary.feedback.submitted ? summary.feedback.rating : null,
    chapterFinished: summary.chapter_finished_count > 0,
    chapterCompleted: summary.chapter_completed_count > 0,
    hasTechnicalIssues: summary.has_technical_issues === true,
  };
}

function buildGroupInsights(report: Omit<GroupReport, 'insights'>): string[] {
  const n = report.valid_sessions_count;
  if (n === 0) {
    return ['Carregue ao menos um JSON exportado pelo piloto para gerar o relatório consolidado.'];
  }

  const insights: string[] = [];
  const { summary, page_analytics, resource_analytics, feedback_analytics, data_quality } = report;
  const totalPages = page_analytics.total_pages;

  insights.push(
    `O relatório consolidado reúne ${n} sessão${n === 1 ? '' : 'ões'} válida${n === 1 ? '' : 's'} do capítulo ${report.chapter_id} (${report.book_id}), com ${report.participants_count} participante${report.participants_count === 1 ? '' : 's'} distinto${report.participants_count === 1 ? '' : 's'}.`,
  );

  insights.push(
    `Em média, cada sessão visualizou ${summary.avg_pages_viewed} de ${totalPages} páginas, com taxa média de conclusão de páginas de ${summary.avg_completion_rate}%.`,
  );

  insights.push(
    `${summary.chapter_finished_pct}% finalizaram o capítulo e ${summary.chapter_completed_pct}% atingiram o critério de conclusão pedagógica.`,
  );

  if (summary.abandonment_pct > 0) {
    insights.push(
      `${summary.abandonment_pct}% não percorreram todas as páginas antes de encerrar.`,
    );
    const topAbandon = [...page_analytics.heatmap]
      .filter((p) => p.abandonmentCount > 0)
      .sort((a, b) => b.abandonmentCount - a.abandonmentCount)[0];
    if (topAbandon) {
      insights.push(
        `A página mais frequente como último ponto de parada foi a pág. ${topAbandon.page} (${topAbandon.abandonmentCount} sessão${topAbandon.abandonmentCount === 1 ? '' : 'ões'}).`,
      );
    }
  }

  if (summary.avg_visible_time_seconds !== null) {
    const min = Math.floor(summary.avg_visible_time_seconds / 60);
    const sec = Math.round(summary.avg_visible_time_seconds % 60);
    const timeLabel = min > 0 ? `${min} min${sec > 0 ? ` ${sec} s` : ''}` : `${sec}s`;
    insights.push(`O tempo médio visível no livro foi de cerca de ${timeLabel}.`);
  }

  if (resource_analytics.sessions_with_oda_pct > 0) {
    insights.push(
      `${resource_analytics.sessions_with_oda_pct}% das sessões abriram ao menos uma ODA (média de ${resource_analytics.avg_oda_opened} aberturas por sessão).`,
    );
  }

  if (resource_analytics.sessions_with_video_play_pct > 0) {
    insights.push(
      `${resource_analytics.sessions_with_video_play_pct}% iniciaram vídeo da Escola Digital; ${resource_analytics.sessions_with_video_completed_pct}% concluíram a reprodução.`,
    );
  }

  if (feedback_analytics.feedback_count > 0 && feedback_analytics.avg_rating !== null) {
    insights.push(
      `${feedback_analytics.feedback_count} participante${feedback_analytics.feedback_count === 1 ? '' : 's'} enviou feedback, com nota média geral de ${feedback_analytics.avg_rating.toFixed(1)}/5.`,
    );
  }

  if (report.technical_analytics.sessions_with_technical_issues > 0) {
    insights.push(
      `${report.technical_analytics.sessions_with_technical_issues} sessão${report.technical_analytics.sessions_with_technical_issues === 1 ? '' : 'ões'} apresentou alertas técnicos (${report.technical_analytics.total_runtime_errors + report.technical_analytics.total_asset_load_errors + report.technical_analytics.total_render_errors} erros registrados no total).`,
    );
  }

  if (data_quality.reliable_session_count < n) {
    insights.push(
      `${data_quality.reliable_session_count} de ${n} sessões têm qualidade da coleta ≥ ${data_quality.reliable_quality_threshold} — considere filtrar sessões com score baixo antes de conclusões definitivas.`,
    );
  }

  if (data_quality.duplicate_session_ids.length > 0) {
    insights.push(
      `${data_quality.duplicate_session_ids.length} sessão${data_quality.duplicate_session_ids.length === 1 ? '' : 'ões'} duplicada${data_quality.duplicate_session_ids.length === 1 ? '' : 's'} por session_id foram ignoradas para não distorcer as métricas.`,
    );
  }

  const depthEntries = Object.entries(summary.reading_depth_distribution).sort(
    (a, b) => b[1] - a[1],
  );
  if (depthEntries.length > 0) {
    const [topLabel, topCount] = depthEntries[0];
    insights.push(
      `A profundidade de leitura mais frequente foi "${topLabel}" (${topCount} de ${n} sessões).`,
    );
  }

  insights.push(
    'Estes indicadores descrevem padrões de uso e engajamento — não medem aprendizagem ou compreensão.',
  );

  return insights;
}

function emptyGroupReport(
  loadErrors: { fileName: string; message: string }[] = [],
): GroupReport {
  const generatedAt = new Date().toISOString();
  return {
    report_type: 'group_summary',
    generated_at: generatedAt,
    generated_at_br: formatDateTimeBr(generatedAt),
    book_id: '—',
    chapter_id: '—',
    source_reports_count: 0,
    valid_sessions_count: 0,
    invalid_sessions_count: loadErrors.length,
    participants_count: 0,
    warnings: loadErrors.length > 0 ? [] : ['Nenhuma sessão válida para consolidar.'],
    load_errors: loadErrors.map((e) => ({ file_name: e.fileName, message: e.message })),
    summary: {
      avg_pages_viewed: 0,
      avg_completion_rate: 0,
      chapter_finished_pct: 0,
      chapter_completed_pct: 0,
      abandonment_pct: 0,
      avg_visible_time_seconds: null,
      avg_idle_time_seconds: null,
      reading_depth_distribution: {},
      participant_ids: [],
    },
    page_analytics: { heatmap: [], total_pages: 0 },
    resource_analytics: {
      avg_resources_opened: 0,
      sessions_with_oda_pct: 0,
      avg_oda_opened: 0,
      avg_image_zoom_total: 0,
      avg_image_zoom_unique: 0,
      sessions_with_video_play_pct: 0,
      sessions_with_video_completed_pct: 0,
      avg_video_watch_seconds: null,
      teacher_button_usage_pct: 0,
    },
    feedback_analytics: {
      feedback_count: 0,
      feedback_rate_pct: 0,
      avg_rating: null,
      avg_navigation_clarity: null,
      avg_visual_comfort: null,
      avg_resource_usefulness: null,
      would_use_again_distribution: {},
    },
    technical_analytics: {
      device_distribution: {},
      browser_distribution: {},
      technical_issues_pct: 0,
      total_runtime_errors: 0,
      total_asset_load_errors: 0,
      total_render_errors: 0,
      sessions_with_technical_issues: 0,
    },
    data_quality: {
      avg_data_quality_score: null,
      reliable_session_count: 0,
      reliable_quality_threshold: RELIABLE_QUALITY_THRESHOLD,
      duplicate_session_ids: [],
      mixed_book_or_chapter: false,
      load_error_count: loadErrors.length,
      per_session_warnings_count: 0,
    },
    sessions: [],
    insights: ['Carregue ao menos um JSON exportado pelo piloto para gerar o relatório consolidado.'],
  };
}

export function aggregateSessionReports(
  reports: ParsedDashboardReport[],
  loadErrors: { fileName: string; message: string }[] = [],
): GroupReport {
  const sourceReportsCount = reports.length;
  const { valid: sessions, duplicateSessionIds, duplicateWarnings } = deduplicateSessions(reports);
  const n = sessions.length;

  if (n === 0) {
    return emptyGroupReport(loadErrors);
  }

  const warnings: string[] = [...duplicateWarnings];
  const bookIds = new Set(sessions.map((s) => s.summary.book_id));
  const chapterIds = new Set(sessions.map((s) => s.summary.chapter_id));
  const mixedBookOrChapter = bookIds.size > 1 || chapterIds.size > 1;

  if (mixedBookOrChapter) {
    warnings.push(
      'Os arquivos carregados referem-se a livros ou capítulos diferentes — os KPIs agregados podem não ser comparáveis.',
    );
  }

  const participantIds = [
    ...new Set(sessions.map((s) => getParticipantLabel(s.summary))),
  ].sort();

  const duplicateParticipants = participantIds.filter((pid) => {
    const count = sessions.filter((s) => getParticipantLabel(s.summary) === pid).length;
    return count > 1;
  });
  if (duplicateParticipants.length > 0) {
    warnings.push(
      `Participantes com mais de uma sessão no lote: ${duplicateParticipants.join(', ')}.`,
    );
  }

  let perSessionWarningsCount = 0;
  for (const session of sessions) {
    for (const w of session.warnings) {
      perSessionWarningsCount += 1;
      warnings.push(`${session.sourceFileName ?? 'arquivo'}: ${w}`);
    }
  }

  const rows = sessions.map(buildSessionRow);

  const visibleTimes = rows
    .map((r) => r.visibleTimeSeconds)
    .filter((v): v is number => v !== null);
  const idleTimes = rows
    .map((r) => r.idleTimeSeconds)
    .filter((v): v is number => v !== null && v > 0);
  const qualityScores = rows
    .map((r) => r.dataQualityScore)
    .filter((v): v is number => v !== null);

  const readingDepthDistribution: Record<string, number> = {};
  const deviceDistribution: Record<string, number> = {};
  const browserDistribution: Record<string, number> = {};
  const wouldUseAgainDistribution: Record<string, number> = {};

  let feedbackCount = 0;
  const ratings: number[] = [];
  const navigationScores: number[] = [];
  const visualScores: number[] = [];
  const resourceScores: number[] = [];

  let totalRuntimeErrors = 0;
  let totalAssetLoadErrors = 0;
  let totalRenderErrors = 0;

  for (const session of sessions) {
    const { summary } = session;
    if (summary.reading_depth_label) {
      increment(readingDepthDistribution, summary.reading_depth_label);
    }
    if (summary.device_type_label) {
      increment(deviceDistribution, summary.device_type_label);
    }
    if (summary.browser_name) {
      increment(
        browserDistribution,
        formatBrowserLabel(summary.browser_name, summary.browser_version),
      );
    }
    if (summary.feedback.submitted) {
      feedbackCount += 1;
      ratings.push(summary.feedback.rating);
      navigationScores.push(summary.feedback.navigation_clarity);
      visualScores.push(summary.feedback.visual_comfort);
      resourceScores.push(summary.feedback.resource_usefulness);
      if (summary.feedback.would_use_again) {
        increment(wouldUseAgainDistribution, summary.feedback.would_use_again);
      }
    }

    totalRuntimeErrors += summary.runtime_errors_count ?? 0;
    totalAssetLoadErrors += summary.asset_load_errors_count ?? 0;
    totalRenderErrors += summary.render_errors_count ?? 0;
  }

  const pageHeatmap = buildPageHeatmap(sessions);
  const totalPages = sessions[0].summary.chapter_total_pages ?? pageHeatmap.length;

  const videoWatchSeconds = sessions
    .map((s) => s.summary.escola_digital_video_watch_total_seconds)
    .filter((v) => v > 0);

  const sessionsWithTechnicalIssues = rows.filter((r) => r.hasTechnicalIssues).length;
  const generatedAt = new Date().toISOString();

  const partial: Omit<GroupReport, 'insights'> = {
    report_type: 'group_summary',
    generated_at: generatedAt,
    generated_at_br: formatDateTimeBr(generatedAt),
    book_id: sessions[0].summary.book_id,
    chapter_id: sessions[0].summary.chapter_id,
    source_reports_count: sourceReportsCount,
    valid_sessions_count: n,
    invalid_sessions_count: duplicateSessionIds.length + loadErrors.length,
    participants_count: participantIds.length,
    warnings,
    load_errors: loadErrors.map((e) => ({ file_name: e.fileName, message: e.message })),
    summary: {
      avg_pages_viewed: average(rows.map((r) => r.pagesViewedCount)) ?? 0,
      avg_completion_rate: average(rows.map((r) => r.completionRate)) ?? 0,
      chapter_finished_pct: pct(rows.filter((r) => r.chapterFinished).length, n),
      chapter_completed_pct: pct(rows.filter((r) => r.chapterCompleted).length, n),
      abandonment_pct: pct(rows.filter((r) => r.abandonedBeforeEnd).length, n),
      avg_visible_time_seconds: average(visibleTimes),
      avg_idle_time_seconds: idleTimes.length > 0 ? average(idleTimes) : null,
      reading_depth_distribution: readingDepthDistribution,
      participant_ids: participantIds,
    },
    page_analytics: {
      heatmap: pageHeatmap,
      total_pages: totalPages,
    },
    resource_analytics: {
      avg_resources_opened:
        average(sessions.map((s) => s.summary.resources_opened_total)) ?? 0,
      sessions_with_oda_pct: pct(
        sessions.filter((s) => s.summary.oda_opened_count > 0).length,
        n,
      ),
      avg_oda_opened: average(sessions.map((s) => s.summary.oda_opened_count)) ?? 0,
      avg_image_zoom_total:
        average(sessions.map((s) => s.summary.image_zoom_total)) ?? 0,
      avg_image_zoom_unique:
        average(sessions.map((s) => s.summary.image_zoom_unique_count)) ?? 0,
      sessions_with_video_play_pct: pct(
        sessions.filter((s) => s.summary.escola_digital_video_play_count > 0).length,
        n,
      ),
      sessions_with_video_completed_pct: pct(
        sessions.filter((s) => s.summary.escola_digital_video_completed_count > 0).length,
        n,
      ),
      avg_video_watch_seconds:
        videoWatchSeconds.length > 0 ? average(videoWatchSeconds) : null,
      teacher_button_usage_pct: pct(
        sessions.filter((s) => s.summary.teacher_button_opened_count > 0).length,
        n,
      ),
    },
    feedback_analytics: {
      feedback_count: feedbackCount,
      feedback_rate_pct: pct(feedbackCount, n),
      avg_rating: average(ratings),
      avg_navigation_clarity: average(navigationScores),
      avg_visual_comfort: average(visualScores),
      avg_resource_usefulness: average(resourceScores),
      would_use_again_distribution: wouldUseAgainDistribution,
    },
    technical_analytics: {
      device_distribution: deviceDistribution,
      browser_distribution: browserDistribution,
      technical_issues_pct: pct(sessionsWithTechnicalIssues, n),
      total_runtime_errors: totalRuntimeErrors,
      total_asset_load_errors: totalAssetLoadErrors,
      total_render_errors: totalRenderErrors,
      sessions_with_technical_issues: sessionsWithTechnicalIssues,
    },
    data_quality: {
      avg_data_quality_score: average(qualityScores),
      reliable_session_count: rows.filter(
        (r) => r.dataQualityScore !== null && r.dataQualityScore >= RELIABLE_QUALITY_THRESHOLD,
      ).length,
      reliable_quality_threshold: RELIABLE_QUALITY_THRESHOLD,
      duplicate_session_ids: [...new Set(duplicateSessionIds)],
      mixed_book_or_chapter: mixedBookOrChapter,
      load_error_count: loadErrors.length,
      per_session_warnings_count: perSessionWarningsCount,
    },
    sessions: rows,
  };

  return {
    ...partial,
    insights: buildGroupInsights(partial),
  };
}

/** @deprecated Use aggregateSessionReports */
export function buildGroupTestReport(
  sessions: ParsedDashboardReport[],
  loadErrors: { fileName: string; message: string }[] = [],
): GroupReport {
  return aggregateSessionReports(sessions, loadErrors);
}
