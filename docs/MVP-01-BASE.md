# MVP-01 — Base de coleta

## Objetivo

Estabelecer a infraestrutura mínima de analytics no piloto: participante anônimo, sessão, exportação JSON e painel de debug.

## Eventos

### `session_started`

- **Quando:** participante informa código válido (`P01`, `P02`…)
- **Onde:** `AnalyticsProvider.tsx` (efeito após `setParticipantId`)
- **Deduplicação:** uma vez por `session_id`
- **Metadata:** ambiente de acesso (sem gravar user-agent bruto):

```json
{
  "device_type": "desktop",
  "device_type_label": "Computador",
  "os_name": "Windows",
  "browser_name": "Chrome",
  "browser_version": "125",
  "screen_width": 1920,
  "screen_height": 1080,
  "viewport_width": 1280,
  "viewport_height": 720,
  "is_touch_device": false,
  "app_language": "pt-BR",
  "browser_language": "en-US"
}
```

| Campo | Significado |
|-------|-------------|
| `app_language` | Idioma do livro (`<html lang="pt-BR">`) |
| `browser_language` | Idioma principal do navegador (`navigator.language`) — pode ser `en-US` mesmo com app em português |

| `device_type` | Label |
|---------------|--------|
| `desktop` | Computador |
| `tablet` | Tablet |
| `mobile` | Celular |

Implementação: `deviceContext.ts` → `captureSessionDeviceContext()`.

### `session_resumed`

- **Quando:** recarregamento da aba (F5) com sessão **ativa** (ainda não finalizada pelo botão)
- **Onde:** `AnalyticsProvider.tsx`
- **Deduplicação:** uma vez por carregamento após reload
- **Metadata:** `{}`

### `book_opened`

- **Quando:** capítulo é exibido após o gate
- **Onde:** `ParticipantGate.tsx`
- **Deduplicação:** uma vez por `session_id`
- **Metadata:** `{}`

### `events_exported`

- **Quando:** clique em exportar JSON (botão flutuante, tela de encerramento ou painel)
- **Onde:** `exportSessionReport.ts` (registrado **antes** do download)
- **Metadata:**

```json
{
  "export_count": 1,
  "event_count_at_export": 15,
  "export_source": "manual_button"
}
```

| `export_source` | Origem |
|-----------------|--------|
| `manual_button` | Botão flutuante no livro |
| `finish_screen` | Tela **Teste finalizado** |
| `floating_button` | Alias legado do botão flutuante |

## Gate de participante

- O prefixo **P** vem pré-preenchido; o participante digita apenas o **número** (ex.: `1` → `P01`, `12` → `P12`).
- Link **Abrir dashboard (LD Insights)** na tela de acesso (`#/dashboard`).
- Após **Finalizar teste**, a tela de encerramento oferece **Exportar relatório JSON** e **Iniciar novo teste** (não há retorno ao livro para consulta).

## Status da sessão (`sessionStatus.ts`)

| Status | Significado |
|--------|-------------|
| `not_started` | Sem participante na aba |
| `active` | Coleta em andamento |
| `finished` | Após **Finalizar teste** ou fechar a aba; novos eventos bloqueados (exceto `events_exported`) |

Persistido em `sessionStorage`. F5 com sessão ativa **não** finaliza (ver MVP-02).

## Componentes adicionados

| Componente | Arquivo |
|------------|---------|
| Gate de participante | `src/components/ParticipantGate.tsx` |
| Tela pós-finalização | `src/components/TestFinishedScreen.tsx` |
| Botão de exportação | `src/components/ExportEventsButton.tsx` |
| Painel de eventos | `src/components/EventsPanelButton.tsx` + `EventReportPanel.tsx` |
| Botão Fechar (modais) | `src/components/ClosePillButton.tsx` |

## Painel em tempo real (`EventReportPanel.tsx`)

Três blocos em **acordeão** (abrir um fecha os outros):

| Seção | Conteúdo |
|-------|----------|
| O que está sendo coletado? | Catálogo **ordenado** de todos os eventos ativos do piloto (25 tipos), com scroll e nota sobre métricas em metadata (TTFB, peso em bytes) |
| Resumo da coleta | Jornada, imagens, recursos, feedback, badges — com **timer de sessão** ao vivo |
| Log de eventos | Lista cronológica com cores/ícones por tipo |

- Botão **Fechar** do cabeçalho: `ClosePillButton` roxo, `aria-label="Fechar painel de eventos"`.
- Catálogo: ordem fixa em `eventLabels.ts` (`CATALOG_DISPLAY_ORDER`); descrições alinhadas à saúde técnica e encerramento.

- Timer: `useLiveSessionDuration.ts` (desde `session_started`; congela ao finalizar). **Conta apenas com a aba do livro visível** — pausa ao trocar de guia (`sessionVisibleTime.ts`, Page Visibility API). O tempo mínimo de `page_completed` também pausa fora da aba.
- Resumo recolhido: tempo em roxo + métricas compactas na mesma linha (sem duplicar abaixo).

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
  "chapter_manifest": {
    "book_id": "cap07_historia_ai43",
    "chapter_id": "cap07",
    "pages": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "expected_images": ["..."],
    "expected_resources": ["escola_digital_video", "oda_page_10_comercio"],
    "expected_teacher_buttons": ["..."],
    "expected_activities": []
  },
  "summary": {
    "data_quality_score": 92,
    "expected_images_count": 5,
    "image_exposure_coverage_rate": 100
  },
  "events": [ ]
}
```

Campos de **qualidade da coleta** e **cobertura do capítulo** são calculados automaticamente em `buildEventSummary()`. Ver [CATÁLOGO-EVENTOS-E-RELATÓRIOS.md](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md).

## Critérios de aceite (MVP-01)

- [x] Código `P01`–`P99` aceito no gate (prefixo P fixo na UI)
- [x] `session_started` ao entrar
- [x] `session_resumed` ao recarregar aba com sessão ativa
- [x] `book_opened` ao exibir o livro
- [x] Export JSON funcional (com `events_exported` antes do download)
- [x] Tela **Teste finalizado** após Finalizar teste
- [x] Painel em tempo real com labels em português
- [x] Painel com acordeão, timer de sessão e ícones por seção
- [x] Reset manual e automático em dev
- [x] Acesso ao dashboard a partir do gate
- [x] `summary` com qualidade da coleta e cobertura do manifest
