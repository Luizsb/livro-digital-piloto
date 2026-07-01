# MVP-03 — Interações com recursos do conteúdo

## Objetivo

Medir interações com imagens e links/recursos digitais do capítulo, sem alterar conteúdo pedagógico nem layout principal.

## Configuração editável

Todos os tempos e limiares numéricos estão em **`src/analytics/analyticsConfig.ts`**.

Documentação: [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md)

---

## Eventos

### `image_viewed` — Imagem exposta

**Significado:** a imagem entrou na viewport — exposição na tela, **não** engajamento ou atenção.

**Quando:** imagem do capítulo fica visível pela primeira vez na sessão.

**Regras:**

- Máximo **uma vez por `image_id` por sessão**
- Delay de **750 ms** (config: `image.viewDelayMs`)
- Threshold **50%** (config: `image.viewThreshold`)
- Cancela o timer se a imagem sair da viewport antes do delay

**Metadata:**

```json
{
  "image_id": "page_5_feira_rolo",
  "page": 5,
  "src": "images/page_3_img_295_487.png"
}
```

**Implementação:** `src/components/TrackedImage.tsx`

---

### `image_zoomed` — Zoom de imagem

**Quando:** participante clica em **Ampliar** na imagem.

**Regras:**

- Ação intencional (botão visível no hover/foco)
- **Permite múltiplos** zooms na mesma sessão
- Resumo diferencia total de zooms vs imagens únicas ampliadas

**Metadata:** igual a `image_viewed`.

**UI:** botão “Ampliar” + modal lightbox (não altera dimensões da imagem no fluxo do texto).

---

### `resource_opened` — Recurso aberto

**Quando:** clique para abrir ODA, Escola Digital, link externo ou QR.

### `resource_engagement_recorded` — Tempo no recurso

**Quando:** fechamento de modal (ODA, Escola Digital) com `duration_seconds`.

Labels no painel: **Recurso aberto** e **Tempo no recurso** (subtipo em metadata: ODA, Escola Digital, etc.).

**Metadata (abertura ODA):**

```json
{
  "link_id": "oda_page_10_comercio",
  "page": 10,
  "type": "oda_opened"
}
```

**Metadata (tempo no ODA ao fechar):**

```json
{
  "link_id": "oda_page_10_comercio",
  "page": 10,
  "type": "oda_engagement",
  "duration_seconds": 142
}
```

**Metadata (Escola Digital aberta):**

```json
{
  "link_id": "escola_digital_video",
  "page": 3,
  "type": "escola_digital_opened"
}
```

Com link externo / QR:

```json
{
  "link_id": "qr_page_8_video",
  "page": 8,
  "type": "qr_code",
  "href_domain": "youtube.com"
}
```

| `type` | Uso |
|--------|-----|
| `oda_opened` | Abrir ODA (pág. 10) |
| `oda_engagement` | Tempo no ODA ao fechar modal |
| `escola_digital_opened` | Abrir Escola Digital (pág. 3) |
| `escola_digital_engagement` | Tempo na Escola Digital ao fechar modal |
| `external_link` | `<TrackedLink href="...">` |
| `qr_code` | QR com URL |

**Importante:** o tempo no modal (`escola_digital_engagement`) mede quanto o participante manteve o modal aberto — distinto da reprodução do vídeo (eventos `video_*` abaixo).

---

### `video_started` — Reprodução iniciada

**Quando:** primeiro play intencional no vídeo da Escola Digital na sessão.

**Regras:**

- Máximo **uma vez por `video_id` por sessão**
- Disparado no evento `play` do elemento `<video>` (não na abertura do modal)

**Metadata:**

```json
{
  "link_id": "escola_digital_video",
  "page": 3,
  "video_id": "escola_digital_video",
  "type": "escola_digital_video"
}
```

---

### `video_completed` — Vídeo assistido até o fim

