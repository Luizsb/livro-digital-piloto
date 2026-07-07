import type { ReactNode } from 'react';
import type { ChapterManifest } from '@book/chapter/chapterManifest';
import { buildDigitalResourceCoverageRows } from '@book/chapter/chapterManifest';
import type { ParsedDashboardReport } from './types';
import type { DashboardAlert } from './types';
import { formatCoverageRate, formatExportedAt } from './reportExtractors';

export function MetricCard({
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
      <p className="mt-2 break-words text-base font-bold leading-snug text-[#80298F] sm:text-lg">
        {value}
      </p>
      {hint ? (
        <p className="mt-auto pt-1 text-xs text-slate-500">{hint}</p>
      ) : (
        <span className="mt-auto" aria-hidden />
      )}
    </div>
  );
}

export function DashboardSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
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

function InsightIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SessionInsightBlock({
  text,
  eventCount,
  exportedAt,
}: {
  text: string;
  eventCount: number;
  exportedAt: string;
}) {
  return (
    <section className="rounded-2xl border-2 border-[#80298F]/20 bg-gradient-to-br from-[#F9DDFF]/60 via-white to-white p-6 shadow-md">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#80298F] text-white shadow-sm">
          <InsightIcon />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Resumo interpretativo</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Leitura executiva da sessão — comportamento de uso, não validação técnica.
          </p>
        </div>
      </div>
      <p className="text-base leading-relaxed text-slate-800">{text}</p>
      <p className="mt-4 text-xs text-slate-500">
        {eventCount} evento(s) · exportado em {formatExportedAt(exportedAt)}
      </p>
    </section>
  );
}

export function QualityWarningGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950"
          >
            <span className="shrink-0 font-semibold" aria-hidden>
              ⚠
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InterpretationAlertsBlock({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum alerta de interpretação para esta sessão.</p>;
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
            alert.severity === 'warning'
              ? 'bg-amber-50 text-amber-950'
              : 'bg-blue-50 text-blue-950'
          }`}
        >
          <span className="shrink-0 font-semibold" aria-hidden>
            {alert.severity === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChapterCoverageSection({
  summary,
  chapterManifest,
}: {
  summary: ParsedDashboardReport['summary'];
  chapterManifest: ChapterManifest | null;
}) {
  if (typeof summary.expected_pages_count !== 'number') {
    return (
      <DashboardSection title="Cobertura do capítulo">
        <p className="text-sm text-slate-500">
          Manifest do capítulo indisponível para este relatório.
        </p>
      </DashboardSection>
    );
  }

  const digitalResourceRows =
    chapterManifest != null
      ? buildDigitalResourceCoverageRows(chapterManifest, summary.resources_not_opened ?? [])
      : [];

  const coverageRows = [
    {
      label: 'Páginas visualizadas',
      expected: summary.expected_pages_count,
      rate: summary.pages_viewed_coverage_rate,
      missing: summary.pages_not_viewed?.map((page) => `Pág. ${page}`) ?? [],
    },
    {
      label: 'Imagens expostas',
      expected: summary.expected_images_count ?? 0,
      rate: summary.image_exposure_coverage_rate,
      missing: summary.images_not_exposed ?? [],
    },
    ...digitalResourceRows.map((row) => ({
      label: row.label,
      expected: row.expected,
      rate: row.coverage_rate,
      missing: row.missing,
    })),
    {
      label: 'Seções do professor usadas',
      expected: summary.expected_teacher_buttons_count ?? 0,
      rate: summary.teacher_button_usage_coverage_rate,
      missing: summary.teacher_buttons_not_used ?? [],
    },
    {
      label: 'Atividades iniciadas',
      expected: summary.expected_activities_count ?? 0,
      rate: summary.activity_start_coverage_rate,
      missing: summary.activities_not_started ?? [],
    },
  ];

  return (
    <DashboardSection title="Cobertura do capítulo">
      <p className="mb-4 text-sm text-slate-600">
        Compara o que foi coletado com o inventário esperado do capítulo (manifest).
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coverageRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {row.label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#80298F]">
              {row.expected > 0 ? formatCoverageRate(row.rate) : 'N/A'}
            </dd>
            <dd className="mt-1 text-sm text-slate-600">
              {row.expected > 0
                ? `Inventário: ${row.expected} · Faltando: ${row.missing.length}`
                : 'Não previsto nesta versão do capítulo'}
            </dd>
            {row.missing.length > 0 ? (
              <dd className="mt-2 text-xs text-amber-800">{row.missing.join(', ')}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </DashboardSection>
  );
}

export function SessionReportViewTabs<T extends string>({
  view,
  onChange,
  tabs,
  meta,
}: {
  view: T;
  onChange: (view: T) => void;
  tabs: Array<{ id: T; label: string; hint: string }>;
  meta?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-4 py-3 text-left transition ${
              view === tab.id
                ? 'bg-[#80298F] text-white shadow-md shadow-[#80298F]/20'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="block text-sm font-bold">{tab.label}</span>
            <span
              className={`mt-0.5 block text-xs ${
                view === tab.id ? 'text-white/85' : 'text-slate-500'
              }`}
            >
              {tab.hint}
            </span>
          </button>
        ))}
      </div>
      {meta ? <p className="mt-3 px-2 text-xs text-slate-500">{meta}</p> : null}
    </div>
  );
}
