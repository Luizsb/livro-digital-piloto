export interface StakeholderCard {
  actor: string;
  emoji: string;
  intro: string;
  benefits: string[];
  mainValue: string;
}

export interface ReportCard {
  title: string;
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
    items: [
      'Gráfico de jornada por página (visualizada vs concluída)',
      'Progresso no capítulo com páginas sem tempo suficiente',
      'Engajamento com vídeo, ODA, professor e zoom',
      'Ambiente de acesso (dispositivo, SO, navegador)',
      'Feedback com notas, dimensões e comentário escrito',
      'Saúde técnica e qualidade da coleta',
    ],
    usage: 'Validar uma sessão e entender a experiência de um participante.',
    status: 'available',
  },
  {
    title: 'Relatório consolidado de grupo ou turma',
    items: [
      'Gráficos de status do capítulo, engajamento e jornada por página',
      'Distribuição por dispositivo, SO e navegador',
      'Feedback agregado com comentários escritos dos participantes',
      'Foco e atenção: saídas da aba e tempo inativo',
      'Tempo em ODA, progresso de vídeo e pontos de abandono',
      'Exportação do JSON consolidado para arquivo',
    ],
    usage: 'Transformar várias sessões em uma leitura visual coletiva no LD Insights.',
    status: 'available',
  },
  {
    title: 'Relatório de retomada pedagógica',
    items: [
      'Páginas que merecem retomada',
      'Páginas com muita visualização e baixa conclusão',
      'Recursos ignorados e vídeos não concluídos',
      'ODAs pouco usadas e capítulos com leitura muito rápida',
      'Pontos para discussão em aula',
    ],
    usage: 'Apoiar o planejamento da próxima aula.',
    status: 'roadmap',
  },
  {
    title: 'Relatório de recursos digitais',
    items: [
      'Imagens expostas e ampliadas',
      'Recursos abertos e tempo em ODA / Escola Digital',
      'Play, progresso e conclusão de vídeo',
      'Recursos pouco acessados',
    ],
    usage:
      'Entender quais recursos digitais agregam valor e quais precisam ser reposicionados ou revisados.',
    status: 'roadmap',
  },
  {
    title: 'Relatório editorial e de melhoria do produto',
    items: [
      'Páginas com baixa conclusão ou leitura rápida',
      'Imagens que geram interação',
      'Recursos ignorados e vídeos com baixo progresso',
      'Feedback sobre conforto visual',
      'Problemas por tipo de dispositivo',
    ],
    usage: 'Criar backlog de melhoria editorial e digital com base em evidências.',
    status: 'roadmap',
  },
  {
    title: 'Relatório técnico e QA',
    items: [
      'Tempo de carregamento, TTFB e peso carregado',
      'Erros de imagem, recurso e execução',
      'Dispositivo, navegador, viewport e idioma',
      'Qualidade da coleta',
    ],
    usage: 'Validar estabilidade, performance e compatibilidade do Livro Digital.',
    status: 'roadmap',
  },
  {
    title: 'Relatório executivo do piloto',
    items: [
      'O que foi implementado e quais eventos estão ativos',
      'Dimensões já medidas e principais aprendizados',
      'Valor para professor, escola e empresa',
      'Limitações atuais, próximos passos e evidências do dashboard',
    ],
    usage: 'Comunicar o valor estratégico do piloto de forma objetiva.',
    status: 'roadmap',
  },
];
