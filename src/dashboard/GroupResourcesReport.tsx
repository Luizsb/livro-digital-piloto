import type { GroupReport } from './types';
import { formatDuration, formatBytes, formatLoadTimeMs } from './reportExtractors';
import { pluralSessao } from '@shared/lib/pluralizePt';
import { VIDEO_METRICS_EXPLANATION } from '@analytics/metricDisplayLabels';
import {
  EngagementRateChart,
  ValueBarChart,
} from './groupCharts';

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

function shortResourceId(id: string): string {
  if (id.includes('video') || id.includes('escola')) return 'Vídeo Escola Digital';
  if (id.includes('oda')) {
    const page = id.match(/page_(\d+)/)?.[1];
    return page ? `ODA (pág. ${page})` : 'ODA';
  }
  return id.replace(/_/g, ' ');
}

export function GroupResourcesReport({ report }: { report: GroupReport }) {
  const n = report.valid_sessions_count;
  const { resource_analytics, engagement_analytics, advanced_analytics, resources_detail } =
    report;

  const resourceRanking = advanced_analytics.resource_ranking.map((item) => ({
    label: shortResourceId(item.resource_id),
    value: item.sessions_count,
    hint: `${item.open_count} abertura${item.open_count === 1 ? '' : 's'}`,
  }));

  const imageInteraction = advanced_analytics.image_interaction
    .filter((item) => item.viewed_sessions > 0)
    .map((item) => ({
      label: item.image_id.replace(/_/g, ' '),
      value: item.interaction_pct,
      hint: `${item.zoomed_sessions}/${item.viewed_sessions} deram zoom`,
    }));

  const teacherSections = advanced_analytics.teacher_sections.map((item) => ({
    label: item.page !== null ? `Pág. ${item.page}` : item.section_id,
    value: item.sessions_count,
    hint: `${item.open_count} abertura${item.open_count === 1 ? '' : 's'}`,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#9B4DAB]/25 bg-gradient-to-br from-[#F9DDFF]/40 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#80298F]">
          Relatório de recursos digitais
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Adoção, tempo de uso e cobertura editorial
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Entenda quais recursos do capítulo foram abertos, por quanto tempo e quais permaneceram
          ignorados neste lote de {n} {pluralSessao(n)}.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-500">
          {VIDEO_METRICS_EXPLANATION}
        </p>
      </section>

      {resources_detail.video_skip_suspected_count > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            Possível pulo no vídeo em {resources_detail.video_skip_suspected_count} de {n}{' '}
            {pluralSessao(n)}
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            A posição no timeline do vídeo ficou muito acima do tempo real no modal — scrubber ou
            velocidade acelerada. O alcance (%) não representa visualização contínua.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Sessões com ODA',
            value: `${engagement_analytics.sessions_with_oda_pct}%`,
            hint:
              resource_analytics.avg_oda_engagement_seconds !== null
                ? `média ${formatDuration(Math.round(resource_analytics.avg_oda_engagement_seconds))} no modal`
                : undefined,
          },
          {
            label: 'Iniciaram vídeo',
            value: `${engagement_analytics.sessions_with_video_pct}%`,
            hint:
              resource_analytics.avg_video_watch_seconds !== null
                ? `média ${formatDuration(Math.round(resource_analytics.avg_video_watch_seconds))} no timeline`
                : undefined,
          },
          {
            label: 'Vídeo concluído',
            value: `${engagement_analytics.sessions_with_video_completed_pct}%`,
            hint:
              resource_analytics.avg_video_max_progress_pct !== null
                ? `alcance médio ${Math.round(resource_analytics.avg_video_max_progress_pct)}% no arquivo`
                : undefined,
          },
          {
            label: 'Zoom em imagens',
            value: `${engagement_analytics.sessions_with_image_zoom_pct}%`,
            hint: `média ${resource_analytics.avg_image_zoom_total} zooms/sessão`,
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
            {kpi.hint ? <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p> : null}
          </div>
        ))}
      </div>

      <Section
        title="Funil de engajamento"
        subtitle="Percentual de sessões em cada etapa — vídeo, ODA, professor e imagens."
      >
        <EngagementRateChart
          items={[
            {
              label: 'Vídeo iniciado',
              pct: engagement_analytics.sessions_with_video_pct,
            },
            {
              label: 'Vídeo concluído',
              pct: engagement_analytics.sessions_with_video_completed_pct,
            },
            {
              label: 'ODA aberto',
              pct: engagement_analytics.sessions_with_oda_pct,
              detail: `média ${resource_analytics.avg_oda_opened} abert./sessão`,
            },
            {
              label: 'Botão do professor',
              pct: engagement_analytics.sessions_with_teacher_pct,
            },
            {
              label: 'Zoom em imagens',
              pct: engagement_analytics.sessions_with_image_zoom_pct,
            },
          ]}
        />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {resources_detail.coverage_resources.length > 0 ? (
          <Section
            title="Cobertura de recursos esperados"
            subtitle="Recursos do manifesto editorial — quantas sessões abriram cada um."
          >
            <ValueBarChart
              items={resources_detail.coverage_resources.map((item) => ({
                label: item.label,
                value: item.sessions_opened,
                hint: `${item.open_pct}% do grupo`,
              }))}
              formatLabel={(sessions, hint) =>
                `${sessions}/${n} sessões${hint ? ` · ${hint}` : ''}`
              }
              barColor="#80298F"
            />
          </Section>
        ) : null}

        {resources_detail.coverage_images.length > 0 ? (
          <Section
            title="Imagens do capítulo"
            subtitle="Exposição e zoom por imagem esperada no manifesto."
          >
            <ul className="space-y-3">
              {resources_detail.coverage_images.map((item) => (
                <li
                  key={item.image_id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="shrink-0 text-slate-500">{item.view_pct}% viram</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    {item.sessions_zoomed}/{item.sessions_viewed} deram zoom · {item.zoom_total}{' '}
                    zoom{item.zoom_total === 1 ? '' : 's'} no total
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {resourceRanking.length > 0 ? (
          <Section title="Ranking de recursos abertos">
            <ValueBarChart
              items={resourceRanking}
              formatLabel={(sessions, hint) =>
                `${sessions}/${n} sessões${hint ? ` · ${hint}` : ''}`
              }
              barColor="#9B4DAB"
            />
          </Section>
        ) : null}

        {imageInteraction.length > 0 ? (
          <Section title="Interação com imagens (% com zoom)">
            <ValueBarChart
              items={imageInteraction}
              formatLabel={(pct, hint) => `${pct}%${hint ? ` · ${hint}` : ''}`}
              barColor="#C084FC"
            />
          </Section>
        ) : null}
      </div>

      {teacherSections.length > 0 ? (
        <Section
          title="Botão do professor por seção"
          subtitle="Material de apoio pedagógico consultado no capítulo."
        >
          <ValueBarChart
            items={teacherSections}
            formatLabel={(sessions, hint) =>
              `${sessions}/${n} sessões${hint ? ` · ${hint}` : ''}`
            }
            barColor="#6B2278"
          />
        </Section>
      ) : null}

      <Section
        title="Detalhe por participante"
        subtitle="Recursos usados e itens do manifesto não acessados em cada sessão."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Participante</th>
                <th className="pb-2 pr-4 font-medium">ODA</th>
                <th className="pb-2 pr-4 font-medium">Vídeo</th>
                <th className="pb-2 pr-4 font-medium">Zooms</th>
                <th className="pb-2 pr-4 font-medium">Recursos ignorados</th>
                <th className="pb-2 font-medium">Imagens não vistas</th>
              </tr>
            </thead>
            <tbody>
              {resources_detail.participants.map((row) => (
                <tr key={`${row.participant_id}:${row.file_name}`} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-[#80298F]">{row.participant_id}</td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.oda_opened
                      ? `Sim · ${formatDuration(row.oda_seconds)}`
                      : 'Não abriu'}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {row.video_played ? (
                      <>
                        {row.video_progress_pct}% no arquivo ·{' '}
                        {formatDuration(row.video_watch_seconds)} no timeline
                        {row.video_playback_wall_seconds > 0
                          ? ` · ${formatDuration(row.video_playback_wall_seconds)} reproduzindo`
                          : ''}
                        {row.escola_seconds > 0
                          ? ` · ${formatDuration(row.escola_seconds)} no modal`
                          : ''}
                        {row.video_seek_count > 0 ? ` · ${row.video_seek_count} pulo(s)` : ''}
                        {row.video_completed ? ' · concluiu' : ''}
                        {row.video_skip_suspected ? (
                          <span className="mt-1 block text-xs font-medium text-amber-700">
                            possível pulo
                          </span>
                        ) : null}
                      </>
                    ) : (
                      'Não iniciou'
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">{row.image_zoom_total}</td>
                  <td className="py-2.5 pr-4 text-xs text-slate-600">
                    {row.resources_missed.length > 0
                      ? row.resources_missed.map(shortResourceId).join(', ')
                      : '—'}
                  </td>
                  <td className="py-2.5 text-xs text-slate-600">
                    {row.images_not_seen.length > 0
                      ? row.images_not_seen.length
                      : 'Todas vistas'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
