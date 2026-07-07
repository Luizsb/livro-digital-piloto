import type { GroupAdvancedAnalytics } from './buildGroupAdvancedAnalytics';
import { ValueBarChart } from './groupCharts';
import { formatDuration } from './reportExtractors';

function shortResourceLabel(id: string, type: string): string {
  if (id.includes('video') || type.includes('video')) return 'Vídeo Escola Digital';
  if (id.includes('oda') || type.includes('oda')) {
    const page = id.match(/page_(\d+)/)?.[1];
    return page ? `ODA (pág. ${page})` : 'ODA';
  }
  return id.replace(/_/g, ' ');
}

function shortImageLabel(id: string): string {
  const page = id.match(/page_(\d+)/)?.[1];
  const tail = id.split('_').slice(2).join(' ');
  if (page) return `Pág. ${page}${tail ? ` · ${tail}` : ''}`;
  return id.replace(/_/g, ' ');
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function GroupAdvancedSection({
  analytics,
  sessionCount,
}: {
  analytics: GroupAdvancedAnalytics;
  sessionCount: number;
}) {
  const pageDwell = analytics.page_dwell
    .filter((item) => item.avg_seconds !== null && item.sample_count > 0)
    .sort((a, b) => (a.avg_seconds ?? 0) - (b.avg_seconds ?? 0));

  const resources = analytics.resource_ranking.map((item) => ({
    label: shortResourceLabel(item.resource_id, item.resource_type),
    value: item.sessions_count,
    hint: `${item.open_count} abertura${item.open_count === 1 ? '' : 's'}`,
  }));

  const teacher = analytics.teacher_sections.map((item) => ({
    label: item.page !== null ? `Pág. ${item.page}` : item.section_id,
    value: item.sessions_count,
    hint: `${item.open_count} abertura${item.open_count === 1 ? '' : 's'}`,
  }));

  const images = analytics.image_interaction
    .filter((item) => item.viewed_sessions > 0)
    .slice(0, 6)
    .map((item) => ({
      label: shortImageLabel(item.image_id),
      value: item.interaction_pct,
      hint: `${item.zoomed_sessions}/${item.viewed_sessions} deram zoom`,
    }));

  const hasContent =
    pageDwell.length > 0 || resources.length > 0 || teacher.length > 0 || images.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Destaques do grupo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Leitura rápida do que merece atenção — tempo nas páginas, recursos usados e imagens com
          interação.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {pageDwell.length > 0 ? (
          <Panel
            title="Onde o grupo ficou menos tempo"
            subtitle="Média entre quem concluiu cada página (tempo mínimo atingido)."
          >
            <ValueBarChart
              items={pageDwell.map((item) => ({
                label: `Pág. ${item.page}`,
                value: Math.round(item.avg_seconds ?? 0),
                hint: `${item.sample_count} sessão${item.sample_count === 1 ? '' : 'ões'}`,
              }))}
              formatLabel={(seconds, hint) =>
                `${formatDuration(seconds)}${hint ? ` · ${hint}` : ''}`
              }
              barColor="#80298F"
            />
          </Panel>
        ) : null}

        {resources.length > 0 ? (
          <Panel
            title="Recursos digitais abertos"
            subtitle={`Quantas de ${sessionCount} sessões abriram cada recurso.`}
          >
            <ValueBarChart
              items={resources}
              formatLabel={(sessions, hint) =>
                `${sessions}/${sessionCount} sessões${hint ? ` · ${hint}` : ''}`
              }
              barColor="#9B4DAB"
            />
          </Panel>
        ) : null}

        {teacher.length > 0 ? (
          <Panel
            title="Botão do professor"
            subtitle="Seções consultadas no capítulo."
          >
            <ValueBarChart
              items={teacher}
              formatLabel={(sessions, hint) =>
                `${sessions}/${sessionCount} sessões${hint ? ` · ${hint}` : ''}`
              }
              barColor="#6B2278"
            />
          </Panel>
        ) : null}

        {images.length > 0 ? (
          <Panel
            title="Imagens com zoom"
            subtitle="Taxa de sessões que ampliaram entre as que viram a imagem."
          >
            <ValueBarChart
              items={images}
              formatLabel={(pct, hint) => `${pct}%${hint ? ` · ${hint}` : ''}`}
              barColor="#10b981"
            />
          </Panel>
        ) : null}
      </div>
    </section>
  );
}
