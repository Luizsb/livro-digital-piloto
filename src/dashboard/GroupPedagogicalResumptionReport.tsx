import { useMemo } from 'react';
import type { GroupReport } from './types';
import { buildGroupPedagogicalResumption } from './buildGroupPedagogicalResumption';
import { pluralParticipante, pluralSessao } from '@shared/lib/pluralizePt';
import { formatDuration } from './reportExtractors';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function GroupPedagogicalResumptionReport({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const resumption = useMemo(() => buildGroupPedagogicalResumption(report), [report]);
  const avgCompletedSeconds = report.summary.avg_seconds_per_completed_page;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#9B4DAB]/25 bg-gradient-to-br from-[#F9DDFF]/40 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#80298F]">
          Retomada pedagógica
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Sinais para planejar a próxima aula
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Prioriza páginas, recursos e participantes com padrões que podem exigir mediação — com base
          em uso e jornada, não em aprendizagem medida.
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Hipóteses para discussão em sala; valide com o professor antes de tratar como dificuldade
          de conteúdo.
        </p>
      </section>

      {resumption.discussion_points.length > 0 ? (
        <Section title="Pontos para discussão em aula">
          <ul className="space-y-3">
            {resumption.discussion_points.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-xl border border-[#80298F]/15 bg-[#F9DDFF]/20 px-4 py-3 text-sm text-slate-800"
              >
                <span className="mt-0.5 text-[#80298F]" aria-hidden>
                  →
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {resumption.page_priorities.length > 0 ? (
        <Section
          title="Páginas que merecem retomada"
          subtitle="Alta visualização com baixa conclusão, gap entre abertura e conclusão, ou abandono frequente."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Página</th>
                  <th className="pb-2 pr-4 font-medium">Prioridade</th>
                  <th className="pb-2 pr-4 font-medium">Vistas / concluídas</th>
                  <th className="pb-2 pr-4 font-medium">Gap</th>
                  <th className="pb-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {resumption.page_priorities.map((row) => (
                  <tr key={row.page} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-[#80298F]">Pág. {row.page}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.priority === 'high'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.priority === 'high' ? 'Alta' : 'Média'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.viewedPct}% / {row.completedPct}%
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.gapCount > 0 ? `${row.gapCount} (${row.gapPct}%)` : '—'}
                    </td>
                    <td className="py-2.5 text-slate-600">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : (
        <Section title="Páginas que merecem retomada">
          <p className="text-sm text-slate-500">
            Nenhuma página com sinal forte de retomada neste lote ({n} {pluralSessao(n)}).
          </p>
        </Section>
      )}

      {resumption.ignored_resources.length > 0 ? (
        <Section title="Recursos pouco adotados no grupo">
          <ul className="grid gap-3 sm:grid-cols-2">
            {resumption.ignored_resources.map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-slate-600">
                  {item.sessions_missed} de {n} não abriram ({item.miss_pct}%)
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {avgCompletedSeconds !== null && avgCompletedSeconds > 0 ? (
        <Section title="Referência de tempo">
          <p className="text-sm text-slate-700">
            Tempo médio por página concluída no grupo:{' '}
            <span className="font-semibold text-[#80298F]">
              {formatDuration(Math.round(avgCompletedSeconds))}
            </span>
            {report.summary.avg_open_completion_gap > 0 ? (
              <>
                {' '}
                · Gap médio abertura×conclusão:{' '}
                <span className="font-semibold">
                  {Math.round(report.summary.avg_open_completion_gap)} pág./sessão
                </span>
              </>
            ) : null}
          </p>
        </Section>
      ) : null}

      {resumption.participant_flags.length > 0 ? (
        <Section
          title="Participantes com sinais de atenção"
          subtitle={`${resumption.participant_flags.length} de ${report.participants_count} ${pluralParticipante(report.participants_count)}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Participante</th>
                  <th className="pb-2 pr-4 font-medium">Abandono</th>
                  <th className="pb-2 pr-4 font-medium">Gap</th>
                  <th className="pb-2 pr-4 font-medium">Ritmo</th>
                  <th className="pb-2 font-medium">Sinais</th>
                </tr>
              </thead>
              <tbody>
                {resumption.participant_flags.map((row) => (
                  <tr key={`${row.participant_id}:${row.file_name}`} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-[#80298F]">
                      {row.participant_id}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.abandonment_page != null ? `Pág. ${row.abandonment_page}` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.open_completion_gap > 0 ? `${row.open_completion_gap} pág.` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.reading_depth_label ?? '—'}
                    </td>
                    <td className="py-2.5 text-xs text-slate-600">{row.flags.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </div>
  );
}

export default GroupPedagogicalResumptionReport;
