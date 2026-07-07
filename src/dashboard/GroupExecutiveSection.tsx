import type { GroupReport } from './types';
import { formatDuration } from './reportExtractors';
import { pluralParticipante, pluralSessao } from '@shared/lib/pluralizePt';
import {
  PILOT_COLLECTION_LAYERS,
  PILOT_EXECUTIVE_LIMITATIONS,
} from './pilotCollectionCatalog';

function buildNextSteps(report: GroupReport): string[] {
  const steps: string[] = [];
  const { resource_analytics, engagement_analytics, technical_analytics, data_quality } = report;
  const n = report.valid_sessions_count;

  if (resource_analytics.sessions_with_oda_pct < 50) {
    steps.push(
      'Reposicionar ou sinalizar melhor a ODA — menos da metade das sessões abriu o recurso.',
    );
  }
  if (resource_analytics.sessions_with_video_play_pct < 50) {
    steps.push('Investigar baixa adoção do vídeo da Escola Digital no capítulo.');
  }
  if (engagement_analytics.sessions_with_teacher_pct < 40) {
    steps.push('Reforçar o uso do botão do professor com orientação na aplicação do teste.');
  }
  if (report.summary.partial_view_pct > 30) {
    steps.push('Analisar páginas com abandono alto para retomada pedagógica.');
  }
  if (technical_analytics.sessions_with_technical_issues > 0) {
    steps.push(
      `Corrigir alertas técnicos em ${technical_analytics.sessions_with_technical_issues} ${pluralSessao(technical_analytics.sessions_with_technical_issues)} antes de escalar.`,
    );
  }
  if (data_quality.reliable_session_count < n) {
    steps.push('Filtrar sessões com qualidade da coleta abaixo do limiar antes de conclusões definitivas.');
  }
  if (steps.length === 0) {
    steps.push('Expandir o piloto para mais turmas e capítulos com o mesmo modelo de coleta.');
    steps.push('Conectar ingestão automática de JSONs (backend ou BI) para painel contínuo.');
  } else {
    steps.push('Evoluir para relatórios de retomada pedagógica e editorial com a mesma base de eventos.');
  }

  return steps.slice(0, 4);
}

function buildStakeholderEvidence(report: GroupReport) {
  const n = report.valid_sessions_count;
  const {
    summary,
    resource_analytics,
    engagement_analytics,
    feedback_analytics,
    technical_analytics,
    data_quality,
  } = report;

  return [
    {
      actor: 'Empresa',
      emoji: '🏢',
      bullets: [
        `${n} ${pluralSessao(n)} com evidência de uso real do capítulo digital.`,
        `${resource_analytics.sessions_with_oda_pct}% abriram ODA · ${resource_analytics.sessions_with_video_play_pct}% iniciaram vídeo.`,
        `Qualidade média da coleta: ${data_quality.avg_data_quality_score ?? '—'}/100.`,
        'Base para decisões de produto, DIA LD e investimento em recursos interativos.',
      ],
    },
    {
      actor: 'Escola e coordenação',
      emoji: '🏫',
      bullets: [
        `${summary.full_completion_pct}% concluíram 100% das páginas com tempo mínimo.`,
        `Taxa média de conclusão por página: ${summary.avg_completion_rate}%.`,
        `${technical_analytics.sessions_with_technical_issues} ${pluralSessao(technical_analytics.sessions_with_technical_issues)} com alerta técnico.`,
        'Sinais de adoção, estabilidade e perfil de dispositivo para acompanhamento.',
      ],
    },
    {
      actor: 'Professor',
      emoji: '👨‍🏫',
      bullets: [
        `${engagement_analytics.sessions_with_teacher_pct}% usaram o botão do professor.`,
        `${engagement_analytics.sessions_with_image_zoom_pct}% ampliaram imagens do capítulo.`,
        feedback_analytics.avg_rating !== null
          ? `Nota média de feedback: ${feedback_analytics.avg_rating.toFixed(1)}/5.`
          : 'Feedback ainda não disponível em todas as sessões.',
        'Indícios para retomada em aula — sem inferir aprendizagem automaticamente.',
      ],
    },
  ];
}

