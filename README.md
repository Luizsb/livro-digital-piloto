# Livro Digital — Piloto (relatório de uso)

Projeto **separado** do livro-bett. Aqui evoluímos a coleta de eventos de uso fase a fase, para depois portar ao **DIA LD**.

## Execução

```bash
cd C:\Users\luiz.barbosa\Documents\livro-digital-piloto
npm install
npm run dev
```

| URL | Efeito |
|-----|--------|
| http://localhost:5173/ | Piloto do livro |
| http://localhost:5173/#/dashboard | **LD Insights** — dashboard do JSON exportado |
| http://localhost:5173/?reset=1 | Nova sessão |

### GitHub Pages (testes públicos)

Deploy automático via **GitHub Actions** (workflow `.github/workflows/deploy-pages.yml`).

**Configuração no GitHub** (Settings → Pages):

| Campo | Valor |
|-------|--------|
| Source | **GitHub Actions** (não "Deploy from a branch") |

> Se estiver em "Deploy from a branch" com `main`, o site carrega `src/main.tsx` e fica em **tela branca**.

Após o primeiro deploy, recarregue com **Ctrl+Shift+R** (limpa cache do navegador).

| URL | Efeito |
|-----|--------|
| https://luizsb.github.io/livro-digital-piloto/ | Piloto do livro |
| https://luizsb.github.io/livro-digital-piloto/#/dashboard | **LD Insights** |
| https://luizsb.github.io/livro-digital-piloto/?reset=1 | Nova sessão |

Simular o build de Pages localmente:

```bash
npm run build:pages
npm run preview:pages
```

> **Coleta:** eventos ficam no `sessionStorage` do navegador de cada participante. Para análise, exporte o JSON e carregue no LD Insights (não há backend centralizado neste piloto).

Em desenvolvimento, os dados são **zerados a cada reinício do `npm run dev`**. Recarregue a aba após reiniciar o servidor.

### Tela branca no localhost (`ERR_BLOCKED_BY_CLIENT`)

Extensões como **uBlock Origin** ou **AdBlock** costumam bloquear URLs com `analytics`, `event` ou `track` no caminho dos módulos do Vite. O código de coleta vive em `src/ld/` (nomes neutros) para evitar isso.

Se ainda falhar:

1. Desative o bloqueador **só para** `localhost:5173`, ou
2. Use uma janela anônima sem extensões, ou
3. Abra `http://localhost:5173/` (sem hash duplicado na barra de endereço).

## Configurar critérios das métricas

Dois arquivos — **limiares universais** vs **páginas por livro**:

| O quê | Arquivo |
|-------|---------|
| Tempos, taxa %, scroll, imagens, profundidade | [`src/ld/ldConfig.ts`](src/ld/ldConfig.ts) |
| **Páginas do capítulo** (início, fim, página inicial na UI) | [`src/ld/chapterPageConfig.ts`](src/ld/chapterPageConfig.ts) |

| Precisa mudar… | Onde |
|----------------|------|
| Tempo mínimo na página (`page_completed`) | `ldConfig` → `page.completeMinSeconds` |
| Taxa para capítulo concluído (`chapter_completed`) | `ldConfig` → `chapter.minCompletionRateForChapterCompleted` (ou override por capítulo em `chapterPageConfig`) |
| **Primeira / última página, página inicial** | `chapterPageConfig` → `CHAPTER_PAGE_REGISTRY` |
| Gatilho de scroll (`page_viewed`) | `ldConfig` → `scroll.*` |
| Exposição de imagem (`image_viewed`) | `ldConfig` → `image.*` |
| Profundidade de leitura | `ldConfig` → `readingQuality.*` |

Ao portar um **novo livro/capítulo**, adicione uma entrada em `CHAPTER_PAGE_REGISTRY` e alinhe os `data-book-page` em `Book.tsx` / `Pagination.tsx`.

