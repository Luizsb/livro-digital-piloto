export interface StakeholderCard {
  actor: string;
  emoji: string;
  intro: string;
  benefits: string[];
  mainValue: string;
}

export interface ReportCard {
  title: string;
  /** Tag de categoria alinhada às abas do LD Insights (ex.: Pedagogia, QA). */
  tag: string;
  items: string[];
  usage: string;
  status: 'available' | 'roadmap';
}

export const STAKEHOLDER_CARDS: StakeholderCard[] = [
  {
    actor: 'Empresa',
    emoji: '🏢',
    intro:
      'Para a empresa, o Livro Digital Inteligente transforma o produto em algo com dados de uso concretos.',
    benefits: [
      'Demonstrar evolução do digital',
      'Gerar evidências de uso',
      'Diferenciar o Livro Digital de uma simples reprodução do impresso',
      'Apoiar decisões de produto',
      'Identificar valor real de vídeos, ODAs e recursos interativos',
      'Criar base para dashboards futuros',
      'Fortalecer o papel do DIA LD como ferramenta de produção e inteligência',
    ],
    mainValue:
      'A empresa passa a ter evidências sobre como o Livro Digital é usado e pode evoluir o produto com base em dados reais.',
  },
  {
    actor: 'Escola e coordenação',
    emoji: '🏫',
    intro: 'Para a escola, a inteligência ajuda a acompanhar adoção e qualidade de uso.',
    benefits: [
      'O livro está sendo acessado?',
      'Os capítulos estão sendo percorridos?',
      'Os recursos digitais são usados?',
      'Há problemas técnicos por dispositivo ou navegador?',
      'A experiência funciona melhor em computador, tablet ou celular?',
      'Há turmas com baixa adesão?',
    ],
    mainValue:
      'A escola ganha sinais de adoção, estabilidade e uso do Livro Digital, apoiando decisões de acompanhamento e formação.',
  },
  {
    actor: 'Professor',
    emoji: '👨‍🏫',
    intro: 'Para o professor, os dados ajudam a planejar melhor a aula.',
    benefits: [
      'Páginas com baixa conclusão',
      'Capítulos finalizados rapidamente',
      'Recursos pouco usados',
      'Vídeos não assistidos até o fim',
      'ODAs acessadas ou ignoradas',
      'Pontos do capítulo que podem exigir retomada',
      'Uso do botão do professor',
      'Percepção dos usuários sobre navegação e recursos',
    ],
    mainValue:
      'O professor recebe sinais para planejar retomadas, reforços e mediações, sem tratar os dados como prova automática de aprendizagem.',
  },
  {
    actor: 'Aluno',
    emoji: '🎓',
    intro: 'Para o aluno, o valor aparece na melhoria da experiência.',
    benefits: [
      'Navegação mais clara',
      'Melhor conforto visual',
      'Responsividade em diferentes dispositivos',
      'Vídeos e ODAs mais úteis e bem posicionados',
      'Acessibilidade aprimorada',
      'Organização das páginas',
      'Recursos interativos de maior qualidade',
    ],
    mainValue:
      'O aluno se beneficia de um Livro Digital que evolui com base em como a experiência é realmente usada.',
  },
  {
    actor: 'Equipe editorial e produção',
    emoji: '✏️',
    intro: 'Para a equipe editorial, os dados ajudam a melhorar o livro.',
    benefits: [
      'Páginas pouco concluídas',
      'Páginas com varredura rápida',
      'Imagens que geram zoom',
      'Recursos que não são acessados',
      'Vídeos com baixo progresso',
      'ODAs com pouco tempo de uso',
      'Seções do professor mais consultadas',
      'Problemas de conforto visual relatados no feedback',
    ],
    mainValue:
      'A equipe editorial passa a priorizar melhorias com base em evidências de uso e não apenas em percepção subjetiva.',
  },
  {
    actor: 'Equipe técnica e QA',
    emoji: '📱',
    intro: 'Para tecnologia e QA, os dados ajudam a garantir estabilidade.',
    benefits: [
      'Erros de carregamento',
      'Problemas em imagens',
      'Falhas de recursos',
      'Navegador e dispositivo usados',
      'Viewport e tempo de carregamento',
      'Peso da sessão',
      'Problemas de performance',
      'Qualidade da coleta',
    ],
    mainValue:
      'A equipe técnica consegue corrigir problemas antes de escalar o Livro Digital para uso mais amplo.',
  },
];

