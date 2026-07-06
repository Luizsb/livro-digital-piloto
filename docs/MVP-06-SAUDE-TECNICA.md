# MVP-06 — Saúde técnica na navegação

## Objetivo

Registrar problemas e métricas de performance **observados durante o uso real** do livro pelo participante — sem varredura automática de conteúdo nem manifesto de build.

## Fase 1 — Erros e tempo de carga

| event_name | Quando | Metadata principal |
|------------|--------|-------------------|
| `image_load_error` | Imagem rastreada (`TrackedImage`) falha ao carregar | `image_id`, `page`, `src` |
| `asset_load_error` | Script, CSS ou imagem sem rastreio falha no browser | `asset_type`, `src` |
| `runtime_error` | Erro de JS ou promise rejeitada na sessão | `error_message`, `source`, `line` |
| `render_error` | Error Boundary React | `boundary`, `page`, `error_message` |

**Timing de carga** (metadata em `book_opened` ou `session_resumed`):

- `page_load_time_ms` — até o evento `load`
- `dom_content_loaded_ms` — DOMContentLoaded
- `ttfb_ms` — Time to First Byte (primeiro byte da resposta)

Implementação: `captureLoadTiming.ts`, `useRuntimeErrorTracking.ts`, `AnalyticsErrorBoundary.tsx`, `TrackedImage.tsx`.

## Fase 2 — Peso observado e links

| event_name | Quando | Metadata principal |
|------------|--------|-------------------|
| `resource_timing_snapshot` | Uma vez ao **finalizar** ou **exportar** JSON | `session_bytes_transferred`, `session_image_bytes_transferred`, `resources_loaded_count`, `largest_images`, `bytes_from_cache_only` |
| `link_open_failed` | Clique em link interno (same-origin) com falha HTTP | `link_id`, `page`, `href`, `http_status` |

O snapshot também é copiado em `events_exported` e `session_finished` para redundância em JSONs antigos.

**Peso observado:** soma via `PerformanceResourceTiming` — apenas arquivos carregados na sessão. Cache pode zerar `transferSize` (`bytes_from_cache_only: true`).

**Links:** validação só em `external_link`, `qr_code` e `embedded_resource` com mesma origem; links externos ignorados (CORS).

Implementação: `captureResourceTiming.ts`, `resourceTimingSnapshot.ts`, `linkOpenValidation.ts`.

## Dashboard (LD Insights)

Seção **Saúde técnica na navegação**:

- Status do tempo de carregamento: Bom (≤2,5 s) · Moderado (≤4 s) · Lento
- Botão **(i)** em cada métrica com explicação (ex.: TTFB)
- Alertas técnicos na seção **Saúde da coleta** (problemas de carga, erros, links)

> **Distinção:** **Saúde técnica** (este MVP) = performance e erros na navegação. **Qualidade da coleta** = integridade e consistência dos eventos (`collectionQuality.ts`) — ver [CATÁLOGO-EVENTOS-E-RELATÓRIOS.md](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md#qualidade-da-coleta).

Enriquecimento: `technicalHealthSummary.ts` + `parseReport.ts`.

## Código

```text
src/ld/
  captureLoadTiming.ts
  captureResourceTiming.ts
  technicalHealthSummary.ts
  resourceTimingSnapshot.ts
  linkOpenValidation.ts
  useRuntimeErrorTracking.ts
src/components/AnalyticsErrorBoundary.tsx
src/dashboard/InfoHint.tsx
src/lib/formatBytes.ts
src/lib/loadTimeRating.ts
```
