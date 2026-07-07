import type { ParsedDashboardReport } from './types';
import {
  buildHealthChecks,
  buildQualityChecksByCategory,
  buildTechnicalAlerts,
  getIntegrityStatusClass,
  getIntegrityStatusLabel,
  QUALITY_CATEGORY_LABELS,
} from './reportInsights';
import {
  formatBytes,
  formatLoadTimeMs,
  getLoadTimeRating,
} from './reportExtractors';
import { SessionDeviceSection } from './SessionVisualBlocks';
import { DashboardSection, QualityWarningGroup } from './reportUi';
import { MetricTerm, TECHNICAL_HEALTH_HINTS } from './InfoHint';

export function SessionTechnicalReport({ parsed }: { parsed: ParsedDashboardReport }) {
  const { summary, events } = parsed;
  const healthChecks = buildHealthChecks(summary);
  const qualityByCategory = buildQualityChecksByCategory(events, summary);
  const technicalAlerts = buildTechnicalAlerts(summary);
  const loadTimeRating = getLoadTimeRating(summary.page_load_time_ms);

  const errorTotal =
    (summary.runtime_errors_count ?? 0) +
    (summary.asset_load_errors_count ?? 0) +
    (summary.render_errors_count ?? 0);
  const qaReady =
    !summary.has_technical_issues &&
    errorTotal === 0 &&
    (summary.data_quality_score ?? 0) >= 100;

  return (
    <div className="space-y-6">
      <section
        className={`rounded-2xl border-2 p-6 shadow-sm ${
          qaReady
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white'
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Técnico & QA
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Performance e qualidade da sessão</h2>
        <div
          className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
            qaReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {qaReady ? '✓ Sessão sem bloqueadores críticos' : '⚠ Revisar alertas abaixo'}
        </div>
      </section>

      <SessionDeviceSection summary={summary} />

      <DashboardSection title="Performance e erros">
        <p className="mb-4 text-sm text-slate-600">
          Tempos e problemas observados durante o uso real — peso em bytes reflete o carregado
          nesta sessão.
        </p>
        {!summary.has_technical_issues &&
        summary.page_load_time_ms == null &&
        summary.session_bytes_transferred == null ? (
          <p className="mb-4 text-sm text-slate-500">Nenhum problema técnico registrado.</p>
        ) : null}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Tempo de carregamento" hint={TECHNICAL_HEALTH_HINTS.loadTime} />
            </dt>
            <dd className="mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#80298F]">
                  {formatLoadTimeMs(summary.page_load_time_ms)}
                </span>
                {loadTimeRating ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${loadTimeRating.badgeClass}`}
                  >
                    {loadTimeRating.label}
                  </span>
                ) : null}
              </div>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="TTFB" hint={TECHNICAL_HEALTH_HINTS.ttfb} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatLoadTimeMs(summary.ttfb_ms)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Peso da sessão" hint={TECHNICAL_HEALTH_HINTS.sessionWeight} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {formatBytes(summary.session_bytes_transferred)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Erros de script" hint={TECHNICAL_HEALTH_HINTS.scriptErrors} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">{summary.runtime_errors_count ?? 0}</dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Assets não carregados" hint={TECHNICAL_HEALTH_HINTS.missingAssets} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">
              {summary.asset_load_errors_count ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">
              <MetricTerm label="Falhas de renderização" hint={TECHNICAL_HEALTH_HINTS.renderErrors} />
            </dt>
            <dd className="mt-1 font-semibold text-[#80298F]">{summary.render_errors_count ?? 0}</dd>
          </div>
        </dl>
        {summary.bytes_from_cache_only ? (
          <p className="mt-3 text-xs text-slate-500">
            Recursos vieram principalmente do cache — bytes podem aparecer como 0 B.
          </p>
        ) : null}
        {summary.runtime_error_messages?.length ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Mensagens de erro</p>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {summary.runtime_error_messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.asset_load_failures?.length ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Assets que falharam</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {summary.asset_load_failures.map((failure) => (
                <li key={`${failure.asset_type}:${failure.src}`}>
                  <span className="font-medium">{failure.asset_type}</span> — {failure.src}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Qualidade da coleta">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-[#80298F]">
                {summary.data_quality_score ?? '—'}
              </p>
            </div>
            {summary.event_integrity_status ? (
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${getIntegrityStatusClass(summary.event_integrity_status)}`}
              >
                {getIntegrityStatusLabel(summary.event_integrity_status)}
              </span>
            ) : null}
          </div>
          {(Object.keys(QUALITY_CATEGORY_LABELS) as Array<keyof typeof QUALITY_CATEGORY_LABELS>).map(
            (category) => {
              const items = qualityByCategory[category];
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    {QUALITY_CATEGORY_LABELS[category]}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 shrink-0 ${item.ok ? 'text-emerald-600' : item.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}
                        >
                          {item.ok ? '✓' : '✗'}
                        </span>
                        <span className={item.ok ? 'text-slate-800' : 'text-slate-600'}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}
          {(summary.missing_expected_events?.length ?? 0) > 0 ||
          (summary.duplicate_event_warnings?.length ?? 0) > 0 ||
          (summary.inconsistent_event_warnings?.length ?? 0) > 0 ? (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              {summary.duplicate_event_warnings?.length ? (
                <QualityWarningGroup
                  title="Possíveis duplicatas"
                  items={summary.duplicate_event_warnings}
                />
              ) : null}
              {summary.inconsistent_event_warnings?.length ? (
                <QualityWarningGroup
                  title="Inconsistências"
                  items={summary.inconsistent_event_warnings}
                />
              ) : null}
            </div>
          ) : null}
        </DashboardSection>

        <DashboardSection title="Checklist da sessão">
          <ul className="space-y-2">
            {healthChecks.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className={item.ok ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.ok ? '✓' : '○'}
                </span>
                <span className={item.ok ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
              </li>
            ))}
          </ul>
          {technicalAlerts.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Alertas técnicos</h3>
              {technicalAlerts.map((alert) => (
                <p
                  key={alert.id}
                  className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  {alert.message}
                </p>
              ))}
            </div>
          ) : null}
        </DashboardSection>
      </div>
    </div>
  );
}
