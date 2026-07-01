# MVP-01 — Base de coleta

## Objetivo

Estabelecer a infraestrutura mínima de analytics no piloto: participante anônimo, sessão, exportação JSON e painel de debug.

## Eventos

### `session_started`

- **Quando:** participante informa código válido (`P01`, `P02`…)
- **Onde:** `AnalyticsProvider.tsx` (efeito após `setParticipantId`)
- **Deduplicação:** uma vez por `session_id`
- **Metadata:** `{}`

### `book_opened`

- **Quando:** capítulo é exibido após o gate
- **Onde:** `ParticipantGate.tsx`
- **Deduplicação:** uma vez por `session_id`
- **Metadata:** `{}`

### `events_exported`

- **Quando:** clique em "Exportar eventos (JSON)"
- **Onde:** `ExportEventsButton.tsx`
- **Metadata:**

```json
{
  "export_count": 1,
  "event_count_at_export": 15
}
```

## Componentes adicionados

| Componente | Arquivo |
|------------|---------|
| Gate de participante | `src/components/ParticipantGate.tsx` |
| Botão de exportação | `src/components/ExportEventsButton.tsx` |
| Painel de eventos | `src/components/EventsPanelButton.tsx` + `EventReportPanel.tsx` |

## Reset de sessão

| Mecanismo | Comportamento |
|-----------|---------------|
| `?reset=1` ou `?nova_sessao=1` | Limpa storage e pede código de novo |
| Link "Limpar e começar de novo" | `reloadForNewSession()` no gate |
| Reinício do `npm run dev` | Limpa automaticamente em modo dev (`vite.config.ts`) |

## Formato de exportação

Ver exemplo completo em [MVP-02-JORNADA-LEITURA.md](./MVP-02-JORNADA-LEITURA.md#formato-do-json-exportado).

Campos principais do payload:

```json
{
  "exported_at": "ISO-8601",
  "book_id": "cap07_historia_ai43",
  "chapter_id": "cap07",
  "event_count": 0,
  "summary": { },
  "events": [ ]
}
```

## Critérios de aceite (MVP-01)

- [x] Código `P01`–`P99` aceito no gate
- [x] `session_started` ao entrar
- [x] `book_opened` ao exibir o livro
- [x] Export JSON funcional
- [x] Painel em tempo real com labels em português
- [x] Reset manual e automático em dev
