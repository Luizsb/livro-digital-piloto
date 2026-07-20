import { useMemo, useState } from 'react';
import type { ParsedDashboardReport } from './types';
import {
  buildSessionTimeline,
  getTimelineCategoryLabel,
  TIMELINE_CATEGORY_COLORS,
  type TimelineCategory,
  type TimelineDensity,
} from './buildSessionTimeline';
import { DashboardSection } from './reportUi';

const CATEGORY_FILTERS: Array<{ id: TimelineCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'session', label: 'Sessão' },
  { id: 'journey', label: 'Jornada' },
  { id: 'content', label: 'Conteúdo' },
  { id: 'teacher', label: 'Professor' },
  { id: 'focus', label: 'Foco' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'technical', label: 'Técnico' },
];

export function SessionTimelineReport({ parsed }: { parsed: ParsedDashboardReport }) {
  const [density, setDensity] = useState<TimelineDensity>('demo');
  const [category, setCategory] = useState<TimelineCategory | 'all'>('all');

  const timeline = useMemo(
    () => buildSessionTimeline(parsed.events, { density, category }),
    [parsed.events, density, category],
  );

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Timeline da sessão"
        subtitle="Sequência cronológica dos eventos — narrativa de uso para demo e debugging. Não afirma aprendizagem."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setDensity('demo')}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                density === 'demo'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Marcos (demo)
            </button>
            <button
              type="button"
              onClick={() => setDensity('detailed')}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                density === 'detailed'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Completo
            </button>
          </div>
          <p className="text-sm text-slate-500">
            {timeline.shown_count} de {timeline.total_events} evento
            {timeline.total_events === 1 ? '' : 's'}
            {density === 'demo' && timeline.hidden_count > 0
              ? ` · ${timeline.hidden_count} omitido(s) no modo marcos`
              : ''}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategory(filter.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                category === filter.id
                  ? 'bg-[#80298F] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#80298F]/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {timeline.items.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">
            Nenhum evento neste filtro. Troque a densidade ou a categoria.
          </p>
        ) : (
          <ol className="relative mt-8 space-y-0 border-l-2 border-slate-200 pl-6">
            {timeline.items.map((item) => (
              <li key={item.id} className="relative pb-6 last:pb-0">
                <span
                  className={`absolute -left-[1.55rem] top-1.5 size-3 rounded-full ring-4 ring-white ${TIMELINE_CATEGORY_COLORS[item.category]}`}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <time
                    dateTime={item.timestamp}
                    className="font-mono text-xs font-semibold tabular-nums text-slate-500"
                  >
                    {item.timeLabel}
                  </time>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {getTimelineCategoryLabel(item.category)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.label}</p>
                {item.detail ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </DashboardSection>
    </div>
  );
}

export default SessionTimelineReport;
