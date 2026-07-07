/** Dimensões de coleta ativas no piloto — referência para o relatório executivo. */
export const PILOT_COLLECTION_LAYERS = [
  {
    pillar: 'Jornada de leitura',
    events: [
      'page_viewed',
      'page_completed',
      'chapter_finished',
      'chapter_completed',
      'session_finished',
    ],
  },
  {
    pillar: 'Recursos digitais',
    events: [
      'resource_opened',
      'resource_engagement_recorded',
      'video_started',
      'video_progress_recorded',
      'video_completed',
      'image_viewed',
      'image_zoomed',
    ],
  },
  {
    pillar: 'Material do professor',
    events: ['teacher_button_opened', 'teacher_button_closed'],
  },
  {
    pillar: 'Percepção do participante',
    events: ['feedback_submitted'],
  },
  {
    pillar: 'Experiência técnica',
    events: [
      'session_started',
      'resource_timing_snapshot',
      'image_load_error',
      'asset_load_error',
      'runtime_error',
    ],
  },
] as const;

export const PILOT_EXECUTIVE_LIMITATIONS = [
  'Dados ficam no navegador até o export manual — não há painel de turma automático.',
  'Código anônimo (P01, P02…) — não vincula à matrícula escolar.',
  'Um capítulo piloto (História 4º, cap. 07) — generalização depende de portar o tracking.',
  'Tempo na página e cliques não medem aprendizagem ou compreensão.',
  'Agregação multi-sessão exige carregar os JSONs no LD Insights.',
] as const;