export function GroupExecutiveSection({
  report,
  onOpenConsolidated,
}: {
  report: GroupReport;
  onOpenConsolidated?: () => void;
}) {
  const n = report.valid_sessions_count;
  if (n === 0) return null;

  const learnings = report.insights.filter(
    (line) => !line.startsWith('Carregue ao menos') && !line.startsWith('Estes indicadores descrevem'),
  );
  const stakeholderCards = buildStakeholderEvidence(report);
  const nextSteps = buildNextSteps(report);

  const topAbandon = [...report.page_analytics.heatmap]
    .filter((p) => p.abandonmentCount > 0)
    .sort((a, b) => b.abandonmentCount - a.abandonmentCount)[0];

  return (
    <section
      id="relatorio-executivo"
      className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#80298F]/25 bg-gradient-to-br from-[#F9DDFF]/50 via-white to-white shadow-lg"
    >
      <div className="border-b border-[#80298F]/15 bg-[#80298F] px-6 py-5 text-white md:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#F9DDFF]">
          Relatório executivo do piloto
        </p>
        <h2 className="mt-1 text-2xl font-bold md:text-3xl">
          Capítulo {report.chapter_id} · {report.book_id}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/90">
          Síntese estratégica gerada a partir de {report.participants_count}{' '}
          {pluralParticipante(report.participants_count)} e {n} {pluralSessao(n)} válida
          {n === 1 ? '' : 's'} — evidências detalhadas nas seções abaixo.
        </p>
        <p className="mt-2 text-xs text-white/70">
          Gerado em {report.generated_at_br}
        </p>
      </div>

      <div className="space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: 'Participantes',
              value: String(report.participants_count),
            },
            {
              label: 'Conclusão plena',
              value: `${report.summary.full_completion_pct}%`,
            },
            {
              label: 'Tempo visível (média)',
              value: formatDuration(report.summary.avg_visible_time_seconds),
            },
            {
              label: 'Nota média',
              value:
                report.feedback_analytics.avg_rating !== null
                  ? `${report.feedback_analytics.avg_rating.toFixed(1)}/5`
                  : '—',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-[#80298F]/15 bg-white px-4 py-3 text-center shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-1 text-xl font-bold text-[#80298F]">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Coleta ativa no piloto</h3>
            <p className="mt-1 text-sm text-slate-600">
              O que foi implementado e quais eventos estão registrando uso.
            </p>
            <ul className="mt-4 space-y-3">
              {PILOT_COLLECTION_LAYERS.map((layer) => (
                <li
                  key={layer.pillar}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="font-semibold text-slate-800">{layer.pillar}</p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-slate-500">
                    {layer.events.join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Principais aprendizados</h3>
            <p className="mt-1 text-sm text-slate-600">
              Padrões observados neste lote — comportamento de uso, não aprendizagem.
            </p>
            <ul className="mt-4 space-y-2.5">
              {learnings.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#80298F]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {topAbandon ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Ponto de atenção: página {topAbandon.page} concentrou abandono (
                {topAbandon.abandonmentCount} {pluralSessao(topAbandon.abandonmentCount)}).
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Valor estratégico por público</h3>
          <p className="mt-1 text-sm text-slate-600">
            Como os dados deste piloto respondem a empresa, escola e professor.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {stakeholderCards.map((card) => (
              <article
                key={card.actor}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="flex items-center gap-2 font-bold text-slate-900">
                  <span aria-hidden>{card.emoji}</span>
                  {card.actor}
                </p>
                <ul className="mt-3 space-y-2">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="text-sm leading-relaxed text-slate-600">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="font-bold text-slate-900">Limitações atuais</h3>
            <ul className="mt-3 space-y-2">
              {PILOT_EXECUTIVE_LIMITATIONS.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[#80298F]/20 bg-[#F9DDFF]/30 p-4">
            <h3 className="font-bold text-[#80298F]">Próximos passos sugeridos</h3>
            <ul className="mt-3 space-y-2">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="font-bold text-[#80298F]" aria-hidden>
                    →
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-[#80298F]/10 pt-6">
          <p className="text-center text-xs text-slate-500">
            Para gráficos, tabelas comparativas e qualidade da coleta, abra o relatório consolidado.
          </p>
          {onOpenConsolidated ? (
            <button
              type="button"
              onClick={onOpenConsolidated}
              className="rounded-lg bg-[#80298F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b2278]"
            >
              Ver relatório consolidado →
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
