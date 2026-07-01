# Configuração do analytics — parâmetros editáveis

## Onde alterar (comece aqui)

| O quê | Caminho |
|-------|---------|
| **Limiares universais** (tempo, taxa %, scroll, imagens) | [`src/analytics/analyticsConfig.ts`](../src/analytics/analyticsConfig.ts) |
| **Páginas por livro/capítulo** | [`src/analytics/chapterPageConfig.ts`](../src/analytics/chapterPageConfig.ts) |
| **Este guia** | `docs/CONFIGURACAO-ANALYTICS.md` |
| **Índice no README** | [`README.md`](../README.md) → *Configurar critérios das métricas* |

Salve e recarregue o app após editar. Não duplique números em outros arquivos.

---

## Referência rápida

### `analyticsConfig.ts` — vale para qualquer livro

| Bloco | Eventos / métricas afetados | Arquivo que aplica |
|-------|----------------------------|-------------------|
| `page.completeMinSeconds` | `page_completed` | `pageReadingState.ts`, `pageCompletion.ts` |
| `chapter.minCompletionRateForChapterCompleted` | `chapter_completed` (taxa mínima) | `chapterMetrics.ts` |
| `scroll.*` | `page_viewed` | `bookPageScroll.ts` |
| `image.*` | `image_viewed` (exposição) | `TrackedImage.tsx` |
| `readingQuality.*` | `session_finished.reading_depth` | `readingQuality.ts` |

### `chapterPageConfig.ts` — por livro + capítulo

| Campo | Efeito |
|-------|--------|
| `defaultBookPage` | Página na paginação antes do 1º marcador `data-book-page` |
| `firstPage` / `lastPage` | Intervalo rastreado; jornada no dashboard |
| `minCompletionRateForChapterCompleted` | Override opcional da taxa % só deste capítulo |

Chave do registro: `` `${book_id}::${chapter_id}` `` (ver `BOOK_PILOT` em `eventTypes.ts`).

O export JSON grava snapshot no summary: `chapter_first_page`, `chapter_last_page`, `chapter_total_pages`, `chapter_default_page` — o dashboard usa esses valores mesmo se o registro mudar depois.

**Validar marcadores no DOM:** `discoverChapterPageBoundsFromDom()` em `chapterPageConfig.ts` (console do navegador com o capítulo aberto).

---

## Parâmetros universais (`analyticsConfig.ts`)

### `page.completeMinSeconds` (padrão: `5`)

Tempo mínimo na página para `page_completed` (avançar, Finalizar teste, fechar aba).

---

### `scroll` — paginação e `page_viewed`

| Campo | Padrão | Efeito |
|-------|--------|--------|
| `triggerMinPx` | `56` | Limite inferior do gatilho (px) |
| `triggerMaxPx` | `160` | Limite superior |
| `triggerViewportRatio` | `0.1` | 10% da altura da janela |

---

### `image` — `image_viewed` (exposição)

| Campo | Padrão | Efeito |
|-------|--------|--------|
| `viewThreshold` | `0.5` | 50% da imagem visível |
| `viewDelayMs` | `750` | Espera antes de registrar |

---

### `chapter.minCompletionRateForChapterCompleted` (padrão: `70`)

Taxa mínima (%) para `chapter_completed`. Pode ser sobrescrita por capítulo em `chapterPageConfig`.

---

### `readingQuality` — profundidade de leitura

| Campo | Padrão | Classificação |
|-------|--------|---------------|
| `veryQuickMaxSeconds` | `5` | Leitura rápida |
| `quickScanMaxSeconds` | `15` | Varredura rápida |
| `moderateMaxSeconds` | `40` | Leitura moderada |
| acima de 40 | — | Leitura aprofundada |

---

## Páginas por capítulo (`chapterPageConfig.ts`)

Exemplo do capítulo piloto atual:

```typescript
[registryKey('cap07_historia_ai43', 'cap07')]: {
  defaultBookPage: 3,  // paginação ao abrir
  firstPage: 3,        // 1º data-book-page
  lastPage: 12,        // última página do miolo
},
```

**Novo livro/capítulo:**

1. Defina `book_id` / `chapter_id` em `eventTypes.ts` (`BOOK_PILOT` ou provider).
2. Adicione entrada em `CHAPTER_PAGE_REGISTRY`.
3. Coloque `data-book-page={N}` em `Pagination` / `BookPageTracker` entre `firstPage` e `lastPage`.

### Regra de `chapter_completed`

1. `pages_viewed_count === chapter_total_pages` (todas vistas)
2. `completion_rate >=` taxa mínima (global ou override do capítulo)

| Cenário (10 páginas, 70%) | `chapter_finished` | `chapter_completed` |
|---------------------------|-------------------|---------------------|
| 10 vistas, 7 concluídas | Sim | Sim |
| 10 vistas, 5 concluídas | Sim | Não |
| 8 vistas, 6 concluídas | Sim | Não |

Detalhes: [MVP-04-FEEDBACK.md](./MVP-04-FEEDBACK.md).

---

## O que não está nestes arquivos

| Tipo | Onde fica |
|------|-----------|
| Labels em português | `eventLabels.ts` |
| IDs de imagens / recursos | componentes do livro |
| Layout do dashboard | `src/dashboard/` |

---

## Histórico

Registre mudanças nos MVPs correspondentes (`docs/MVP-02-*.md`, etc.).
