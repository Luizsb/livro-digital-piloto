# Guia de migração para o DIA LD

Este documento resume **o que portar** do piloto (`livro-digital-piloto`) para o livro digital de produção (**DIA LD**), na ordem recomendada.

## Princípios do piloto (manter no DIA LD)

1. **Coleta local primeiro** — `sessionStorage` por aba; sem backend no MVP
2. **Participante anônimo** — códigos `P01`, `P02`… sem PII
3. **Deduplicação por sessão** — `trackOncePerSession` em `sessionDedup.ts`
4. **Sem alterar layout pedagógico** — apenas atributos `data-*` e componentes de analytics paralelos
5. **Mesma regra de página** — UI de paginação e analytics compartilham `getActiveBookPage()`

## Checklist de portabilidade

### Camada analytics (copiar/adaptar)

```
src/analytics/
  eventTypes.ts          → ajustar book_id / chapter_id por obra
  eventLabels.ts         → manter sincronizado com eventTypes
  trackEvent.ts
  AnalyticsProvider.tsx
  sessionDedup.ts
  resetAnalytics.ts      → revisar STORAGE_VERSION ao mudar schema
  exportEvents.ts
  eventSummary.ts
  readingJourneySummary.ts
  bookPageScroll.ts      → CRÍTICO: mesma regra do usePagination
  useBookPageTracking.ts
  finishSession.ts
  sessionFinishMetrics.ts
  useSessionFinishOnUnload.ts
  useStoredEvents.ts
  sortAnalyticsEvents.ts
  finishSession.ts
```

### Componentes de UI do piloto (opcional em produção)

| Piloto | Produção DIA LD |
|--------|-----------------|
| `ParticipantGate` | Substituir por auth/identificação do DIA ou manter código anônimo |
| `EventsPanelButton` + `EventReportPanel` | Remover ou restringir a ambiente de QA |
| `FinishTestButton` | Integrar em fluxo real de "encerrar leitura" |
| `ExportEventsButton` | Substituir por envio ao backend quando existir |
| `SessionLifecycle` | Manter (pagehide) |
| `BookPageTracker` | Manter |

### Integração no App

```tsx
<AnalyticsProvider bookId="..." chapterId="...">
  <ParticipantGate>           {/* ou gate do DIA */}
    <SessionLifecycle />
    <Book />
    {/* Controles de debug: só em dev/staging */}
  </ParticipantGate>
</AnalyticsProvider>
```

### Marcadores no conteúdo do livro

**Obrigatório para jornada de leitura:**

1. Cada página do miolo: `data-book-page={N}` na barra de paginação (já existe em `Pagination.tsx` com `expandToBookColumn`)
2. Página inicial do capítulo: marcador `data-book-page={3}` (ou número correto) — ver `BookPageTracker.tsx`
3. Última página: `data-page-end={N}` antes do rodapé — ver `Book.tsx`

**Ao portar outro capítulo:** conferir numeração das páginas em `Book.tsx` e ajustar `data-page-end`.

### Hook de paginação

`usePagination.ts` do piloto **deve** importar `getActiveBookPage` de `bookPageScroll.ts`. Não duplicar a lógica de scroll no DIA LD.

## Eventos prontos para portar (MVP-01 + MVP-02)

| event_name | Portar? | Observação |
|------------|---------|------------|
| `session_started` | ✅ | Disparo após identificação do participante |
| `book_opened` | ✅ | Após conteúdo visível |
| `page_viewed` | ✅ | Requer marcadores `data-book-page` |
| `page_completed` | ✅ | Requer marcadores + regra de avanço |
| `session_finished` | ✅ | Botão + pagehide |
| `events_exported` | ⚠️ | Trocar por API quando houver backend |

## Eventos futuros (ainda não no piloto)

Definidos em `eventTypes.ts` mas `active: false` em `eventLabels.ts`:

- `image_viewed`, `image_zoomed`, `image_load_error` (MVP-03)
- `teacher_button_opened` (MVP-04)
- `activity_started`, `activity_completed` (MVP-05)
- `accessibility_changed` (MVP-06)
- `feedback_submitted` (MVP-07)

Ao implementar cada MVP no DIA LD, atualizar `eventLabels.ts` e esta documentação.

## Diferenças esperadas no DIA LD

| Aspecto | Piloto | DIA LD (sugestão) |
|---------|--------|-------------------|
| Storage | `sessionStorage` | API + fallback local |
| Participante | Código P01 | ID do LMS / sessão DIA |
| Painel debug | Visível | Só dev/staging |
| Export JSON | Download manual | Pipeline de dados |
| Reset dev | Automático no `npm run dev` | Não aplicar em produção |
| `source` | `react_mvp` | ex.: `dia_ld_web` |

## Testes de regressão ao portar

1. Entrar com participante → `session_started` + `book_opened`
2. Rolar até página 5 devagar → `page_viewed(5)` só quando barra sobe ao topo
3. Parar no meio da página 4 com página 5 no rodapé → **sem** `page_viewed(5)` nem `page_completed(5)`
4. Avançar 4→5 → `page_viewed(5)` **antes** de `page_completed(4)` no painel
5. Finalizar teste → `session_finished` com contagens corretas
6. Exportar JSON → todos os eventos presentes no `summary`

## Referências no repositório

- Roadmap: [RELATORIO-USO-LIVRO.md](./RELATORIO-USO-LIVRO.md)
- Spec MVP-01: [MVP-01-BASE.md](./MVP-01-BASE.md)
- Spec MVP-02: [MVP-02-JORNADA-LEITURA.md](./MVP-02-JORNADA-LEITURA.md)
- Labels UI: `src/analytics/eventLabels.ts`
- Catálogo de eventos: `src/analytics/eventTypes.ts`

## Manutenção da documentação

**Sempre que implementar ou ajustar analytics neste piloto:**

1. Atualizar o MVP correspondente em `docs/MVP-XX-*.md`
2. Atualizar tabela de eventos em `docs/RELATORIO-USO-LIVRO.md`
3. Registrar decisões no **Histórico de decisões** do MVP
4. Revisar [GUIA-MIGRACAO-DIA-LD.md](./GUIA-MIGRACAO-DIA-LD.md) se mudar contrato de eventos ou marcadores DOM
