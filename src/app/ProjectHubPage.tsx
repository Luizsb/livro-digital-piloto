import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { reloadForNewSession } from '@analytics/resetLdStorage';
import { publicUrl } from '@shared/lib/publicUrl';
import { REPORT_CARDS, STAKEHOLDER_CARDS } from '@app/projectHubContent';

const SECTIONS = [
  {
    id: 'visao',
    label: 'Visão geral',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'problema',
    label: 'Por que observar',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3v18M5 8h14M7 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'maturidade',
    label: 'Evolução do livro',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 18h16M7 18V13M12 18V9M17 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'metricas',
    label: 'O que medimos',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'valor',
    label: 'Possibilidades',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 16l5-5 4 3 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 4h7l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 4v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'piloto',
    label: 'Acesso ao piloto',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const PILLARS = [
  {
    title: 'Jornada de leitura',
    desc: 'Quais páginas foram vistas, por quanto tempo e em que ponto a leitura parou.',
    emoji: '📖',
  },
  {
    title: 'Interação com recursos',
    desc: 'Se o aluno abriu vídeos, ampliou imagens ou acessou materiais como ODA e Escola Digital.',
    emoji: '🎯',
  },
  {
    title: 'Uso pelo professor',
    desc: 'Se o material de apoio pedagógico foi consultado e por quanto tempo.',
    emoji: '👩‍🏫',
  },
  {
    title: 'Percepção do participante',
    desc: 'O que a pessoa achou da navegação, do visual e dos recursos disponíveis.',
    emoji: '💬',
  },
  {
    title: 'Experiência técnica',
    desc: 'Se o capítulo carregou bem, em qual dispositivo e se houve erros durante o uso.',
    emoji: '⚙️',
  },
] as const;

const MATURITY_STAGES = [
  {
    level: 'Impresso',
    title: 'Livro em papel',
    desc: 'O conteúdo existe, mas não sabemos como é lido, onde há dúvida ou quais partes geram mais interesse.',
    current: false,
  },
  {
    level: 'Digital simples',
    title: 'Livro digital básico',
    desc: 'O mesmo conteúdo em tela. Acesso mais fácil, mas ainda sem recursos interativos nem visibilidade de uso.',
    current: false,
  },
  {
    level: 'Interativo',
    title: 'Livro digital interativo',
    desc: 'Vídeos, ODAs, botões e recursos embutidos. O livro ganha profundidade, mas ainda não revela como é usado.',
    current: false,
  },
  {
    level: 'Inteligente',
    title: 'Livro digital inteligente',
    desc: 'Registra eventos de uso, gera relatórios e permite entender a jornada real — este é o estágio do piloto atual.',
    current: true,
  },
] as const;

function HubIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
      {children}
    </h2>
  );
}

function BenefitItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F9DDFF] text-[#80298F]"
        aria-hidden
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

export interface ProjectHubPageProps {
  participantNumber: string;
  onParticipantNumberChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  error: string;
  /** Quando o participante já entrou — mostra atalho para o capítulo. */
  participantId?: string | null;
}

export default function ProjectHubPage({
  participantNumber,
  onParticipantNumberChange,
  onSubmit,
  error,
  participantId,
}: ProjectHubPageProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('visao');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 320);

      if (scrollY < 80) {
        setActiveSection('visao');
        return;
      }

      const offset = scrollY + 120;
      for (const section of SECTIONS) {
        if (section.id === 'visao') continue;
        const element = document.getElementById(section.id);
        if (
          element &&
          element.offsetTop <= offset &&
          element.offsetTop + element.offsetHeight > offset
        ) {
          setActiveSection(section.id);
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('visao');
  };

  const scrollTo = (id: SectionId) => {
    if (id === 'visao') {
      scrollToTop();
      return;
    }
    const element = document.getElementById(id);
    if (!element) return;
    window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans selection:bg-[#F9DDFF]">
      <header className="sticky top-0 z-20 border-b border-[#80298F]/15 bg-gradient-to-r from-[#80298F] to-[#9B4DAB] text-white shadow-md">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <HubIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Projeto piloto
              </p>
              <p className="truncate text-sm font-bold md:text-base">
                Livro Digital Inteligente
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {participantId ? (
              <a
                href="#/"
                className="rounded-lg border border-white/35 bg-white px-3 py-2 text-xs font-semibold text-[#80298F] transition hover:bg-[#F9DDFF] md:text-sm"
              >
                Continuar piloto
              </a>
            ) : (
              <button
                type="button"
                onClick={() => scrollTo('piloto')}
                className="rounded-lg border border-white/35 bg-white px-3 py-2 text-xs font-semibold text-[#80298F] transition hover:bg-[#F9DDFF] md:text-sm"
              >
                Acesso ao piloto
              </button>
            )}
            <a
              href="#/dashboard"
              className="rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 md:text-sm"
            >
              LD Insights
            </a>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-[73px] lg:block lg:h-[calc(100vh-73px)] lg:overflow-y-auto xl:w-72">
          <nav className="space-y-2 p-4">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Navegação
            </p>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] transition ${
                  activeSection === section.id
                    ? 'bg-[#80298F] font-semibold text-white shadow-md shadow-[#80298F]/20'
                    : 'font-medium text-slate-700 hover:bg-[#F9DDFF]/60 hover:text-[#80298F]'
                }`}
              >
                {section.icon}
                <span className="leading-snug">{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 bg-slate-100 px-4 py-8 md:px-8 md:py-10 lg:px-10 xl:px-12">
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeSection === section.id
                    ? 'bg-[#80298F] text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          <section id="visao" className="scroll-mt-24 pb-16">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F9DDFF] px-3 py-1 text-xs font-semibold text-[#80298F]">
              Piloto cap. 07
            </span>
            <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Livro Digital
              <br />
              <span className="text-[#80298F]">Inteligente</span>
            </h1>
            <blockquote className="max-w-5xl border-l-4 border-[#80298F] py-1 pl-5">
              <p className="text-lg leading-relaxed text-slate-600 md:text-xl">
                Este projeto cria uma camada invisível sobre o livro digital que registra como ele é
                usado na prática — sem alterar o conteúdo oficial. A ideia é simples: quando
                entendemos a jornada de leitura, as interações e a experiência técnica, o livro
                deixa de ser apenas uma versão digital do impresso e passa a ser uma{' '}
                <strong className="font-semibold text-slate-800">
                  experiência inteligente, mensurável e evolutiva
                </strong>
                .
              </p>
            </blockquote>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
              O piloto atual testa essa camada no capítulo 07 de História. Os dados coletados
              alimentam o <strong className="text-slate-700">LD Insights</strong>, onde é possível
              analisar sessões individuais ou consolidar um grupo de teste.
            </p>
          </section>

          <section id="problema" className="scroll-mt-24 border-t border-slate-200 py-16">
            <SectionTitle>1. Por que observar o uso do livro?</SectionTitle>
            <p className="mb-8 max-w-3xl text-slate-600">
              Hoje sabemos que o livro foi entregue. Mas, na maior parte do tempo, não sabemos como
              ele é vivido: se o aluno percorre o capítulo inteiro, se o professor consulta o material
              de apoio, se os vídeos são assistidos ou se a experiência trava no celular.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-3 text-lg font-bold text-slate-800">Sem observação</h3>
                <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                  Decisões sobre conteúdo, recursos e tecnologia dependem de suposições. Não há como
                  saber o que funciona, o que gera atrito ou o que merece mais investimento.
                </p>
              </div>
              <div className="rounded-2xl border border-[#80298F]/20 bg-[#F9DDFF]/40 p-6">
                <h3 className="mb-3 text-lg font-bold text-[#80298F]">Com o livro inteligente</h3>
                <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                  O livro passa a gerar sinais de uso — navegação, interação, percepção e saúde
                  técnica — que podem ser analisados no{' '}
                  <strong className="text-[#80298F]">LD Insights</strong> para orientar melhorias
                  em todas as frentes.
                </p>
              </div>
            </div>
          </section>

          <section id="maturidade" className="scroll-mt-24 border-t border-slate-200 py-16">
            <SectionTitle>2. A evolução do livro</SectionTitle>
            <p className="mb-8 max-w-3xl text-slate-600">
              O livro passou por etapas claras de maturidade. Cada uma acrescenta uma capacidade
              nova — e o piloto atual representa o estágio em que o livro não só interage, como
              também pode ser observado e melhorado com base em dados.
            </p>
            <div className="space-y-3">
              {MATURITY_STAGES.map((stage, index) => (
                <div
                  key={stage.level}
                  className={`flex gap-4 rounded-2xl border p-5 md:items-center ${
                    stage.current
                      ? 'border-[#80298F] bg-[#80298F] text-white shadow-lg shadow-[#80298F]/15'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      stage.current
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        stage.current ? 'text-[#F9DDFF]' : 'text-slate-400'
                      }`}
                    >
                      {stage.current ? 'Piloto atual' : stage.level}
                    </p>
                    <h4 className={`mt-1 font-bold ${stage.current ? 'text-white' : 'text-slate-800'}`}>
                      {stage.title}
                    </h4>
                    <p
                      className={`mt-1 text-sm leading-relaxed ${
                        stage.current ? 'text-white/90' : 'text-slate-600'
                      }`}
                    >
                      {stage.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="metricas" className="scroll-mt-24 border-t border-slate-200 py-16">
            <SectionTitle>3. O que o piloto observa</SectionTitle>
            <p className="mb-4 max-w-3xl text-slate-600">
              O piloto não busca medir aprendizagem — isso virá em etapas futuras. O foco agora é
              entender <strong className="text-slate-800">como o livro é usado</strong>: o que é
              lido, o que é clicado, o que trava e o que o participante percebe da experiência.
            </p>
            <p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-500">
              Esses sinais são registrados como eventos ao longo da sessão e podem ser exportados
              para análise no LD Insights.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {PILLARS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <h4 className="mt-3 font-bold text-slate-800">{item.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 text-amber-950">
              <h4 className="font-bold">Limite desta fase</h4>
              <p className="mt-2 text-sm leading-relaxed">
                Tempo na página ou cliques em recursos <strong>não significam aprendizagem</strong>.
                Nesta etapa, observamos comportamento de uso — a camada de atividades cognitivas
                virá depois, com validação pedagógica e jurídica.
              </p>
            </div>
          </section>

          <section id="valor" className="scroll-mt-24 border-t border-slate-200 py-16">
            <SectionTitle>4. O que isso pode gerar</SectionTitle>
            <p className="mb-3 max-w-3xl text-slate-600">
              Quando o livro digital se torna inteligente, diferentes áreas ganham uma base comum para
              conversar sobre o que está funcionando e o que precisa evoluir.
            </p>
            <h3 className="mb-6 text-lg font-bold text-[#80298F]">Para quem o livro inteligente serve</h3>
            <div className="grid items-stretch gap-6 lg:grid-cols-2">
              {STAKEHOLDER_CARDS.map((item) => (
                <article
                  key={item.actor}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-[#F9DDFF]/40 to-white px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-[#80298F]/10">
                        {item.emoji}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-slate-900">{item.actor}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.intro}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-6 py-5">
                    <div className="flex-1">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        O que passa a ser possível
                      </p>
                      <ul className="space-y-2.5">
                        {item.benefits.map((benefit) => (
                          <BenefitItem key={benefit}>{benefit}</BenefitItem>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8 rounded-xl border-l-4 border-[#80298F] bg-[#F9DDFF]/35 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#80298F]">
                        Valor principal
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.mainValue}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
              <div className="bg-gradient-to-r from-[#80298F] via-[#9B4DAB] to-slate-900 px-6 py-5 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Do evento à decisão
                </p>
                <h3 className="mt-2 text-xl font-bold md:text-2xl">
                  Como um sinal de uso vira informação útil
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  Cada interação registrada no livro segue um caminho: do registro bruto até uma
                  leitura que pode orientar uma melhoria concreta.
                </p>
              </div>
              <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:px-8 md:py-8">
                {[
                  {
                    title: '1. Evento',
                    value: 'O aluno abre uma página',
                    example: 'page_viewed',
                  },
                  {
                    title: '2. Métrica',
                    value: 'Quanto tempo ficou, se voltou, se abandonou',
                    example: 'tempo visível · abandono',
                  },
                  {
                    title: '3. Indicador',
                    value: 'Padrão de engajamento ou atrito no capítulo',
                    example: 'heatmap · profundidade',
                  },
                  {
                    title: '4. Insight',
                    value: 'O que o dado sugere sobre a experiência',
                    example: 'página com abandono alto',
                  },
                  {
                    title: '5. Ação',
                    value: 'Decisão possível a partir do insight',
                    example: 'revisar conteúdo ou recurso',
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className={`rounded-2xl border border-white/10 p-4 ${
                      index === 4 ? 'bg-[#80298F]' : 'bg-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                      {step.title}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-relaxed">{step.value}</p>
                    <p className="mt-2 text-xs text-white/50">{step.example}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="relatorios" className="scroll-mt-24 border-t border-slate-200 py-16">
            <SectionTitle>5. Relatórios que podem nascer dessa camada</SectionTitle>
            <p className="mb-8 max-w-3xl text-slate-600">
              A partir dos eventos coletados, é possível montar diferentes leituras — da sessão
              individual até uma visão executiva do piloto. O{' '}
              <strong className="text-slate-800">LD Insights</strong> já cobre relatório individual e
              consolidado de grupo; os demais representam evoluções naturais da mesma base de dados.
            </p>
            <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
              {REPORT_CARDS.map((report) => (
                <article
                  key={report.title}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#80298F]/25 hover:shadow-md"
                >
                  <div
                    className={`h-1.5 ${report.status === 'available' ? 'bg-[#80298F]' : 'bg-slate-200'}`}
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900">
                        {report.title}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          report.status === 'available'
                            ? 'bg-[#80298F] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {report.status === 'available' ? 'LD Insights' : 'Em evolução'}
                      </span>
                    </div>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {report.items.map((item) => (
                        <BenefitItem key={item}>{item}</BenefitItem>
                      ))}
                    </ul>
                    <div className="mt-8 rounded-xl border-l-4 border-[#80298F]/40 bg-slate-50 px-4 py-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Uso principal
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.usage}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="piloto" className="scroll-mt-24 border-t border-slate-200 py-16 pb-24">
            <SectionTitle>6. Acesso ao piloto</SectionTitle>
            <p className="mb-8 max-w-2xl text-slate-600">
              Informe seu código de participante para abrir o capítulo piloto, acompanhar eventos em
              tempo real e exportar o JSON para o dashboard LD Insights.
            </p>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
                <h3 className="text-lg font-bold text-[#80298F]">Entrar na sessão de teste</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Código anônimo (P01, P02…) — sem nome nem e-mail.
                </p>

                {participantId ? (
                  <div className="mt-6 space-y-4">
                    <p className="rounded-lg bg-[#F9DDFF]/50 px-4 py-3 text-sm text-slate-700">
                      Sessão ativa como <strong className="text-[#80298F]">{participantId}</strong>.
                    </p>
                    <a
                      href="#/"
                      className="flex w-full items-center justify-center rounded-lg bg-[#80298F] px-4 py-3 font-semibold text-white transition hover:bg-[#6b2278]"
                    >
                      Continuar no capítulo
                    </a>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-slate-800">
                      Código do participante
                      <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-[#80298F] focus-within:ring-2 focus-within:ring-[#80298F]/30">
                        <span className="flex items-center bg-slate-100 px-4 text-lg font-semibold tracking-wide text-[#80298F]">
                          P
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={participantNumber}
                          onChange={(e) =>
                            onParticipantNumberChange(e.target.value.replace(/\D/g, '').slice(0, 2))
                          }
                          placeholder="01"
                          maxLength={2}
                          autoComplete="off"
                          className="w-full border-0 px-4 py-3 text-lg tracking-wide focus:outline-none"
                        />
                      </div>
                    </label>
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#80298F] px-4 py-3 font-semibold text-white transition hover:bg-[#6b2278]"
                    >
                      Entrar no capítulo
                    </button>
                  </form>
                )}

                <p className="mt-4 text-center text-xs text-slate-500">
                  Dados antigos na mesma aba?{' '}
                  <button
                    type="button"
                    className="font-semibold text-[#80298F] underline hover:no-underline"
                    onClick={() => reloadForNewSession()}
                  >
                    Limpar e começar de novo
                  </button>
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="#/dashboard"
                  className="flex flex-col rounded-2xl border border-[#80298F]/25 bg-gradient-to-br from-[#F9DDFF]/60 to-white p-6 shadow-sm transition hover:border-[#80298F]/50 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#80298F]">
                    Relatórios
                  </span>
                  <span className="mt-2 text-xl font-bold text-slate-900">LD Insights</span>
                  <p className="mt-2 text-sm text-slate-600">
                    Carregue o JSON exportado — sessão individual ou grupo de teste com heatmap e KPIs
                    agregados.
                  </p>
                  <span className="mt-4 text-sm font-semibold text-[#80298F]">Abrir dashboard →</span>
                </a>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Durante a leitura
                  </span>
                  <p className="mt-2 font-bold text-slate-900">Eventos em tempo real</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Após entrar no capítulo, use o botão{' '}
                    <strong className="text-slate-800">Ver eventos</strong> no canto inferior para
                    acompanhar a coleta ao vivo, exportar JSON e finalizar o teste.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    <strong className="text-slate-800">Capítulo piloto:</strong> História · cap. 07
                    <br />
                    <strong className="text-slate-800">Livro:</strong> cap07_historia_ai43
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 p-3 transition-all hover:scale-110"
          title="Voltar ao topo"
        >
          <img src={publicUrl('images/setaTopo.svg')} alt="Voltar ao topo" />
        </button>
      ) : null}
    </div>
  );
}
