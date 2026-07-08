import type { ParsedDashboardReport } from './types';
import { extractZoomedImageIds } from './reportExtractors';
import { VIDEO_METRICS_EXPLANATION } from '@analytics/metricDisplayLabels';
import {
  SessionEngagementSection,
} from './SessionVisualBlocks';
import { ChapterCoverageSection, DashboardSection } from './reportUi';

export function SessionResourcesReport({ parsed }: { parsed: ParsedDashboardReport }) {
  const { summary, events, chapterManifest } = parsed;
  const zoomedImages = extractZoomedImageIds(events);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#9B4DAB]/25 bg-gradient-to-br from-[#F9DDFF]/40 via-white to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#80298F]">
          Recursos digitais
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Uso de ODA, vídeo, professor e imagens</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Aberturas, tempo nos modais e cobertura do inventário editorial nesta sessão.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-500">
          {VIDEO_METRICS_EXPLANATION}
        </p>
      </section>

      <SessionEngagementSection summary={summary} />
      <ChapterCoverageSection summary={summary} chapterManifest={chapterManifest} />

      <DashboardSection title="Imagens no capítulo">
        <p className="mb-4 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Exposição</span> (`image_viewed`) não é
          atenção — <span className="font-medium text-slate-700">zoom</span> indica interação
          intencional.
        </p>
        <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Imagens expostas</dt>
            <dd className="font-semibold text-[#80298F]">
              {typeof summary.expected_images_count === 'number' && summary.expected_images_count > 0
                ? `${summary.images_viewed_unique_count}/${summary.expected_images_count}`
                : summary.images_viewed_unique_count}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Imagens com zoom</dt>
            <dd className="font-semibold text-[#80298F]">{summary.image_zoom_unique_count}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total de zooms</dt>
            <dd className="font-semibold text-[#80298F]">{summary.image_zoom_total}</dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Imagens expostas</h3>
            <ul className="space-y-1 text-sm text-slate-700">
              {summary.images_viewed_unique.length > 0 ? (
                summary.images_viewed_unique.map((id) => (
                  <li key={id} className="rounded bg-slate-50 px-2 py-1 font-mono text-xs">
                    {id}
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Nenhuma</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Com zoom</h3>
            <ul className="space-y-1 text-sm text-slate-700">
              {zoomedImages.length > 0 ? (
                zoomedImages.map((id) => (
                  <li key={id} className="rounded bg-slate-50 px-2 py-1 font-mono text-xs">
                    {id}
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Nenhuma</li>
              )}
            </ul>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title="Botão do professor">
        {summary.teacher_button_opened_count > 0 ? (
          <>
            <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-500">Aberturas totais</dt>
                <dd className="font-semibold text-[#80298F]">{summary.teacher_button_opened_count}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Seções diferentes</dt>
                <dd className="font-semibold text-[#80298F]">{summary.teacher_button_unique_count}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tempo total aberto</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.teacher_button_total_seconds}s
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Mais acessado</dt>
                <dd className="font-semibold text-[#80298F]">
                  {summary.most_opened_teacher_section ? (
                    <>
                      Pág. {summary.most_opened_teacher_section.page} —{' '}
                      {summary.most_opened_teacher_section.open_count} abert.
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Página</th>
                    <th className="px-4 py-3">Seção</th>
                    <th className="px-4 py-3">Aberturas</th>
                    <th className="px-4 py-3">Tempo total</th>
                    <th className="px-4 py-3">Média</th>
                    <th className="px-4 py-3">Repetiu?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.teacher_button_usage_by_section.map((row) => (
                    <tr key={row.section_id} className="text-slate-700">
                      <td className="px-4 py-3 font-medium">{row.page}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.section_id}</td>
                      <td className="px-4 py-3">{row.open_count}</td>
                      <td className="px-4 py-3">{row.total_seconds}s</td>
                      <td className="px-4 py-3">
                        {row.avg_seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s
                      </td>
                      <td className="px-4 py-3">{row.opened_more_than_once ? 'Sim' : 'Não'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Botão do professor não foi aberto nesta sessão.</p>
        )}
      </DashboardSection>
    </div>
  );
}
