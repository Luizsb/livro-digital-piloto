import type { ParsedDashboardReport, GroupTestReport, GroupSessionRow, PageHeatmapItem } from './types';
import {
  extractSessionVisibleSeconds,
  getChapterPageNumbers,
  getChapterStatusLabel,
  getParticipantLabel,
} from './reportExtractors';

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

function buildGroupInsight(report: Omit<GroupTestReport, 'insight'>): string {
  const n = report.sessionCount;
  const parts: string[] = [];

  parts.push(
    `O grupo de teste reúne ${n} sessão${n === 1 ? '' : 'ões'} do capítulo ${report.chapterId} (${report.bookId}).`,
  );

  parts.push(
    `Em média, cada participante visualizou ${report.avgPagesViewed} de ${report.sessions[0]?.totalPages ?? '—'} páginas, com taxa média de conclusão de páginas de ${report.avgCompletionRate}%.`,
  );

  parts.push(
    `${report.chapterFinishedPct}% finalizaram o capítulo e ${report.chapterCompletedPct}% atingiram o critério de conclusão pedagógica.`,
  );

  if (report.abandonmentPct > 0) {
    parts.push(
      `${report.abandonmentPct}% não percorreram todas as páginas antes de encerrar.`,
    );
    const topAbandon = [...report.pageHeatmap]
      .filter((p) => p.abandonmentCount > 0)
      .sort((a, b) => b.abandonmentCount - a.abandonmentCount)[0];
    if (topAbandon) {
      parts.push(
        `A página mais frequente como último ponto de parada foi a pág. ${topAbandon.page} (${topAbandon.abandonmentCount} sessão${topAbandon.abandonmentCount === 1 ? '' : 'ões'}).`,
      );
    }
  }

  if (report.avgVisibleTimeSeconds !== null) {
    const min = Math.floor(report.avgVisibleTimeSeconds / 60);
    const sec = Math.round(report.avgVisibleTimeSeconds % 60);
    const timeLabel = min > 0 ? `${min} min${sec > 0 ? ` ${sec} s` : ''}` : `${sec}s`;
    parts.push(`O tempo médio visível no livro foi de cerca de ${timeLabel}.`);
  }

  if (report.feedbackCount > 0 && report.avgRating !== null) {
    parts.push(
      `${report.feedbackCount} participante${report.feedbackCount === 1 ? '' : 's'} enviou feedback, com nota média geral de ${report.avgRating.toFixed(1)}/5.`,
    );
  }

  if (report.reliableSessionCount < n) {
    parts.push(
      `${report.reliableSessionCount} de ${n} sessões têm qualidade da coleta ≥ ${RELIABLE_QUALITY_THRESHOLD} — considere filtrar sessões com score baixo antes de conclusões definitivas.`,
    );
  }

  parts.push(
    'Estes indicadores descrevem padrões de uso e engajamento — não medem aprendizagem ou compreensão.',
  );

  return parts.join(' ');
}

export function buildGroupTestReport(
  sessions: ParsedDashboardReport[],
  loadErrors: { fileName: string; message: string }[] = [],
): GroupTestReport {
  const warnings: string[] = [];
  const n = sessions.length;

  if (n === 0) {
    return {
      sessionCount: 0,
      bookId: '—',
      chapterId: '—',
      participantIds: [],
      warnings: ['Nenhuma sessão válida para consolidar.'],
      loadErrors,
      avgPagesViewed: 0,
      avgCompletionRate: 0,
      chapterFinishedPct: 0,
      chapterCompletedPct: 0,
      abandonmentPct: 0,
      avgVisibleTimeSeconds: null,
      avgIdleTimeSeconds: null,
      avgDataQualityScore: null,
      reliableSessionCount: 0,
      readingDepthDistribution: {},
      deviceDistribution: {},
      wouldUseAgainDistribution: {},
      feedbackCount: 0,
      avgRating: null,
      avgNavigationClarity: null,
      avgVisualComfort: null,
      avgResourceUsefulness: null,
      pageHeatmap: [],
      avgResourcesOpened: 0,
      teacherButtonUsagePct: 0,
      technicalIssuesPct: 0,
      sessions: [],
      insight: 'Carregue ao menos um JSON exportado pelo piloto para gerar o relatório do grupo.',
    };
  }

  const bookIds = new Set(sessions.map((s) => s.summary.book_id));
  const chapterIds = new Set(sessions.map((s) => s.summary.chapter_id));
  if (bookIds.size > 1 || chapterIds.size > 1) {
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

  for (const session of sessions) {
    for (const w of session.warnings) {
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
  const wouldUseAgainDistribution: Record<string, number> = {};

  let feedbackCount = 0;
  const ratings: number[] = [];
  const navigationScores: number[] = [];
  const visualScores: number[] = [];
  const resourceScores: number[] = [];

  for (const session of sessions) {
    const { summary } = session;
    if (summary.reading_depth_label) {
      increment(readingDepthDistribution, summary.reading_depth_label);
    }
    if (summary.device_type_label) {
      increment(deviceDistribution, summary.device_type_label);
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
  }

  const base: Omit<GroupTestReport, 'insight'> = {
    sessionCount: n,
    bookId: sessions[0].summary.book_id,
    chapterId: sessions[0].summary.chapter_id,
    participantIds,
    warnings,
    loadErrors,
    avgPagesViewed: average(rows.map((r) => r.pagesViewedCount)) ?? 0,
    avgCompletionRate: average(rows.map((r) => r.completionRate)) ?? 0,
    chapterFinishedPct: pct(rows.filter((r) => r.chapterFinished).length, n),
    chapterCompletedPct: pct(rows.filter((r) => r.chapterCompleted).length, n),
    abandonmentPct: pct(rows.filter((r) => r.abandonedBeforeEnd).length, n),
    avgVisibleTimeSeconds: average(visibleTimes),
    avgIdleTimeSeconds: idleTimes.length > 0 ? average(idleTimes) : null,
    avgDataQualityScore: average(qualityScores),
    reliableSessionCount: rows.filter(
      (r) => r.dataQualityScore !== null && r.dataQualityScore >= RELIABLE_QUALITY_THRESHOLD,
    ).length,
    readingDepthDistribution,
    deviceDistribution,
    wouldUseAgainDistribution,
    feedbackCount,
    avgRating: average(ratings),
    avgNavigationClarity: average(navigationScores),
    avgVisualComfort: average(visualScores),
    avgResourceUsefulness: average(resourceScores),
    pageHeatmap: buildPageHeatmap(sessions),
    avgResourcesOpened:
      average(sessions.map((s) => s.summary.resources_opened_total)) ?? 0,
    teacherButtonUsagePct: pct(
      sessions.filter((s) => s.summary.teacher_button_opened_count > 0).length,
      n,
    ),
    technicalIssuesPct: pct(rows.filter((r) => r.hasTechnicalIssues).length, n),
    sessions: rows,
  };

  return {
    ...base,
    insight: buildGroupInsight(base),
  };
}