Guia completo: **[docs/CONFIGURACAO-ANALYTICS.md](docs/CONFIGURACAO-ANALYTICS.md)**

## Fase atual

**MVP-06** — saúde técnica na navegação + dashboard LD Insights + **qualidade da coleta** + fluxo de finalização do teste.

| Documento | Conteúdo |
|-----------|----------|
| [docs/RELATORIO-USO-LIVRO.md](docs/RELATORIO-USO-LIVRO.md) | Roadmap e arquitetura |
| [docs/MVP-01-BASE.md](docs/MVP-01-BASE.md) | Sessão, gate, exportação |
| [docs/MVP-02-JORNADA-LEITURA.md](docs/MVP-02-JORNADA-LEITURA.md) | Páginas, regras de scroll, JSON |
| [docs/MVP-03-INTERACOES-CONTEUDO.md](docs/MVP-03-INTERACOES-CONTEUDO.md) | Imagens, zoom, recursos |
| [docs/MVP-04-FEEDBACK.md](docs/MVP-04-FEEDBACK.md) | Feedback, `chapter_finished` / `chapter_completed` |
| [docs/MVP-05-BOTAO-PROFESSOR.md](docs/MVP-05-BOTAO-PROFESSOR.md) | Botão Para o Professor |
| [docs/MVP-06-SAUDE-TECNICA.md](docs/MVP-06-SAUDE-TECNICA.md) | Erros, tempo de carga, peso observado na sessão |
| [docs/DASHBOARD-MVP.md](docs/DASHBOARD-MVP.md) | **LD Insights** — dashboard do JSON |
| [docs/CONFIGURACAO-ANALYTICS.md](docs/CONFIGURACAO-ANALYTICS.md) | Limiares e tempos — referência completa |
| [docs/CATÁLOGO-EVENTOS-E-RELATÓRIOS.md](docs/CATÁLOGO-EVENTOS-E-RELATÓRIOS.md) | **Catálogo único** — eventos, KPIs, relatórios; regra **uso vs aprendizagem** |
| [docs/EVIDENCIAS.md](docs/EVIDENCIAS.md) | Histórico de evoluções — manter atualizado |

## Estrutura

```text
src/
  ld/
    ldConfig.ts             ← limiares universais (tempo, taxa %, scroll…)
    chapterPageConfig.ts    ← ★ páginas por livro/capítulo (registry)
    chapterManifest.ts      ← ★ inventário rastreável por capítulo (manifest)
    chapterMetrics.ts       ← aplica regras de chapter_completed
    collectionQuality.ts    ← validação de integridade no summary
    readingQuality.ts     ← aplica readingQuality.*
    bookPageScroll.ts     ← aplica scroll.*
    …                     ← demais módulos importam ldConfig
  components/
    Book.tsx              ← conteúdo do capítulo
    TrackedImage.tsx       ← imagens com view + zoom (MVP-03)
    TrackedLink.tsx        ← links rastreáveis (MVP-03)
    TrackedVideo.tsx       ← play e conclusão do vídeo Escola Digital (MVP-03)
    ParticipantGate.tsx       ← P fixo + número; link dashboard
    TestFinishedScreen.tsx    ← tela após Finalizar teste
    EventReportPanel.tsx      ← painel em tempo real
    ExportEventsButton.tsx
    FinishTestButton.tsx
    ChapterFeedback.tsx      ← feedback final (MVP-04)
docs/                     ← especificações por MVP + guia DIA LD
    EVIDENCIAS.md         ← ★ histórico de mudanças (atualizar sempre)
```

## Relação com outros projetos

| Projeto | Função |
|---------|--------|
| livro-bett | Livro digital de referência (intacto) |
| **Este piloto** | Validar coleta de eventos antes do DIA LD |
| DIA LD | Produção — seguir [GUIA-MIGRACAO-DIA-LD.md](docs/GUIA-MIGRACAO-DIA-LD.md) |