export const REPORT_CARDS: ReportCard[] = [
  {
    title: 'Relatório individual da sessão',
    tag: 'Sessão',
    items: [
      'Consolidado: jornada, resumo interpretativo e feedback',
      'Timeline: linha do tempo dos eventos (marcos ou completo)',
      'Recursos digitais: ODA, vídeo, professor, imagens e cobertura',
      'Técnico & QA: performance, erros e qualidade da coleta',
    ],
    usage: 'Validar uma sessão no LD Insights — abas Consolidado, Timeline, Recursos e Técnico.',
    status: 'available',
  },
  {
    title: 'Timeline da sessão',
    tag: 'Debug',
    items: [
      'Sequência cronológica: página → recurso → vídeo → feedback',
      'Modo marcos (demo) ou completo (debugging)',
      'Filtro por categoria: jornada, conteúdo, professor, foco, técnico',
    ],
    usage: 'Aba Timeline no LD Insights (1 sessão) — útil em demo e QA da coleta.',
    status: 'available',
  },
  {
    title: 'Relatório consolidado de grupo ou turma',
    tag: 'Jornada',
    items: [
      'Gráficos de status do capítulo, engajamento e jornada por página',
      'Distribuição por dispositivo, SO e navegador',
      'Feedback agregado com comentários escritos dos participantes',
      'Aba Resumo com IA (Gemini) — narrativa executiva sob demanda',
      'Foco e atenção: saídas da aba e tempo inativo',
      'Abas Retomada pedagógica e Editorial & produto',
      'Exportação JSON, CSV e PDF para escola/BI',
    ],
    usage: 'Transformar várias sessões em uma leitura visual coletiva no LD Insights.',
    status: 'available',
  },
  {
    title: 'Export para escola / BI',
    tag: 'Entrega',
    items: [
      'CSV com KPIs, heatmap por página e tabela de participantes',
      'PDF resumido para enviar sem abrir o dashboard',
      'Respeita o filtro de qualidade ativo no consolidado',
    ],
    usage: 'Menu Exportar no cabeçalho do LD Insights (modo grupo) — JSON, CSV ou PDF.',
    status: 'available',
  },
  {
    title: 'Relatório de retomada pedagógica',
    tag: 'Pedagogia',
    items: [
      'Páginas que merecem retomada (gap, abandono, baixa conclusão)',
      'Recursos ignorados e vídeos com possível pulo',
      'Participantes com sinais de atenção (abandono, gap, ritmo rápido)',
      'Pontos para discussão em aula',
    ],
    usage: 'Aba Retomada pedagógica no LD Insights ao consolidar várias sessões.',
    status: 'available',
  },
  {
    title: 'Relatório de recursos digitais',
    tag: 'Recursos',
    items: [
      'Funil de adoção: vídeo, ODA, professor e zoom',
      'Cobertura dos recursos e imagens do manifesto editorial',
      'Ranking de aberturas e tempo médio nos modais',
      'Detalhe por participante — o que foi ignorado',
    ],
    usage: 'Aba Recursos digitais no LD Insights ao carregar vários JSONs.',
    status: 'available',
  },
  {
    title: 'Relatório editorial e de melhoria do produto',
    tag: 'Produto',
    items: [
      'Backlog sugerido (conteúdo, recurso, UX, técnico)',
      'Páginas para revisão editorial e tempo médio de permanência',
      'Imagens com interação (zoom) e recursos subutilizados',
      'Feedback de navegação, conforto visual e utilidade dos recursos',
      'Experiência por dispositivo (carga e alertas técnicos)',
    ],
    usage: 'Aba Editorial & produto no LD Insights ao consolidar várias sessões.',
    status: 'available',
  },
  {
    title: 'Relatório técnico e QA',
    tag: 'QA',
    items: [
      'Carga, TTFB e peso médio da sessão',
      'Erros de runtime, carregamento e renderização',
      'Dispositivo, SO, navegador e viewport por participante',
      'Checklist QA e qualidade da coleta',
    ],
    usage: 'Aba Técnico & QA no LD Insights ao carregar vários JSONs.',
    status: 'available',
  },
  {
    title: 'Relatório executivo do piloto',
    tag: 'Estratégia',
    items: [
      'Coleta ativa: eventos por dimensão (jornada, recursos, professor, feedback, técnico)',
      'KPIs do grupo, aprendizados e valor para empresa, escola e professor',
      'Limitações da fase e próximos passos sugeridos com base nos dados',
      'Evidências detalhadas na aba Consolidado do LD Insights',
    ],
    usage:
      'Comunicar o valor estratégico do piloto — aba Executivo no LD Insights (vários JSONs).',
    status: 'available',
  },
];
