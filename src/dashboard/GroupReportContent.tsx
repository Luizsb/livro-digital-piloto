import type { GroupTestReport } from './types';
import { formatDuration, formatWouldUseAgain } from './reportExtractors';
import { PAGE_COMPLETION_RATE_LABEL } from '../ld/metricDisplayLabels';

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[6.75rem] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#80298F]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : <span className="mt-auto" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function DistributionList({
  items,
  total,
}: {
  items: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados neste lote.</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map(([label, count]) => (
        <li key={label} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">{label}</span>
          <span className="font-semibold text-[#80298F]">
            {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeatmapBar({ pct, tone }: { pct: number; tone: 'viewed' | 'completed' | 'abandon' }) {
  const color =
    tone === 'viewed'
      ? 'bg-[#80298F]'
      : tone === 'completed'
        ? 'bg-emerald-500'
        : 'bg-amber-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GroupReportContent({ report }: { report: GroupTestReport }) {
  return (
    <div className="space-y-6">
      {(report.warnings.length > 0 || report.loadErrors.length > 0) && (
        <div className="space-y-2">
          {report.warnings.map((warning) => (
            <div
              key={warning}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {warning}
            </div>
          ))}
          {report.loadErrors.map((err) => (
            <div
              key={`${err.fileName}:${err.message}`}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <span className="font-medium">{err.fileName}:</span> {err.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Sessões no grupo" value={String(report.sessionCount)} />
        <MetricCard
          label="Participantes"
          value={String(report.participantIds.length)}
          hint={report.participantIds.join(', ') || undefined}
        />
        <MetricCard
          label="Páginas vistas (média)"
          value={String(report.avgPagesViewed)}
          hint={`de ${report.sessions[0]?.totalPages ?? '—'} por sessão`}
        />
        <MetricCard
          label={PAGE_COMPLETION_RATE_LABEL}
          value={`${report.avgCompletionRate}%`}
          hint="Média do grupo"
        />
        <MetricCard
          label="Capítulo finalizado"
          value={`${report.chapterFinishedPct}%`}
          hint="Clicou em Finalizar teste"
        />
        <MetricCard
          label="Capítulo concluído"
          value={`${report.chapterCompletedPct}%`}
          hint="Critério pedagógico mínimo"
        />
        <MetricCard
          label="Abandonou antes do fim"
          value={`${report.abandonmentPct}%`}
          hint="Não visualizou todas as páginas"
        />
        <MetricCard
          label="Tempo no livro (média)"
          value={formatDuration(report.avgVisibleTimeSeconds)}
        />
        {report.avgIdleTimeSeconds !== null ? (
          <MetricCard
            label="Tempo inativo (média)"
            value={formatDuration(Math.round(report.avgIdleTimeSeconds))}
          />
        ) : null}
        <MetricCard
          label="Qualidade da coleta (média)"
          value={report.avgDataQualityScore !== null ? String(report.avgDataQualityScore) : '—'}
          hint={`${report.reliableSessionCount}/${report.sessionCount} sessões ≥ 85`}
        />
      </div>

      <section className="rounded-2xl border-2 border-[#80298F]/20 bg-gradient-to-br from-[#F9DDFF]/60 via-white to-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-900">Resumo do grupo de teste</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Leitura executiva agregada — padrões de uso, não aprendizagem.
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-800">{report.insight}</p>
      </section>

      <Section title="Heatmap de páginas (grupo)">
        <p className="mb-4 text-sm text-slate-600">
          Percentual de sessões em que cada página foi visualizada, concluída ou foi o ponto de
          abandono. Útil para identificar onde o capítulo perde participantes.
        </p>
        <div className="space-y-4">
          {report.pageHeatmap.map((item) => (
            <div key={item.page} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">Pág. {item.page}</span>
                <span className="text-slate-500">
                  {item.viewedCount}/{report.sessionCount} vistas · {item.completedCount} concluídas
                  {item.abandonmentCount > 0 ? ` · ${item.abandonmentCount} abandono` : ''}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Visualizada ({item.viewedPct}%)
                  </p>
                  <HeatmapBar pct={item.viewedPct} tone="viewed" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Concluída ({item.completedPct}%)
                  </p>
                  <HeatmapBar pct={item.completedPct} tone="completed" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase text-slate-500">
                    Abandono ({report.sessionCount > 0 ? Math.round((item.abandonmentCount / report.sessionCount) * 100) : 0}%)
                  </p>
                  <HeatmapBar
                    pct={
                      report.sessionCount > 0
                        ? Math.round((item.abandonmentCount / report.sessionCount) * 100)
                        : 0
                    }
                    tone="abandon"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Profundidade de leitura">
          <DistributionList
            items={report.readingDepthDistribution}
            total={report.sessionCount}
          />
        </Section>
        <Section title="Dispositivos">
          <DistributionList items={report.deviceDistribution} total={report.sessionCount} />
        </Section>
      </div>

      {report.feedbackCount > 0 ? (
        <Section title="Feedback agregado">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Respostas</dt>
              <dd className="font-semibold text-[#80298F]">
                {report.feedbackCount}/{report.sessionCount}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Nota geral (média)</dt>
              <dd className="font-semibold text-[#80298F]">
                {report.avgRating?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Clareza da navegação</dt>
              <dd className="font-semibold text-[#80298F]">
                {report.avgNavigationClarity?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Conforto visual</dt>
              <dd className="font-semibold text-[#80298F]">
                {report.avgVisualComfort?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Utilidade dos recursos</dt>
              <dd className="font-semibold text-[#80298F]">
                {report.avgResourceUsefulness?.toFixed(1) ?? '—'}/5
              </dd>
            </div>
          </dl>
          {Object.keys(report.wouldUseAgainDistribution).length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Usaria novamente</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {Object.entries(report.wouldUseAgainDistribution).map(([key, count]) => (
                  <li key={key}>
                    {formatWouldUseAgain(key)}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : (
        <Section title="Feedback agregado">
          <p className="text-sm text-slate-500">Nenhum feedback enviado neste lote.</p>
        </Section>
      )}

      <Section title="Engajamento e técnica">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-slate-500">Recursos abertos (média)</dt>
            <dd className="font-semibold text-[#80298F]">{report.avgResourcesOpened}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Usou botão do professor</dt>
            <dd className="font-semibold text-[#80298F]">{report.teacherButtonUsagePct}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">Sessões com alerta técnico</dt>
            <dd className="font-semibold text-[#80298F]">{report.technicalIssuesPct}%</dd>
          </div>
        </dl>
      </Section>

      <Section title="Sessões do grupo">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Participante</th>
                <th className="pb-2 pr-4 font-medium">Páginas</th>
                <th className="pb-2 pr-4 font-medium">Conclusão</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Tempo</th>
                <th className="pb-2 pr-4 font-medium">Qualidade</th>
                <th className="pb-2 font-medium">Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {report.sessions.map((row) => (
                <tr key={`${row.participantId}:${row.fileName}`} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-[#80298F]">{row.participantId}</td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.pagesViewedCount}/{row.totalPages}
                    {row.abandonedBeforeEnd && row.abandonmentPage != null ? (
                      <span className="ml-1 text-xs text-amber-700">
                        (parou pág. {row.abandonmentPage})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.completionRate}%</td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.chapterStatus}</td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {formatDuration(row.visibleTimeSeconds)}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.dataQualityScore ?? '—'}
                  </td>
                  <td className="py-2.5 text-xs text-slate-500">{row.fileName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

export default GroupReportContent;
