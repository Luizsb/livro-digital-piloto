# MVP-04 — Feedback e encerramento do capítulo

## Objetivo

Coletar percepção do participante e diferenciar **finalização do fluxo** (`chapter_finished`) de **conclusão pedagógica** (`chapter_completed`) e **fim da sessão** (`session_finished`).

## Eventos

### `feedback_submitted` — Feedback enviado

**Quando:** participante envia o formulário (`ChapterFeedback.tsx`).

**Metadata do evento (sem texto aberto):**

```json
{
  "rating": 4,
  "navigation_clarity": 5,
  "visual_comfort": 4,
  "resource_usefulness": 5,
  "would_use_again": "sim",
  "has_comment": true,
  "comment_length": 80
}
```

**Comentários** ficam em estrutura separada no export:

```json
"feedback_comments": [
  {
    "participant_id": "P10",
    "session_id": "...",
    "comment": "texto do comentário",
    "submitted_at": "..."
  }
]
```

---

### `chapter_finished` — Capítulo finalizado

**Quando:** clique em **Finalizar teste**.

Significa que o usuário encerrou o fluxo — **não** implica leitura completa.

```json
{
  "pages_viewed_count": 10,
  "pages_completed_count": 4,
  "total_pages": 10,
  "completion_rate": 40,
  "last_page_viewed": 12,
  "finish_source": "finish_button",
  "reading_depth": "quick_scan",
  "reading_depth_label": "Varredura rápida",
  "completion_status": "partial"
}
```

| `completion_status` | Regra (MVP) |
|---------------------|-------------|
| `completed` | Todas as páginas vistas e taxa ≥ 70% |
| `partial` | Todas vistas, taxa &lt; 70%, leitura não muito rápida |
| `quick_finished` | Todas vistas, taxa &lt; 70%, `very_quick` ou `quick_scan` |
| `abandoned` | Nem todas as páginas visualizadas |

---

### `chapter_completed` — Capítulo concluído

**Quando:** **Finalizar teste** e critério mínimo atingido:

- todas as páginas visualizadas (`total_pages` = 10);
- taxa de conclusão ≥ `chapter.minCompletionRateForChapterCompleted` (padrão **70%**).

Critério numérico configurável em `analyticsConfig.ts` — ver [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md).

Se o usuário viu tudo mas concluiu só 40% das páginas → `chapter_finished` com `partial`, **sem** `chapter_completed`.

**Metadata (exemplo quando critério atingido):**

```json
{
  "pages_viewed_count": 10,
  "pages_completed_count": 7,
  "total_pages": 10,
  "completion_rate": 70,
  "reading_depth": "moderate_reading",
  "reading_depth_label": "Leitura moderada",
  "completion_status": "completed",
  "finish_source": "finish_button"
}
```

**Summary:** `chapter_completed_count: 1` somente quando o evento foi disparado; caso contrário permanece `0` (com `chapter_finished_count: 1`).

---

### Ordem ao clicar em Finalizar teste

1. `page_completed` da página ativa (se aplicável)
2. `chapter_finished`
3. `chapter_completed` (somente se critério)
4. `session_finished`

(`feedback_submitted` só se o usuário já enviou o formulário antes.)

---

### `session_finished` — Sessão finalizada

Fim da sessão de teste. Inclui `reading_depth` (técnico) e `reading_depth_label` (português).

Ao **fechar a aba**: apenas `page_completed` + `session_finished` (sem eventos de capítulo).

---

### `events_exported` — Eventos exportados

Registrado **antes** de montar o JSON de download.

```json
{
  "event_count_before_export": 29,
  "export_format": "json",
  "export_source": "manual_button"
}
```

## Configuração

`src/analytics/analyticsConfig.ts` → `chapter.totalPages`, `chapter.minCompletionRateForChapterCompleted`

## Critérios de aceite

- [x] `chapter_finished` ao finalizar teste
- [x] `chapter_completed` só com critério mínimo
- [x] Comentário fora do evento principal (`feedback_comments` no export)
- [x] `events_exported` incluído no JSON exportado
- [x] `reading_depth_label` em português no painel e export

## Próximo passo

**MVP-05** — Botão do professor (`teacher_button_opened`).
