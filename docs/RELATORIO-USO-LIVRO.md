# Relatório de uso do livro digital — piloto por fases

Projeto independente em `Documentos/livro-digital-piloto`. O **livro-bett** permanece intacto.

**Documentação detalhada por MVP:**

| MVP | Documento | Status |
|-----|-----------|--------|
| MVP-01 | [MVP-01-BASE.md](./MVP-01-BASE.md) | ✅ Implementado |
| MVP-02 | [MVP-02-JORNADA-LEITURA.md](./MVP-02-JORNADA-LEITURA.md) | ✅ Implementado |
| MVP-03 | [MVP-03-INTERACOES-CONTEUDO.md](./MVP-03-INTERACOES-CONTEUDO.md) | ✅ Implementado |
| MVP-04 | [MVP-04-FEEDBACK.md](./MVP-04-FEEDBACK.md) | ✅ Implementado |
| Migração DIA LD | [GUIA-MIGRACAO-DIA-LD.md](./GUIA-MIGRACAO-DIA-LD.md) | Referência para portar |
| Dashboard | [DASHBOARD-MVP.md](./DASHBOARD-MVP.md) | LD Insights — visualizar JSON |
| Configuração | [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md) | **Limiares e tempos editáveis** |
| **Evidências / evolução** | **[EVIDENCIAS.md](./EVIDENCIAS.md)** | **Histórico de mudanças — manter atualizado** |

## Como rodar

```bash
npm install
npm run dev
```

| URL | Efeito |
|-----|--------|
| `http://localhost:5173/` | Piloto |
| `http://localhost:5173/?reset=1` | Nova sessão — apaga eventos e pede código |

Em **desenvolvimento**, os dados são zerados automaticamente a cada reinício do `npm run dev` (plugin `devSessionPlugin` no `vite.config.ts`). Recarregue a aba após reiniciar o servidor.

## Arquitetura atual

```text
App.tsx
  ├── AnalyticsProvider          ← contexto de sessão + track() + sessionStatus
  ├── ParticipantGate            ← código P + número; link LD Insights
  │     └── TestFinishedScreen   ← após Finalizar teste
  ├── SessionLifecycle           ← session_finished ao fechar aba (não no F5)
  ├── Book.tsx                   ← conteúdo do capítulo
  │     ├── BookPageTracker      ← marcador página 3 + hook de tracking
  │     └── data-page-end="12"   ← fim da última página (Book.tsx)
  └── Controles (fixos, canto inferior esquerdo)
        ├── EventsPanelButton    ← painel em tempo real
        ├── FinishTestButton     ← encerramento formal do teste
        ├── ExportEventsButton   ← download JSON
        └── LD Insights          ← link #/dashboard
```

## Eventos implementados

| event_name | Label (painel) | MVP | Ativo |
|------------|----------------|-----|-------|
| `session_started` | Sessão iniciada | 01 | ✅ |
| `session_resumed` | Sessão retomada (F5) | 01 | ✅ |
| `book_opened` | Livro aberto | 01 | ✅ |
| `page_viewed` | Página visualizada | 02 | ✅ |
| `page_completed` | Página concluída | 02 | ✅ |
| `session_finished` | Sessão finalizada | 02 | ✅ |
| `events_exported` | Eventos exportados | 01 | ✅ |
| `image_viewed` | Imagem exposta (viewport) | 03 | ✅ |
| `image_zoomed` | Zoom de imagem | 03 | ✅ |
| `resource_opened` | Recurso aberto | 03 | ✅ |
| `resource_engagement_recorded` | Tempo no recurso | 03 | ✅ |
| `video_started` | Vídeo iniciado | 03 | ✅ |
| `video_completed` | Vídeo concluído | 03 | ✅ |
| `video_progress_recorded` | Progresso do vídeo | 03 | ✅ |
| `feedback_submitted` | Feedback enviado | 04 | ✅ |
| `chapter_finished` | Capítulo finalizado | 04 | ✅ |
| `chapter_completed` | Capítulo concluído | 04 | ✅ |
| `image_load_error` | Erro ao carregar imagem | 03 | ⏳ |
| `teacher_button_opened` | Botão do professor aberto | 05 | ✅ |
| `teacher_button_closed` | Botão do professor fechado | 05 | ✅ |
| `activity_started` | Atividade iniciada | 06 | ⏳ |
| `activity_completed` | Atividade concluída | 06 | ⏳ |
| `accessibility_changed` | Acessibilidade alterada | 07 | ⏳ |

Definições, metadados e regras de disparo: ver [MVP-02-JORNADA-LEITURA.md](./MVP-02-JORNADA-LEITURA.md) e `src/analytics/eventLabels.ts`.

## Camada `src/analytics/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `eventTypes.ts` | Nomes de eventos, chaves de storage, tipos |
| `eventLabels.ts` | Labels em português para o painel |
| `trackEvent.ts` | Persistência em `sessionStorage` + notificação em tempo real |
| `AnalyticsProvider.tsx` | Contexto React (`track`, `sessionId`, participante) |
| `sessionDedup.ts` | Deduplicação por sessão (`trackOncePerSession`) |
| `resetAnalytics.ts` | Bootstrap, reset manual e reset em dev |
| `exportEvents.ts` | Payload JSON de exportação |
| `eventSummary.ts` | Resumo agregado no export |
| `readingJourneySummary.ts` | Métricas de jornada (painel) |
| `bookPageScroll.ts` | **Regra de página ativa** (compartilhada com paginação) |
| `useBookPageTracking.ts` | `page_viewed` + `page_completed` |
| `chapterMetrics.ts` | Métricas e critérios de `chapter_finished` / `chapter_completed` |
| `finishSession.ts` | Fluxos de encerramento (botão vs. aba) |
| `sessionStatus.ts` | Status `not_started` / `active` / `finished` |
| `exportSessionReport.ts` | Export com `events_exported` antes do download |
| `useSessionFinishOnUnload.ts` | `session_finished` ao fechar aba (exceto F5) |
| `useLiveSessionDuration.ts` | Timer ao vivo no painel (desde `session_started`) |
| `deviceContext.ts` | Captura dispositivo, SO e navegador no `session_started` |
| `useStoredEvents.ts` | Hook para painel em tempo real |
| `sortAnalyticsEvents.ts` | Ordenação narrativa no painel |
| `analyticsConfig.ts` | **Parâmetros editáveis (tempos, limiares)** |
| `feedbackTracking.ts` | Evento `feedback_submitted` |
| `teacherButtonTracking.ts` | Eventos `teacher_button_opened` / `teacher_button_closed` |
| `modalResourceTracking.ts` | Tempo no modal ODA / Escola Digital ao fechar |
| `videoTracking.ts` | Play, conclusão e progresso do vídeo Escola Digital |
| `resourceEvents.ts` | Helpers para `resource_opened` / engajamento |

Ver [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md) para alterar critérios sem mexer na lógica.  
**Histórico de entregas:** [EVIDENCIAS.md](./EVIDENCIAS.md) — atualizar a cada mudança relevante.

## Dados

- **Armazenamento:** `sessionStorage` (por aba do navegador)
- **Privacidade:** sem nome, e-mail, CPF ou localização — apenas códigos `P01`, `P02`…
- **Identificadores:** `book_id`: `cap07_historia_ai43` · `chapter_id`: `cap07`
- **Source:** `react_mvp`

## Próximo passo

**MVP-06** — Atividades interativas (`activity_started` / `activity_completed`).