**Quando:** evento `ended` do `<video>` (reprodução natural até o final).

**Metadata:**

```json
{
  "link_id": "escola_digital_video",
  "page": 3,
  "video_id": "escola_digital_video",
  "type": "escola_digital_video",
  "watched_to_end": true,
  "watch_duration_seconds": 142,
  "video_duration_seconds": 142,
  "max_progress_percent": 100
}
```

---

### `video_progress_recorded` — Progresso parcial

**Quando:** participante fecha o modal ou encerra a sessão após dar play, **sem** assistir até o fim.

**Metadata:**

```json
{
  "link_id": "escola_digital_video",
  "page": 3,
  "video_id": "escola_digital_video",
  "type": "escola_digital_video",
  "watched_to_end": false,
  "watch_duration_seconds": 45,
  "video_duration_seconds": 142,
  "max_progress_percent": 32
}
```

---

## Componentes

| Componente | Função |
|------------|--------|
| `TrackedImage` | Imagem com view + zoom |
| `TrackedLink` | Link com `data-track-link-*` |
| `GameModal` + `analyticsResource` | `resource_opened` na abertura + `resource_engagement_recorded` ao fechar |
| `TrackedVideo` | Play, conclusão e progresso do vídeo Escola Digital |
| `SessionLifecycle` | `useLinkClickTracking()` |

## Imagens rastreadas no capítulo 07

| image_id | Página | Arquivo |
|----------|--------|---------|
| `page_5_feira_rolo` | 5 | `page_3_img_295_487.png` |
| `page_6_moedas_lidia` | 6 | `page_4_img_290_484.png` |
| `page_8_rota_seda` | 8 | `page_6_img_70_284.png` |
| `page_9_nau_cabral` | 9 | `page_7_img_300_309.png` |

## Recursos digitais

| link_id | Página | Abertura (`resource_opened`) | Tempo modal (`resource_engagement_recorded`) | Vídeo (`video_*`) |
|---------|--------|----------|-----------------|--------|
| `escola_digital_video` | 3 | `escola_digital_opened` | `escola_digital_engagement` | `video_started` / `video_completed` / `video_progress_recorded` |
| `oda_page_10_comercio` | 10 | `oda_opened` | `oda_engagement` | — |

## Painel e JSON

Seção **Interações com o conteúdo**:

- Imagens expostas (únicas)
- Zooms: total / únicos
- Links: cliques totais / recursos únicos
- **ODA:** aberturas + tempo total no modal (s)
- **Escola Digital:** aberturas + tempo no modal (s) + play / conclusão / progresso máximo do vídeo

`summary` do export inclui contadores de imagens, links, métricas ODA/Escola Digital e campos de vídeo (`escola_digital_video_*`) quando aplicável.

## Arquivos novos

- `src/analytics/contentInteractionTypes.ts`
- `src/analytics/contentInteractionTracking.ts`
- `src/analytics/contentInteractionsSummary.ts`
- `src/analytics/useLinkClickTracking.ts`
- `src/components/TrackedImage.tsx`
- `src/components/TrackedLink.tsx`
- `src/components/TrackedVideo.tsx`
- `src/analytics/videoTracking.ts`
- `src/analytics/videoInteractionTypes.ts`

## Critérios de aceite

- [x] Jornada de leitura (MVP-02) inalterada
- [x] `image_viewed` uma vez por imagem/sessão
- [x] `image_zoomed` em clique de ampliar
- [x] `resource_opened` / `resource_engagement_recorded` para ODA e Escola Digital
- [x] `video_started` / `video_completed` / `video_progress_recorded` para vídeo Escola Digital
- [x] Painel e export JSON com novos eventos
- [x] Labels em português

## Próximo passo

**MVP-06** — Atividades interativas (`activity_started` / `activity_completed`).

**Evoluções deste MVP:** registrar em [EVIDENCIAS.md](./EVIDENCIAS.md) a cada entrega.
