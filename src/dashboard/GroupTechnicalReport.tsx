import type { GroupReport } from './types';
import { formatBytes, formatLoadTimeMs } from './reportExtractors';
import { pluralSessao } from '@shared/lib/pluralizePt';
import { DeviceTypeCards, HorizontalBarChart, ValueBarChart } from './groupCharts';

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

export function GroupTechnicalReport({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const { technical_analytics, data_quality, advanced_analytics, technical_detail } = report;

  const loadByDevice = advanced_analytics.load_time_by_device.map((item) => ({
    label: item.device_label,
    value: item.avg_load_ms,
    hint: `${item.session_count} sessão${item.session_count === 1 ? '' : 'ões'}`,
  }));

  return (
    <div className="space-y-6">
      <section
        className={`rounded-2xl border-2 p-6 shadow-sm ${
          technical_detail.qa_ready
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white'
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Relatório técnico e QA
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Estabilidade, performance e qualidade da coleta
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Validação do lote para escalar o Livro Digital — {n} {pluralSessao(n)} analisada
          {n === 1 ? '' : 's'}.
        </p>
        <div
          className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
            technical_detail.qa_ready
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {technical_detail.qa_ready ? '✓ Lote sem bloqueadores críticos' : '⚠ Revisar antes de escalar'}
        </div>
        <ul className="mt-4 space-y-1.5">
          {technical_detail.qa_notes.map((note) => (
            <li key={note} className="text-sm text-slate-700">
              · {note}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Carga média',
            value:
              technical_detail.avg_page_load_ms !== null
                ? formatLoadTimeMs(technical_detail.avg_page_load_ms)
                : '—',
          },
          {
            label: 'TTFB médio',
            value:
              technical_detail.avg_ttfb_ms !== null
                ? formatLoadTimeMs(technical_detail.avg_ttfb_ms)
                : '—',
          },
          {
            label: 'Peso médio da sessão',
            value:
              technical_detail.avg_session_bytes !== null
                ? formatBytes(technical_detail.avg_session_bytes)
                : '—',
          },
          {
            label: 'Score de coleta (média)',
            value:
              data_quality.avg_data_quality_score !== null
                ? String(data_quality.avg_data_quality_score)
                : '—',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#80298F]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Erros de runtime', value: technical_analytics.total_runtime_errors },
          { label: 'Erros de carregamento', value: technical_analytics.total_asset_load_errors },
          { label: 'Erros de renderização', value: technical_analytics.total_render_errors },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#80298F]">{item.value}</p>
          </div>
        ))}
      </div>

      <Section
        title="Ambiente de acesso"
        subtitle="Dispositivos, sistemas operacionais e navegadores do grupo."
      >
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Tipo de dispositivo</h3>
            <DeviceTypeCards
              distribution={technical_analytics.device_type_distribution}
              total={n}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Sistema operacional</h3>
              <HorizontalBarChart
                items={technical_analytics.os_distribution}
                total={n}
                emptyLabel="SO não registrado."
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Navegador</h3>
              <HorizontalBarChart
                items={technical_analytics.browser_distribution}
                total={n}
                emptyLabel="Navegador não registrado."
              />
            </div>
          </div>
        </div>
      </Section>

      {loadByDevice.length > 0 ? (
        <Section title="Tempo de carregamento por dispositivo">
          <ValueBarChart
            items={loadByDevice}
            formatLabel={(ms, hint) => `${formatLoadTimeMs(ms)}${hint ? ` · ${hint}` : ''}`}
            barColor="#80298F"
          />
        </Section>
      ) : null}

      <Section title="Qualidade da coleta">
        <p className="mb-4 text-sm text-slate-600">
          Sessões confiáveis (score ≥ {data_quality.reliable_quality_threshold}):{' '}
          <strong className="text-slate-800">
            {data_quality.reliable_session_count}/{n}
          </strong>
          {data_quality.duplicate_session_ids.length > 0
            ? ` · ${data_quality.duplicate_session_ids.length} duplicada(s) ignorada(s)`
            : ''}
        </p>
        {data_quality.session_quality_issues.length > 0 ? (
          <ul className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            {data_quality.session_quality_issues.map((issue) => (
              <li key={`${issue.participant_id}:${issue.file_name}`}>
                <span className="font-semibold">{issue.participant_id}</span> ({issue.file_name}) —
                score {issue.score}
                {issue.warnings.length > 0 ? (
                  <span className="block text-xs text-amber-800">{issue.warnings.join(' ')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-emerald-700">
            Todas as sessões deste lote têm score 100.
          </p>
        )}
      </Section>

      <Section
        title="Ficha técnica por sessão"
        subtitle="Performance, erros e compatibilidade de cada participante."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Participante</th>
                <th className="pb-2 pr-4 font-medium">Dispositivo</th>
                <th className="pb-2 pr-4 font-medium">SO / Navegador</th>
                <th className="pb-2 pr-4 font-medium">Viewport</th>
                <th className="pb-2 pr-4 font-medium">Carga</th>
                <th className="pb-2 pr-4 font-medium">Peso</th>
                <th className="pb-2 pr-4 font-medium">Erros</th>
                <th className="pb-2 pr-4 font-medium">Score</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {technical_detail.sessions.map((row) => {
                const errorTotal = row.runtime_errors + row.asset_errors + row.render_errors;
                return (
                  <tr
                    key={`${row.participant_id}:${row.file_name}`}
                    className="border-b border-slate-100"
                  >
                    <td className="py-2.5 pr-4 font-semibold text-[#80298F]">
                      {row.participant_id}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{row.device_label}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-600">
                      {row.os_name}
                      <br />
                      {row.browser_label}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{row.viewport}</td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.page_load_time_ms !== null ? (
                        <>
                          {formatLoadTimeMs(row.page_load_time_ms)}
                          {row.load_rating ? (
                            <span className="ml-1 text-xs text-slate-500">({row.load_rating})</span>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {row.session_bytes !== null ? formatBytes(row.session_bytes) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{errorTotal}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{row.data_quality_score ?? '—'}</td>
                    <td className="py-2.5 text-slate-700">
                      {row.has_technical_issues ? (
                        <span className="text-amber-700">Alerta</span>
                      ) : (
                        <span className="text-emerald-700">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
