# MVP-02 — Jornada de leitura

## Objetivo

Rastrear se o participante percorreu o conteúdo do capítulo: páginas visualizadas, páginas concluídas e encerramento da sessão — **sem alterar conteúdo pedagógico nem layout principal**.

## Eventos

### `page_viewed` — Página visualizada

**Quando dispara:** a página **apareceu na tela** — o marcador `data-book-page` cruza a linha de gatilho de scroll (mesma regra da paginação).

**Regras:**

- Máximo **uma vez por página por sessão**
- Não repete se o usuário voltar à mesma página
- Indica que o participante **viu** a página, não que a concluiu

---

### `page_completed` — Página concluída

**Quando dispara:**

- Páginas **3–11:** ao **avançar para a página seguinte** (página ativa muda de N para N+1), se permaneceu ≥ tempo mínimo
- Página **12** (última): ao chegar ao **fim do capítulo** (`data-page-end="12"`) ou ao **encerrar a sessão** nesta página

**Regras (resumo):**

| Evento | Significado |
|--------|-------------|
| `page_viewed` | Página apareceu na tela |
| `page_completed` | Página ficou visível pelo **tempo mínimo** configurado (`analyticsConfig.page.completeMinSeconds`, padrão 5 s) **ou** foi concluída por `session_finished` |
| `reading_depth` | Classificação baseada no tempo médio **por página visualizada** (`avg_seconds_per_viewed_page`) |

**Regras detalhadas:**

- Máximo **uma vez por página por sessão**
- Só dispara se o participante permaneceu **≥ tempo mínimo** na página (exceto tentativa ao encerrar sessão na página ativa)
- Ao avançar 11→12: primeiro `page_viewed(12)`, depois `page_completed(11)` (se ≥ 5s na pág. 11)

**Metadata (obrigatório):**

```json
{
  "page": 5,
  "duration_seconds": 42,
  "completion_reason": "page_changed"
}
```

| `completion_reason` | Quando |
|---------------------|--------|
| `page_changed` | Avançou para a página seguinte |
| `time_threshold` | Chegou ao fim do capítulo (marcador `data-page-end`) |
| `session_finished` | Encerrou a sessão ainda nesta página |

`duration_seconds` = tempo entre `page_viewed` e `page_completed` (sempre ≥ 5 quando o evento é emitido).

**Implementação:** `src/analytics/pageCompletion.ts` + `src/analytics/pageReadingState.ts`

---

### `session_finished` — Sessão finalizada

**Quando dispara:**

1. Clique em **"Finalizar teste"** (`FinishTestButton.tsx`) — fluxo completo de capítulo
2. Fechamento/saída da aba (`pagehide` em `useSessionFinishOnUnload.ts`) — apenas encerramento de sessão

**Não dispara em:**

- Recarregar a aba (F5 / botão atualizar) — sessão ativa é restaurada; ver `session_resumed`
- Exportação JSON

**Regras:**

- Máximo **uma vez por sessão**
- Não dispara automaticamente na exportação JSON

**Metadata:**

```json
{
  "duration_seconds": 420,
  "pages_viewed_count": 10,
  "pages_completed_count": 8,
  "avg_seconds_per_viewed_page": 42.0,
  "avg_seconds_per_completed_page": 14.7,
  "reading_depth": "quick_scan"
}
```

| Campo | Cálculo |
|-------|---------|
| `avg_seconds_per_viewed_page` | `duration_seconds ÷ pages_viewed_count` |
| `avg_seconds_per_completed_page` | Média dos `duration_seconds` dos eventos `page_completed` |
| `reading_depth` | Classificação por `avg_seconds_per_viewed_page` (não pela média de concluídas) |

| `reading_depth` | Média por página **visualizada** |
|-----------------|----------------------------------|
| `very_quick` | 0–5 s |
| `quick_scan` | 6–15 s |
| `moderate_reading` | 16–40 s |
| `deep_reading` | 40 s+ |

Calculado em `sessionFinishMetrics.ts` + `readingQuality.ts`.

---

## Marcadores no DOM (requisito para o DIA LD)

O tracking **não altera o layout visível**. Usa atributos `data-*` em elementos existentes ou sentinelas de 1px.

| Atributo | Onde | Função |
|----------|------|--------|
| `data-book-page={N}` | Barras `Pagination` com `expandToBookColumn` (págs. 4–12) | Início da página N |
| `data-book-page={3}` | `BookPageTracker.tsx` (1px, invisível) | Início da página 3 (capa/intro) |
| `data-page-end={12}` | `Book.tsx`, antes do `Footer` (1px, invisível) | Fim da última página |

A barra de paginação do **topo fixo** (`Pagination` sem `expandToBookColumn`) **não** tem `data-book-page` — evita conflito com a paginação por scroll.

## Regra de página ativa (`bookPageScroll.ts`)

Compartilhada entre `usePagination` (UI) e `useBookPageTracking` (analytics):

```text
triggerY = min(160, max(56, 10% da altura da janela))

Para cada [data-book-page]:
  se rect.top <= triggerY → candidata

Página ativa = maior número entre candidatas (default: 3)
```

**Por que importa:** garante que analytics e indicador "Página - X" usem a mesma definição de "estar na página N".

## Ordem obrigatória dos eventos (Ajuste A)

Sequência garantida no bootstrap:

```text
session_started → book_opened → page_viewed → …
```

