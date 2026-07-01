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

Deploy automático a cada push na branch `main` (workflow `.github/workflows/deploy-pages.yml`).

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

## Configurar critérios das métricas

Dois arquivos — **limiares universais** vs **páginas por livro**:

| O quê | Arquivo |
|-------|---------|
| Tempos, taxa %, scroll, imagens, profundidade | [`src/analytics/analyticsConfig.ts`](src/analytics/analyticsConfig.ts) |
| **Páginas do capítulo** (início, fim, página inicial na UI) | [`src/analytics/chapterPageConfig.ts`](src/analytics/chapterPageConfig.ts) |

| Precisa mudar… | Onde |
|----------------|------|
| Tempo mínimo na página (`page_completed`) | `analyticsConfig` → `page.completeMinSeconds` |
| Taxa para capítulo concluído (`chapter_completed`) | `analyticsConfig` → `chapter.minCompletionRateForChapterCompleted` (ou override por capítulo em `chapterPageConfig`) |
| **Primeira / última página, página inicial** | `chapterPageConfig` → `CHAPTER_PAGE_REGISTRY` |
| Gatilho de scroll (`page_viewed`) | `analyticsConfig` → `scroll.*` |
| Exposição de imagem (`image_viewed`) | `analyticsConfig` → `image.*` |
| Profundidade de leitura | `analyticsConfig` → `readingQuality.*` |

Ao portar um **novo livro/capítulo**, adicione uma entrada em `CHAPTER_PAGE_REGISTRY` e alinhe os `data-book-page` em `Book.tsx` / `Pagination.tsx`.

Guia completo: **[docs/CONFIGURACAO-ANALYTICS.md](docs/CONFIGURACAO-ANALYTICS.md)**

## Fase atual

**MVP-05** — botão do professor + dashboard LD Insights refinado.

| Documento | Conteúdo |
|-----------|----------|
| [docs/RELATORIO-USO-LIVRO.md](docs/RELATORIO-USO-LIVRO.md) | Roadmap e arquitetura |
| [docs/MVP-01-BASE.md](docs/MVP-01-BASE.md) | Sessão, gate, exportação |
| [docs/MVP-02-JORNADA-LEITURA.md](docs/MVP-02-JORNADA-LEITURA.md) | Páginas, regras de scroll, JSON |
| [docs/MVP-03-INTERACOES-CONTEUDO.md](docs/MVP-03-INTERACOES-CONTEUDO.md) | Imagens, zoom, recursos |
| [docs/MVP-04-FEEDBACK.md](docs/MVP-04-FEEDBACK.md) | Feedback, `chapter_finished` / `chapter_completed` |
| [docs/MVP-05-BOTAO-PROFESSOR.md](docs/MVP-05-BOTAO-PROFESSOR.md) | Botão Para o Professor |
| [docs/DASHBOARD-MVP.md](docs/DASHBOARD-MVP.md) | **LD Insights** — dashboard do JSON |
| **[docs/CONFIGURACAO-ANALYTICS.md](docs/CONFIGURACAO-ANALYTICS.md)** | **Limiares e tempos — referência completa** |
| **[docs/EVIDENCIAS.md](docs/EVIDENCIAS.md)** | **Histórico de evoluções — manter atualizado** |

## Estrutura

```text
src/
  analytics/
    analyticsConfig.ts      ← limiares universais (tempo, taxa %, scroll…)
    chapterPageConfig.ts    ← ★ páginas por livro/capítulo (registry)
    chapterMetrics.ts       ← aplica regras de chapter_completed
    readingQuality.ts     ← aplica readingQuality.*
    bookPageScroll.ts     ← aplica scroll.*
    …                     ← demais módulos importam analyticsConfig
  components/
    Book.tsx              ← conteúdo do capítulo
    TrackedImage.tsx       ← imagens com view + zoom (MVP-03)
    TrackedLink.tsx        ← links rastreáveis (MVP-03)
    TrackedVideo.tsx       ← play e conclusão do vídeo Escola Digital (MVP-03)
    ParticipantGate.tsx
    EventReportPanel.tsx  ← painel em tempo real
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
