/** Resposta estruturada do Resumo com IA (grupo). */
export interface GroupAiSummaryResult {
  title: string;
  synthesis: string;
  patterns: Array<{ label: string; detail: string }>;
  attention_points: Array<{
    label: string;
    detail: string;
    severity: 'info' | 'warning';
  }>;
  recommendations: Array<{ action: string; rationale: string }>;
}

export function isGroupAiSummaryResult(value: unknown): value is GroupAiSummaryResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as GroupAiSummaryResult;
  return (
    typeof v.title === 'string' &&
    typeof v.synthesis === 'string' &&
    Array.isArray(v.patterns) &&
    Array.isArray(v.attention_points) &&
    Array.isArray(v.recommendations)
  );
}

export function formatGroupAiSummaryAsText(result: GroupAiSummaryResult): string {
  const lines: string[] = [result.title, '', result.synthesis, '', 'Padrões do grupo'];
  for (const item of result.patterns) {
    lines.push(`- ${item.label}: ${item.detail}`);
  }
  lines.push('', 'Pontos de atenção');
  for (const item of result.attention_points) {
    lines.push(`- ${item.label}: ${item.detail}`);
  }
  lines.push('', 'Recomendações práticas');
  for (const item of result.recommendations) {
    lines.push(`- ${item.action} — ${item.rationale}`);
  }
  return lines.join('\n');
}