**Como:** `ParticipantGate` só renderiza o livro após `session_started` e `book_opened`. `useBookPageTracking` só dispara `page_viewed` quando `isPageTrackingReady()` é verdadeiro (`analyticsBootstrap.ts`).

## Ordem dos eventos no painel

Ao avançar de página N para N+1, na mesma fração de segundo:

1. Registra `page_viewed(N+1)`
2. Registra `page_completed(N)`

No painel (`sortAnalyticsEvents.ts`), em empate de timestamp:

- `page_viewed` aparece **acima** de `page_completed`
- Horários exibidos com **milissegundos**

## Painel — seção "Jornada de leitura"

Exibido em `EventReportPanel.tsx`:

- Páginas visualizadas (contagem + lista)
- Páginas concluídas (contagem + lista)
- Taxa de conclusão = `concluídas / visualizadas × 100`

O `summary` do JSON exportado inclui os mesmos campos agregados.

## Formato do JSON exportado

```json
{
  "exported_at": "2026-06-30T17:36:59.123Z",
  "book_id": "cap07_historia_ai43",
  "chapter_id": "cap07",
  "event_count": 25,
  "summary": {
    "total_events": 25,
    "by_event_name": {
      "session_started": 1,
      "book_opened": 1,
      "page_viewed": 10,
      "page_completed": 9,
      "session_finished": 1,
      "events_exported": 1
    },
    "pages_viewed": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "pages_completed": [3, 4, 5, 6, 7, 8, 9, 10, 11],
    "pages_viewed_count": 10,
    "pages_completed_count": 9,
    "completion_rate": 90
  },
  "events": [
    {
      "event_id": "uuid",
      "event_name": "page_viewed",
      "timestamp": "2026-06-30T17:32:12.456Z",
      "session_id": "uuid",
      "participant_id": "P01",
      "book_id": "cap07_historia_ai43",
      "chapter_id": "cap07",
      "source": "react_mvp",
      "metadata": { "page": 5 }
    }
  ]
}
```

## Arquivos criados/alterados (MVP-02)

### Novos

| Arquivo | Descrição |
|---------|-----------|
| `src/analytics/bookPageScroll.ts` | Regra de página ativa |
| `src/analytics/useBookPageTracking.ts` | Tracking de páginas |
| `src/analytics/finishSession.ts` | Disparo de `session_finished` |
| `src/analytics/useSessionFinishOnUnload.ts` | Fechar aba |
| `src/analytics/readingJourneySummary.ts` | Métricas do painel |
| `src/analytics/sortAnalyticsEvents.ts` | Ordenação do painel |
| `src/analytics/pageCompletion.ts` | Regra de conclusão + motivo |
| `src/analytics/pageReadingState.ts` | Tempo por página + estado ativo |
| `src/analytics/readingQuality.ts` | `reading_depth` e média |
| `src/analytics/analyticsBootstrap.ts` | Ordem session → book → pages |
| `src/components/BookPageTracker.tsx` | Marcador pág. 3 + hook |
| `src/components/FinishTestButton.tsx` | Botão finalizar teste |
| `src/components/SessionLifecycle.tsx` | Ciclo de vida da sessão |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePagination.ts` | Usa `getActiveBookPage()` compartilhado |
| `src/components/Book.tsx` | `BookPageTracker` + `data-page-end="12"` |
| `src/App.tsx` | Novos controles e `SessionLifecycle` |
| `src/analytics/eventTypes.ts` | `page_completed` |
| `src/analytics/eventSummary.ts` | Métricas de jornada no summary |
| `src/analytics/sessionFinishMetrics.ts` | `pages_completed_count` |
| `src/analytics/eventLabels.ts` | Labels MVP-02 ativos |
| `src/components/EventReportPanel.tsx` | Jornada + ordenação |

## Critérios de aceite (MVP-02)

- [x] `session_started` e `book_opened` continuam funcionando
- [x] `page_viewed` por página, sem duplicata na sessão
- [x] `page_viewed` não dispara com página seguinte só no rodapé
- [x] `page_completed` exige ≥ 5s e inclui `completion_reason`
- [x] `session_finished` inclui `avg_seconds_per_viewed_page`, `avg_seconds_per_completed_page` e `reading_depth`
- [x] Ordem `session_started` → `book_opened` → `page_viewed`
- [x] `session_finished` no JSON e no painel
- [x] Painel com jornada e taxa de conclusão
- [x] `events_exported` inalterado
- [x] Reset em dev não atrapalha testes

## Histórico de decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| MVP-02 inicial | `page_completed` após 3s visível | Spec original |
| Ajuste 1 | Removido timer; conclusão ao avançar | Barra da pág. seguinte no rodapé marcava conclusão prematura |
| Ajuste 2 | `page_viewed` usa scroll trigger (não IntersectionObserver 40%) | Mesmo problema: peek no rodapé contava como visualizada |
| Ajuste 3 | Ordem: view → complete; sort no painel | Eventos no mesmo segundo apareciam invertidos |
| Ajuste 4 | Bootstrap gate: session → book → pages | `page_viewed` antes de `book_opened` |
| Ajuste 5 | Mínimo 5s + `completion_reason` | Evitar conclusão de quem só passou pela página |
| Ajuste 6 | Médias de tempo + `reading_depth` | `avg_seconds_per_viewed_page` e `avg_seconds_per_completed_page` no `session_finished` |

## Fora de escopo (MVP-02)

- Imagens, atividades, professor, acessibilidade, feedback
- Backend / dashboard
- Alteração de conteúdo ou layout pedagógico
