import { useState } from 'react';
import { publicUrl } from '../lib/publicUrl';
import Poster from './Poster';
import Chapter from './Chapter';
import TeacherButton from './TeacherButton';
import Header from './Header';
import BookPageTracker from './BookPageTracker';
import { chapterQuestions } from '../data/questions';
import Pagination from './Pagination';
import CaixaTexto from './CaixaTexto';
import QuestionRenderer from './QuestionRenderer';
import ContinuaProximaPagina from './ContinuaProximaPagina';
import CriteriosAvaliacao from './CriteriosAvaliacao';
import ChapterFeedback from './ChapterFeedback';
import Footer from './Footer';
import { useUserAnswers } from '../hooks/useUserAnswers';
import { usePagination } from '../hooks/usePagination';
import { useScrollPosition } from '../hooks/useScrollPosition';
import ScrollPageIndicator from './ScrollPageIndicator';
import { TeacherAnswers } from './TeacherAnswers';
import ConversaVai from './ConversaVai';
import ConversaVem from './ConversaVem';
import EscolaDigital from './EscolaDigital';
import ParaSaberMais from './ParaSaberMais';
import OrganizandoConhecimentos from './OrganizandoConhecimentos';
import SaberesAcao from './SaberesAcao';
import TestandoIdeias from './TestandoIdeias';
import AgoraVoceJaSabe from './AgoraVoceJaSabe';
import GameModal from './GameModal';
import TrackedImage from './TrackedImage';
import OdaSAE26_AI43_HIS_C07_OA1 from '../ODAS/SAE26_AI43_HIS_C07_OA1';

// Controle de visibilidade do botão do professor
// Altere para false para ocultar todos os botões "Para o Professor"
const SHOW_TEACHER_BUTTON = true;

