import { DEVICE_TYPE_LABELS, type DeviceType } from '@analytics/deviceContext';
import { pluralSessao } from '@shared/lib/pluralizePt';

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

const DEVICE_ICONS: Record<DeviceType, string> = {
  desktop: '🖥️',
  mobile: '📱',
  tablet: '📲',
};

const CHART_PALETTE = [
  '#80298F',
  '#9B4DAB',
  '#C084FC',
  '#6B2278',
  '#E9D5FF',
  '#4C1D6E',
];

function sortedEntries(items: Record<string, number>): [string, number][] {
  return Object.entries(items).sort((a, b) => b[1] - a[1]);
}

export function HorizontalBarChart({
  items,
  total,
  emptyLabel = 'Sem dados neste lote.',
  maxPct = 100,
}: {
  items: Record<string, number>;
  total: number;
  emptyLabel?: string;
  maxPct?: number;
}) {
  const entries = sortedEntries(items);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  const maxCount = entries[0]?.[1] ?? 1;

  return (
    <ul className="space-y-3">
      {entries.map(([label, count], index) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = maxPct === 100 ? pct : Math.round((count / maxCount) * 100);
        const color = CHART_PALETTE[index % CHART_PALETTE.length];

        return (
          <li key={label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700">{label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {count} · {pct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${barWidth}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ValueBarChart({
  items,
  formatLabel,
  barColor = '#80298F',
  emptyLabel = 'Sem dados neste lote.',
}: {
  items: Array<{ label: string; value: number; hint?: string }>;
  formatLabel?: (value: number, hint?: string) => string;
  barColor?: string;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const format =
    formatLabel ?? ((value: number, hint?: string) => (hint ? `${value} · ${hint}` : String(value)));

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const barWidth = Math.round((item.value / maxValue) * 100);
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700">{item.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {format(item.value, item.hint)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(barWidth, item.value > 0 ? 6 : 0)}%`, backgroundColor: barColor }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: ChartSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let acc = 0;

  const gradient =
    total > 0
      ? segments
          .map((segment) => {
            const start = (acc / total) * 100;
            acc += segment.value;
            const end = (acc / total) * 100;
            return `${segment.color} ${start}% ${end}%`;
          })
          .join(', ')
      : '#e2e8f0';

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-36 w-36 shrink-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: total > 0 ? `conic-gradient(${gradient})` : '#e2e8f0' }}
        />
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span className="text-2xl font-bold tabular-nums text-[#80298F]">{centerValue}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="flex-1 text-slate-700">{segment.label}</span>
            <span className="font-semibold tabular-nums text-[#80298F]">
              {segment.value}
              {total > 0 ? ` (${Math.round((segment.value / total) * 100)}%)` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeviceTypeCards({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const types: DeviceType[] = ['desktop', 'mobile', 'tablet'];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {types.map((type) => {
        const count = distribution[type] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div
            key={type}
            className={`rounded-xl border p-4 text-center transition ${
              count > 0
                ? 'border-[#80298F]/25 bg-[#F9DDFF]/30'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <span className="text-3xl" aria-hidden>
              {DEVICE_ICONS[type]}
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-800">{DEVICE_TYPE_LABELS[type]}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#80298F]">{pct}%</p>
            <p className="text-xs text-slate-500">
              {count} de {total} {pluralSessao(total)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function PageJourneyChart({
  pages,
  sessionCount,
}: {
  pages: Array<{
    page: number;
    viewedCount: number;
    viewedPct: number;
    completedCount: number;
    completedPct: number;
    gapCount: number;
    gapPct: number;
    abandonmentCount: number;
  }>;
  sessionCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-6 rounded bg-[#80298F]" aria-hidden />
          Visualizada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-6 rounded bg-emerald-500" aria-hidden />
          Concluída
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-6 rounded bg-slate-400" aria-hidden />
          Vista sem conclusão
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-6 rounded bg-amber-500" aria-hidden />
          Ponto de abandono
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] items-end justify-between gap-1 border-b border-slate-200 pb-2">
          {pages.map((item) => {
            const abandonPct =
              sessionCount > 0 ? Math.round((item.abandonmentCount / sessionCount) * 100) : 0;
            const gapPct =
              sessionCount > 0 ? Math.round((item.gapCount / sessionCount) * 100) : 0;

            return (
              <div key={item.page} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-2.5 rounded-t bg-[#80298F]/90"
                    style={{ height: `${Math.max(item.viewedPct, item.viewedCount > 0 ? 6 : 0)}%` }}
                    title={`Visualizada: ${item.viewedCount}/${sessionCount} (${item.viewedPct}%)`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-emerald-500"
                    style={{
                      height: `${Math.max(item.completedPct, item.completedCount > 0 ? 6 : 0)}%`,
                    }}
                    title={`Concluída: ${item.completedCount}/${sessionCount} (${item.completedPct}%)`}
                  />
                  {item.gapCount > 0 ? (
                    <div
                      className="w-2.5 rounded-t bg-slate-400"
                      style={{ height: `${Math.max(gapPct, 8)}%` }}
                      title={`Vista sem conclusão: ${item.gapCount}/${sessionCount} (${gapPct}%)`}
                    />
                  ) : null}
                  {item.abandonmentCount > 0 ? (
                    <div
                      className="w-2.5 rounded-t bg-amber-500"
                      style={{ height: `${Math.max(abandonPct, 8)}%` }}
                      title={`Abandono: ${item.abandonmentCount} (${abandonPct}%)`}
                    />
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold text-slate-700">p.{item.page}</span>
                <div className="w-full space-y-0.5 text-center text-[9px] leading-tight text-slate-500">
                  <p className="text-[#80298F]">
                    {item.viewedCount} ({item.viewedPct}%)
                  </p>
                  <p className="text-emerald-600">
                    {item.completedCount} ({item.completedPct}%)
                  </p>
                  {item.gapCount > 0 ? (
                    <p className="text-slate-600">
                      {item.gapCount} ({gapPct}%)
                    </p>
                  ) : null}
                  {item.abandonmentCount > 0 ? (
                    <p className="text-amber-600">
                      {item.abandonmentCount} ({abandonPct}%)
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RatingDistributionChart({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const stars = ['5', '4', '3', '2', '1'];

  return (
    <ul className="space-y-2">
      {stars.map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <li key={star} className="flex items-center gap-3 text-sm">
            <span className="w-8 shrink-0 font-medium text-slate-600">{star}★</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#80298F]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right tabular-nums text-slate-500">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function DimensionScoreBars({
  dimensions,
}: {
  dimensions: Array<{ label: string; value: number | null; max?: number }>;
}) {
  const max = 5;

  return (
    <ul className="space-y-3">
      {dimensions.map((dim) => {
        const value = dim.value ?? 0;
        const pct = value > 0 ? Math.round((value / max) * 100) : 0;

        return (
          <li key={dim.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-700">{dim.label}</span>
              <span className="font-semibold tabular-nums text-[#80298F]">
                {dim.value !== null ? `${dim.value.toFixed(1)}/${max}` : '—'}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9B4DAB] to-[#80298F]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function EngagementRateChart({
  items,
}: {
  items: Array<{ label: string; pct: number; detail?: string }>;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[#80298F]">
              {item.pct}%{item.detail ? ` · ${item.detail}` : ''}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#80298F]"
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
