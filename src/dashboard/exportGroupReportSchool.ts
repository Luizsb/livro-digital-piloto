import type { GroupReport } from './types';
import { formatDuration } from '@shared/lib/formatDuration';
import jsPDF from 'jspdf';

function stamp(report: GroupReport): string {
  return report.generated_at.slice(0, 10);
}

function baseName(report: GroupReport): string {
  return `ld-insights-turma-${report.book_id}-${report.chapter_id}-${stamp(report)}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvEscape).join(',');
}

/** CSV para escola/BI: KPIs, heatmap e tabela de participantes. */
export function downloadGroupReportCsv(report: GroupReport, filename?: string): void {
  const { summary, page_analytics, feedback_analytics, data_quality, quality_filter } = report;
  const lines: string[] = [];

  lines.push(csvRow(['LD Insights — export para escola/BI']));
  lines.push(csvRow(['Gerado em', report.generated_at_br]));
  lines.push(csvRow(['Livro', report.book_id]));
  lines.push(csvRow(['Capítulo', report.chapter_id]));
  lines.push(
    csvRow([
      'Sessões no relatório',
      report.valid_sessions_count,
      'Participantes',
      report.participants_count,
    ]),
  );
  if (quality_filter.applied) {
    lines.push(
      csvRow([
        'Filtro de qualidade',
        `score ≥ ${quality_filter.threshold}`,
        'Excluídas',
        quality_filter.excluded_count,
        'Total após dedup',
        quality_filter.total_sessions_after_dedup,
      ]),
    );
  }
  lines.push('');

  lines.push(csvRow(['=== KPIs ===']));
  lines.push(csvRow(['Métrica', 'Valor']));
  lines.push(csvRow(['Média páginas vistas', summary.avg_pages_viewed]));
  lines.push(csvRow(['Média páginas concluídas', summary.avg_pages_completed]));
  lines.push(csvRow(['Média conclusão das vistas (%)', summary.avg_completion_rate]));
  lines.push(csvRow(['Gap médio abertura×conclusão (págs.)', summary.avg_open_completion_gap]));
  lines.push(csvRow(['Sessões com gap (%)', summary.sessions_with_page_gap_pct]));
  lines.push(
    csvRow([
      'Tempo médio/página concluída (s)',
      summary.avg_seconds_per_completed_page,
    ]),
  );
  lines.push(csvRow(['Tempo visível médio (s)', summary.avg_visible_time_seconds]));
  lines.push(csvRow(['Conclusão 100% do capítulo (%)', summary.full_completion_pct]));
  lines.push(csvRow(['Feedbacks enviados', feedback_analytics.feedback_count]));
  lines.push(csvRow(['Nota média feedback', feedback_analytics.avg_rating]));
  lines.push(csvRow(['Qualidade média da coleta', data_quality.avg_data_quality_score]));
  lines.push(
    csvRow([
      'Sessões confiáveis (≥ limiar)',
      `${data_quality.reliable_session_count}/${report.valid_sessions_count}`,
    ]),
  );
  lines.push('');

  lines.push(csvRow(['=== Heatmap por página ===']));
  lines.push(
    csvRow([
      'Página',
      'Vistas',
      'Vistas (%)',
      'Concluídas',
      'Concluídas (%)',
      'Vista sem conclusão',
      'Gap (%)',
      'Abandonos',
    ]),
  );
  for (const row of page_analytics.heatmap) {
    lines.push(
      csvRow([
        row.page,
        row.viewedCount,
        row.viewedPct,
        row.completedCount,
        row.completedPct,
        row.gapCount,
        row.gapPct,
        row.abandonmentCount,
      ]),
    );
  }
  lines.push('');

  lines.push(csvRow(['=== Participantes ===']));
  lines.push(
    csvRow([
      'Participante',
      'Abertura (vistas)',
      'Concluídas',
      'Total páginas',
      'Conclusão vistas (%)',
      'Gap',
      'Abandono',
      'Última página',
      'Tempo/pág. concluída (s)',
      'Status capítulo',
      'Tempo visível (s)',
      'Saídas da aba',
      'Vídeo',
      'ODA',
      'Qualidade',
      'Arquivo',
    ]),
  );
  for (const row of report.sessions) {
    lines.push(
      csvRow([
        row.participantId,
        row.pagesViewedCount,
        row.pagesCompletedCount,
        row.totalPages,
        row.completionRate,
        row.openCompletionGap,
        row.abandonmentPage,
        row.lastPageViewed,
        row.avgCompletedPageSeconds,
        row.chapterStatus,
        row.visibleTimeSeconds,
        row.tabHiddenCount,
        row.videoPlayed ? 'sim' : 'não',
        row.odaOpened ? 'sim' : 'não',
        row.dataQualityScore,
        row.fileName,
      ]),
    );
  }

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  downloadBlob(blob, filename ?? `${baseName(report)}.csv`);
}

function ensureSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  margin: number,
  pageHeight: number,
): number {
  if (y + needed <= pageHeight - margin) return y;
  doc.addPage();
  return margin;
}

/** PDF resumido para enviar à escola sem o dashboard. */
export function downloadGroupReportPdf(report: GroupReport, filename?: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  const { summary, page_analytics, feedback_analytics, data_quality, quality_filter } = report;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(128, 41, 143);
  doc.text('LD Insights — Relatório de turma', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Gerado em: ${report.generated_at_br}`, margin, y);
  y += 5;
  doc.text(`Livro: ${report.book_id}  ·  Capítulo: ${report.chapter_id}`, margin, y);
  y += 5;
  doc.text(
    `Participantes: ${report.participants_count}  ·  Sessões: ${report.valid_sessions_count}`,
    margin,
    y,
  );
  y += 5;
  if (quality_filter.applied) {
    doc.text(
      `Filtro: score ≥ ${quality_filter.threshold} (${quality_filter.excluded_count} sessão(ões) excluída(s))`,
      margin,
      y,
    );
    y += 5;
  }
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KPIs', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const kpiLines = [
    `Abertura média: ${summary.avg_pages_viewed} págs. · Conclusão média: ${summary.avg_pages_completed} págs.`,
    `Conclusão das vistas: ${summary.avg_completion_rate}% · Gap médio: ${summary.avg_open_completion_gap} pág.`,
    `Tempo visível médio: ${formatDuration(summary.avg_visible_time_seconds)}`,
    `Conclusão 100% do capítulo: ${summary.full_completion_pct}% das sessões`,
    `Feedback: ${feedback_analytics.feedback_count} resposta(s)${
      feedback_analytics.avg_rating !== null
        ? ` · nota média ${feedback_analytics.avg_rating.toFixed(1)}/5`
        : ''
    }`,
    `Qualidade da coleta: ${data_quality.avg_data_quality_score ?? '—'} · confiáveis ${data_quality.reliable_session_count}/${report.valid_sessions_count}`,
  ];

  for (const line of kpiLines) {
    y = ensureSpace(doc, y, 6, margin, pageHeight);
    const wrapped = doc.splitTextToSize(line, maxWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4.5 + 1;
  }

  y += 4;
  y = ensureSpace(doc, y, 20, margin, pageHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Heatmap por página', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Pág. | Vistas % | Concl. % | Gap | Abandonos', margin, y);
  y += 5;

  for (const row of page_analytics.heatmap) {
    y = ensureSpace(doc, y, 5, margin, pageHeight);
    doc.text(
      `${row.page} | ${row.viewedPct}% (${row.viewedCount}) | ${row.completedPct}% (${row.completedCount}) | ${row.gapCount} | ${row.abandonmentCount}`,
      margin,
      y,
    );
    y += 4.5;
  }

  y += 4;
  y = ensureSpace(doc, y, 20, margin, pageHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Participantes', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of report.sessions) {
    y = ensureSpace(doc, y, 14, margin, pageHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(row.participantId, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const detail = [
      `Abertura ${row.pagesViewedCount}/${row.totalPages} · Concl. vistas ${row.completionRate}% · Gap ${row.openCompletionGap}`,
      `Status: ${row.chapterStatus} · Tempo: ${formatDuration(row.visibleTimeSeconds)} · Qualidade: ${row.dataQualityScore ?? '—'}`,
      `Abandono: ${row.abandonmentPage != null ? `pág. ${row.abandonmentPage}` : '—'} · Vídeo: ${row.videoPlayed ? 'sim' : 'não'} · ODA: ${row.odaOpened ? 'sim' : 'não'}`,
    ];
    for (const line of detail) {
      const wrapped = doc.splitTextToSize(line, maxWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3.8;
    }
    y += 3;
  }

  y = ensureSpace(doc, y, 12, margin, pageHeight);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Indicadores descrevem uso e engajamento — não medem aprendizagem ou compreensão.',
    margin,
    y,
  );

  doc.save(filename ?? `${baseName(report)}.pdf`);
}