function Book() {
  const { userAnswers, handleAnswerChange } = useUserAnswers();
  const { currentPage, scrollToTop } = usePagination();
  const [showTeacherView] = useState(false);
  const getQuestionById = (
    chapterKey: keyof typeof chapterQuestions,
    questionId: string,
    occurrence = 0
  ) => chapterQuestions[chapterKey].filter((question) => question.id === questionId)[occurrence];

  // Restaura a posição de scroll salva
  useScrollPosition();

  return (
    <div className="min-h-screen w-full bg-gray-200">
      <ScrollPageIndicator />
      {/* Sem overflow-hidden: a bandeira da paginação não pode ser cortada pela borda da coluna */}
      <div
        className="mx-auto w-full overflow-visible bg-white shadow-2xl md:max-w-[63%]"
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
      >
        <Header />
        <BookPageTracker />
        {/* Paginação */}
        <Pagination currentPage={currentPage} />
        {/* Conteúdo das imagens da capa */}
        <Poster />
        <div className="p-8 md:p-12">
          <EscolaDigital />
          {/* Conteúdo do botão do professor */}
          <div className="my-6">
            <TeacherButton
              visible={SHOW_TEACHER_BUTTON}
              page={3}
              content={
                <>
                  <p className="mb-3" style={{ fontFamily: 'Ubuntu, sans-serif', color: '#000000', fontSize: '16px' }}>
                    EF04HI06, EF04HI07. Incentive os alunos a compartilhar experiências sobre feiras e trocas.
                    Promova a leitura coletiva da imagem e conduza um debate sobre as formas de comércio do
                    passado e do presente. Confira mais orientações no <strong>Manual do professor</strong>.
                  </p>
                  <ul className="list-disc marker:text-[#80298F] ml-6">
                    <li>Espera-se que os alunos citem roupas, objetos,
                      modo de preservação das mercadorias etc.</li>
                    <li>Ritmos do cotidiano, ausência de tecnolo</li>
                    <li>Produtos expostos, cestos, barracas de exposição de produtos, negociação etc.</li>
                  </ul>
                </>
              }

            />
          </div>
          {/* Conteúdo do Capítulo 1 */}
          <Chapter
            title=""
            content={
              <>
                <ConversaVai />
                {/* Conteúdo de lista */}
                <ul className="list-disc marker:text-[#80298F] ml-6">
                  <li>Quais elementos da imagem mostram que ela representa um tempo
                    diferente do nosso?</li>
                  <li>O que a imagem pode nos ensinar sobre o modo de viver e trabalhar das
                    pessoas em tempos passados?</li>
                  <li> Que sinais indicam que se trata de uma atividade de comércio?</li>
                </ul>
                <Pagination currentPage={4} expandToBookColumn />
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={4}
                    content={
                      <>
                        <p className="mb-3">
                          Conversa vem: Confira as orientações no <strong>Manual do professor</strong>.

                        </p>
                        <TeacherAnswers
                          questions={[

                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q1')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q2')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q3')!,
                          ]}
                        />
                        <p className="mb-3">EF04HI06. Apresente o escambo como uma prática
                          tradicional. Incentive os alunos a pensar sobre
                          a dificuldade dessas trocas e como elas eram feitas.
                          Pergunte: “Vocês já trocaram algo com um amigo?
                          Foi fácil ou difícil combinar a troca?”. Confira mais
                          orientações no <strong>Manual do professor</strong>.
                        </p>
                      </>
                    }

                  />
                </div>
                <ConversaVem />
                <p className="mb-4 indent-6">
                  Como observado na imagem da página anterior, o comércio está presente
                  no dia a dia das pessoas desde os tempos mais distantes.
                </p>
                <p className="mb-4 indent-6">
                  Agora, pense um pouco mais sobre o que é comércio e registre suas ideias.
                </p>
                {/* Questão intercalada no conteúdo */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q1')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q2')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q3')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <h3 style={{ marginBottom: '2.0rem', marginTop: '2.0rem' }}>TROCAS COMERCIAIS</h3>
                <CaixaTexto title=''>
                  <p className="mb-4 indent-6">
                    Atualmente, estamos acostumados a pagar pelos produtos com dinheiro em
                    espécie (moedas e cédulas) ou por meios eletrônicos, como cartão, transferência
                    e Pix, que movimentam o dinheiro guardado no banco. No passado, há mais de
                    6 000 anos, não existiam esses meios.
                  </p>
                  <ContinuaProximaPagina />
                </CaixaTexto>
                <Pagination currentPage={5} expandToBookColumn />
                <CaixaTexto>
                  <p className="mb-4 indent-6">
                    As pessoas viviam, em geral, daquilo que conseguiam produzir para
                    o próprio uso, cultivavam alimentos, confeccionavam roupas, pescavam, caçavam
                    ou fabricavam ferramentas. O comércio não foi inventado, ele aconteceu de
                    forma natural. Quando as pessoas produziam mais do que precisavam para
                    a própria sobrevivência, podiam trocar com outras pessoas ou grupos aquilo que
                    tinham em excesso por algo que estava faltando para elas. Isso ajudava a evitar
                    o desperdício do que sobrava. Essa troca de produtos, feita sem usar dinheiro, era
                    chamada de <strong>escambo</strong>.
                  </p>
                  <p className="mb-4 indent-6">
                    Em muitos lugares, o escambo acontecia entre pessoas que moravam perto
                    umas das outras, pois era difícil transportar mercadorias para lugares distantes.
                    Para a troca dar certo, era preciso encontrar alguém interessado no produto
                    disponível, o que nem sempre acontecia. Por isso, o escambo funcionava melhor
                    entre vizinhos e em pequenas aldeias.
                  </p>
                  <p className="mb-4 indent-6">
                    Com o tempo, em diferentes regiões do mundo, povos distintos começaram
                    a se encontrar para trocar produtos. Assim, mais mercadorias passaram a circular,
                    e as pessoas puderam conhecer e adquirir o que não existia na própria terra. Esse
                    movimento aconteceu de modos diferentes em cada lugar, ajudando a ampliar
                    o comércio entre diversos grupos.
                  </p>
                </CaixaTexto>
                <ParaSaberMais />
                <p className="mb-4 indent-6">
                  <strong>Você sabia que o escambo
                    ainda existe nos dias de hoje?</strong>
                </p>
                <p className="mb-4 indent-6">
                  A Feira do Rolo, no PAAR,
                  é um mercado informal em que
                  se destaca a prática do escambo,
                  chamada popularmente de
                  “rolo”. Nela, as pessoas trocam
                  mercadorias diretamente,
                  normalmente sem o uso
                  de dinheiro, valorizando a utilidade e o reaproveitamento dos itens. Essa
                  dinâmica cria um sistema próprio de circulação de bens. A feira funciona
                  semanalmente e movimenta grande variedade de produtos. O escambo se
                  consolida como característica central desse espaço comercial.
                </p>
                {/* Imagem */}
                <div className="flex flex-col items-center my-6">
                  <TrackedImage
                    imageId="page_5_feira_rolo"
                    page={5}
                    src="images/page_3_img_295_487.png"
                    className="w-full max-w-[320px] sm:max-w-[380px] md:max-w-[480px] lg:max-w-[520px] h-auto rounded-[24px]"
                    alt="Feira do Rolo em Belém"
                  >
                  <p className="text-[10px] text-slate-600 mt-2" style={{ fontSize: '10px' }}>João Prudente/Pulsar Imagens
                  </p>
                  <p className="text-[10px] text-slate-600 mt-2" style={{ fontSize: '10px' }}>A Feira do Rolo, comércio informal no bairro
                    PAAR, movimenta a economia na região
                    metropolitana de Belém.
                  </p>
                  </TrackedImage>
                </div>
                <Pagination currentPage={6} expandToBookColumn />
                <h3 style={{ marginBottom: '2.0rem', marginTop: '2.0rem' }}>DA TROCA À MOEDA</h3>
                <p className="mb-4 indent-6">
                  No escambo, nem sempre era fácil fazer uma troca justa para os envolvidos.
                  Imagine que você tem uma bicicleta e quer trocá-la por algumas bananas ou
                  maçãs. Fica difícil, não é? A bicicleta é um bem único e pode durar vários anos,
                  enquanto a fruta é um alimento que pode ser consumido imediatamente ou
                  estragar se não a consumirmos em um período curto de tempo.
                </p>
                <p className="mb-4 indent-6">
                  Para que a troca desse certo, era preciso que as duas pessoas quisessem
                  exatamente o que o outro tinha a oferecer. Por isso, as trocas eram complexas
                  e aconteciam em locais específicos, como as feiras, na maioria das vezes.
                </p>
                <p className="mb-4 indent-6">
                  Com o tempo, em diferentes regiões do mundo, grupos de pessoas
                  começaram a usar bens que todos consideravam valiosos como forma de
                  pagamento. Esses itens eram escolhidos por suas características: o sal era
                  considerado valioso por conservar os alimentos, algo fundamental em uma época
                  sem geladeira; o cacau era valioso na América, pois era usado como alimento
                  e em cerimônias; já as conchas eram fáceis de carregar e contar. Esses itens
                  passaram a funcionar como uma forma de <strong>moeda de troca</strong>.
                </p>
                <p className="mb-4 indent-6">
                  Depois, metais como o ouro, a prata e o cobre se tornaram preferidos por
                  serem duráveis, fáceis de transportar e poderem ser divididos em
                  pedaços pequenos. A relativa escassez desses metais contribuiu para a sua
                  valorização ao longo do tempo.
                </p>
                {/* Imagem */}
                <div className="mx-auto my-6 flex w-full max-w-[520px] flex-col items-center text-center">
                  <TrackedImage
                    imageId="page_6_moedas_lidia"
                    page={6}
                    src="images/page_4_img_290_484.png"
                    className="h-auto w-full max-w-[320px] rounded-[24px] sm:max-w-[380px] md:max-w-[480px] lg:max-w-[520px]"
                    alt="Moedas de metal da Lídia"
                  >
                  <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '10px' }}>
                    Avelludo/Wikimedia Commons
                  </p>
                  <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '10px', textAlign: 'center' }}>
                    Assim, surgiram as moedas de metal, e um
                    dos primeiros povos a usá-las foi o da Lídia <br />
                    (atual Turquia), por volta do ano 600 a.C. Essas
                    moedas eram usadas no comércio local, entre
                    cidades e reinos.
                  </p>
                  </TrackedImage>
                </div>
                <p className="mb-4 indent-6">
                  A invenção da moeda ajudou
                  a expandir o comércio, permitindo
                  a compra e a venda de produtos
                  entre diferentes povos. A partir daí,
                  o comércio passou a acontecer
                  também por grandes rotas, como
                  a Rota da Seda, que ligava a Europa
                  e o Oriente, fortalecendo as
                  relações entre sociedades distantes.
                </p>

                <Pagination currentPage={7} expandToBookColumn />
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={7}
                    content={
                      <>
                        <p className="mb-3">
                          EF04HI06, EF04HI07. Na atividade 2, a ordem proposta nos
                          itens 1 a 4 é uma forma de simplificar a progressão dos meios de
                          troca para o entendimento dos alunos. É fundamental ressaltar
                          que essa sequência não ocorreu da mesma forma e no mesmo
                          tempo em todas as sociedades. O escambo, por exemplo, não
                          desapareceu com o surgimento da moeda; ele coexistiu e ainda
                          é praticado em algumas culturas. Confira mais orientações
                          no <strong>Manual do professor</strong>.
                        </p>
                        <TeacherAnswers
                          questions={[

                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q4')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q5')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q6')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q7')!,
                          ]}
                        />
                      </>
                    }

                  />
                </div>

                <OrganizandoConhecimentos />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q4')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q5')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q6')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q7')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />

                <Pagination currentPage={8} expandToBookColumn />
                {/* Conteúdo do botão do professor */}
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={8}
                    content={
                      <p className="mb-3">
                        Destaque como o comércio nas rotas promoveu não apenas a circulação de produtos
                        de luxo, como especiarias, mas também a troca de ideias, saberes e religiões entre
                        diferentes culturas. Confira mais orientações no <strong>Manual do professor</strong>.
                      </p>
                    }
                  />
                </div>
                <h3 style={{ marginBottom: '2.0rem', marginTop: '2.0rem' }}>CIRCULAÇÃO DE PESSOAS
                  E MERCADORIAS</h3>
                <p className="mb-4 indent-6">
                  Entre os anos 1300 e 1500, o comércio entre a Europa e o Oriente se tornou
                  ainda mais importante. A conexão entre esses dois mundos era feita por um
                  caminho comercial chamado de <strong>Rota da Seda</strong>. Esse nome se refere a uma rede
                  de estradas que ligava a China ao mar Mediterrâneo, percorrendo mais de 6 000
                  quilômetros por terra e mar. Essa rota já era usada há muitos séculos (cerca de
                  130 a.C.), mas foi nesse período que a importância dela cresceu, por conta da
                  busca por mercadorias que interessavam aos comerciantes europeus.

                </p>

                {/* Imagem */}
                <div className="mx-auto my-6 flex w-full max-w-[520px] flex-col items-center text-center">
                  <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '16px', textAlign: 'center' }}>
                    <strong>Rota da Seda entre os anos de 1300 - 1500</strong>
                  </p>
                  <TrackedImage
                    imageId="page_8_rota_seda"
                    page={8}
                    src="images/page_6_img_70_284.png"
                    className="h-auto w-full max-w-[360px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[720px]"
                    alt="Mapa da Rota da Seda"
                  >
                  <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '10px' }}>
                    Talita Stasiak
                  </p>
                  </TrackedImage>

                </div>
                <p className="mb-4 indent-6">
                  Por essa rota, viajavam produtos como a seda, porcelanas da China e as 
                  <strong> especiarias</strong> da Índia. Produtos como a pimenta e o cravo eram essenciais
                  na Europa, tanto para dar sabor aos alimentos quanto para conservá-los. Além
                  disso, as especiarias eram símbolos de riqueza e poder, e quem as possuía era
                  visto com grande prestígio.
                </p>
                <p className="mb-4 indent-6">
                  Com os comerciantes e viajantes, que percorriam as rotas, muitas ideias
                  e conhecimentos foram se espalhando pelo mundo. Algumas religiões, como
                  o <strong>islamismo</strong>, se espalharam por muitos lugares.
                </p>
                <p className="mb-4 indent-6">
                  A Rota da Seda foi um importante canal de troca de <strong>conhecimentos
                    científicos</strong>. Avanços em Matemática, Astronomia e Medicina, desenvolvidos por
                  árabes e indianos, chegaram à Europa por meio do comércio, mudando a história

                </p>


                <Pagination currentPage={9} expandToBookColumn />
                <p className="mb-4 indent-6">
                  <br />da ciência. Além disso, inovações como a bússola, a pólvora e o papel, que vieram
                  da China, chegaram até a Europa. Essa troca de ideias, costumes e saberes mostra
                  a importância das rotas comerciais não apenas para a economia, mas também
                  para o desenvolvimento das civilizações.
                </p>
                <p className="mb-4 indent-6">
                  No entanto, manter essas rotas em funcionamento não era simples.
                  O caminho terrestre da Rota da Seda, que ligava a Europa ao Oriente, era perigoso.
                  Além das dificuldades de transporte, os comerciantes enfrentavam roubos
                  e tinham que pagar para passar por terras controladas por outros povos. Isso fazia
                  com que as especiarias chegassem à Europa com um preço alto, já que os riscos
                  da viagem e as taxas cobradas pelos intermediários encareciam os produtos. Por
                  conta desse cenário, os países europeus, como Portugal e Espanha, buscaram uma
                  solução para esse problema.
                </p>
                <p className="mb-4 indent-6">
                  Portugueses e espanhóis
                  passaram a considerar um
                  caminho diferente da Rota da
                  Seda, evitando os perigos e os
                  altos preços. Para isso, os
                  europeus investiram no estudo
                  das rotas e de meios de
                  transporte marítimo, como as
                  caravelas. Esses navios eram mais
                  rápidos e resistentes para
                  enfrentar o mar. A solução
                  encontrada era navegar pelo
                  oceano, contornando a África,
                  para buscar especiarias indianas
                  e produtos de luxo chineses.
                </p>

                {/* Imagem */}
                <div className="mx-auto my-6 flex w-full max-w-[520px] flex-col items-center text-center">

                  <TrackedImage
                    imageId="page_9_nau_cabral"
                    page={9}
                    src="images/page_7_img_300_309.png"
                    className="h-auto w-full max-w-[320px] rounded-[24px] sm:max-w-[280px] md:max-w-[380px] lg:max-w-[420px]"
                    alt="Gravura de nau de Pedro Álvares Cabral"
                  >
                  <p className="mt-2 text-[10px] text-slate-600" style={{ fontSize: '10px' }}>
                    ALBUQUERQUE, Luís de. <em>Memória das Armadas que
                      de Portugal passaram à Índia</em>: pormenor da nau de Pedro
                    Álvares Cabral. <em>In</em>: LIVRO das Armadas. Lisboa: Academia
                    das Ciências de Lisboa – ACIENL, 1979.
                  </p>
                  </TrackedImage>

                </div>
                <p className="mb-4 indent-6">
                  Essa busca por novas rotas marítimas deu início a um processo conhecido
                  como <strong>Grandes Navegações</strong>, que foram viagens feitas por navios europeus
                  para encontrar terras, riquezas e novos caminhos para
                  o comércio. Durante essas navegações, os portugueses
                  tiveram contato com diferentes povos e realizaram
                  diversas conquistas, como a chegada ao território que
                  hoje conhecemos como Brasil. A necessidade de comércio
                  impulsionou essas expedições e levou as pessoas a se
                  adaptarem a novos desafios.
                </p>
                <h3 className="atividade-digital-heading">ATIVIDADE DIGITAL</h3>
                <div className="my-4 flex justify-center">
                  <GameModal
                    thumbnailSrc="images/thumbODA.svg"
                    introTitle="Explorando o comércio do passado"
                    introHint="Clique para jogar"
                    closeAriaLabel="Fechar atividade digital"
                    analyticsResource={{
                      linkId: 'oda_page_10_comercio',
                      page: 10,
                      type: 'oda_opened',
                    }}
                  >
                    <OdaSAE26_AI43_HIS_C07_OA1 />
                  </GameModal>
                </div>

                <Pagination currentPage={10} expandToBookColumn />
                {/* Conteúdo do botão do professor */}
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={10}
                    content={
                      <>
                        <p>EF04HI06, EF04HI07. Confira as orientações
                          no <strong>Manual do professor</strong>.</p>
                        <TeacherAnswers
                          questions={[

                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q8')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q9')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q10')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q11')!,
                          ]}
                        />
                      </>
                    }

                  />
                </div>

                {/* Questão intercalada no conteúdo */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q8')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q9')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q10')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q11')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />

                <Pagination currentPage={11} expandToBookColumn />
                {/* Conteúdo do botão do professor - Tabela comparativa */}
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={11}
                    content={
                      <>
                        <p className="mb-4 indent-6">
                          Agora, preencha o quadro com as ideias do grupo: Pessoal.
                        </p>
                        <TeacherAnswers
                          questions={[
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q13')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q14')!,
                          ]}
                        />
                      </>
                    }
                  />
                </div>
                <SaberesAcao />
                <p className="mb-4 indent-6">
                  No passado, uma das principais formas de comércio era a troca de
                  produtos. Mas será que era fácil trocar produtos se as pessoas não sabiam se
                  estavam recebendo algo justo em troca?
                </p>
                <p className="mb-4 indent-6">
                  Vamos experimentar como isso funcionava! Reúna-se em grupo com
                  mais dois colegas. Imaginem que estão participando de uma feira em que não
                  é permitido usar dinheiro. Cada um deve escolher algo que tem e deseja trocar.
                  Todos devem tentar fazer trocas justas entre si.
                </p>
                <p className="mb-4 indent-6">
                  Agora, preencha o quadro com as ideias do grupo.
                </p>
                {/* Questão intercalada no conteúdo - Tabela comparativa */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q12')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <p className="mb-4 indent-6">
                  Agora, converse com os colegas do grupo e responda às questões a seguir.
                </p>
                {/* Questão intercalada no conteúdo */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q13')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q14')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />

                <Pagination currentPage={12} expandToBookColumn />
                {/* Conteúdo do botão do professor */}
                <div className="my-6">
                  <TeacherButton
                    visible={SHOW_TEACHER_BUTTON}
                    page={12}
                    content={
                      <>
                        <TeacherAnswers
                          questions={[
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q15')!,
                            chapterQuestions.chapter1.find(q => q.id === 'ch1_q16')!,
                          ]}
                        />
                      </>
                    }
                  />
                </div>

                <TestandoIdeias />
                {/* Questão intercalada no conteúdo */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q15')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                {/* Questão intercalada no conteúdo */}
                <QuestionRenderer
                  question={getQuestionById('chapter1', 'ch1_q16')}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showResults={showTeacherView}
                />
                <AgoraVoceJaSabe />
                {/* Tabela de Critérios de Avaliação */}
                <CriteriosAvaliacao
                  instanceId="producao_texto"
                  criterios={[
                    {
                      id: 'linha_1',
                      nome: '',
                      pergunta: 'Reconhecer a importância do comércio para a troca de produtos e culturas.',
                    },
                    {
                      id: 'linha_2',
                      nome: '',
                      pergunta: 'Compreender como funcionavam as feiras no passado e como elas ainda funcionam no presente.',
                    },
                    {
                      id: 'linha_3',
                      nome: '',
                      pergunta: 'Identificar os meios de transporte utilizados nas antigas rotas comerciais.',
                    },
                    {
                      id: 'linha_4',
                      nome: '',
                      pergunta: 'Relacionar os diferentes tipos de moeda do passado e do presente.',
                    },
                    {
                      id: 'linha_5',
                      nome: '',
                      pergunta: 'Compreender o comércio como uma atividade que também envolve ideias, crenças e costumes.',
                    },
                  ]}
                  userAnswers={userAnswers}
                  onAnswerChange={handleAnswerChange}
                />


              </>
            }
          />

        </div>

        <div
          data-page-end={12}
          className="pointer-events-none h-px w-full shrink-0 overflow-hidden"
          aria-hidden="true"
        />

        <div className="px-8 md:px-12">
          <ChapterFeedback />
        </div>

        <Footer />
      </div>

      {currentPage > 3 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 right-4 z-40 p-3 hover:scale-110 transition-all"
          title="Voltar ao início do livro"
        >
          <img src={publicUrl('images/setaTopo.svg')} alt="Voltar ao início do livro" />
        </button>
      )}
    </div>
  );
}

export default Book;