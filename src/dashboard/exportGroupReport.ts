import type { GroupReport } from './types';

export function downloadGroupReportJson(report: GroupReport, filename?: string): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const stamp = report.generated_at.slice(0, 10);
  anchor.download =
    filename ??
    `ld-insights-consolidado-${report.book_id}-${report.chapter_id}-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
