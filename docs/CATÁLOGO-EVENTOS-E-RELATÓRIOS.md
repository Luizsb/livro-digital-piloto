# Catálogo de eventos e relatórios — Livro Digital Piloto

Documento único de referência para **aprofundamento**, **design de relatórios** e **uso com ferramentas de IA** (ex.: ChatGPT). Consolida o que o piloto coleta hoje, como interpretar e para quem serve cada métrica.

**Piloto atual:** capítulo 07 História (`book_id`: `cap07_historia_ai43`, `chapter_id`: `cap07`) · **25 eventos ativos**

---

## Como usar este documento

| Objetivo | Onde olhar |
|----------|------------|
| Ver eventos ao vivo no livro | Botão **Ver eventos** → seção *O que está sendo coletado?* |
| Exportar dados brutos | Botão **Exportar eventos JSON** |
| Visualizar relatório pronto | **LD Insights** → `http://localhost:5173/#/dashboard` |
| Validar confiabilidade dos dados | Seção **Qualidade da coleta** no LD Insights + campos `data_quality_*` no `summary` |
| Comparar uso vs inventário do capítulo | `chapter_manifest` no export + seção **Cobertura do capítulo** |
| Código-fonte (nomes técnicos) | `src/ld/sessionTypes.ts`, `src/ld/sessionLabels.ts`, `src/ld/collectionQuality.ts`, `src/ld/chapterManifest.ts` |
| Detalhe por MVP | Links na seção [Documentação relacionada](#documentação-relacionada) |
| Colar contexto no ChatGPT | Seções [Modelo de dados](#modelo-de-dados-do-export), [Uso, atenção e aprendizagem](#uso-atenção-e-aprendizagem), [Catálogo de eventos](#catálogo-de-eventos-ativos) e [Relatórios por público](#relatórios-por-público) |

### Prompt sugerido para IA

```text
Contexto: piloto de livro digital com coleta em JSON (summary + events[] + feedback_comments).
Sem PII — participantes anônimos (P01, P02…).
Tempo de leitura principal: visible_time_seconds (aba visível), não relógio de parede.
25 eventos ativos (sessão, jornada, conteúdo, professor, feedback, saúde técnica).
Medem uso, exposição, interação e sinais de engajamento — NÃO aprendizagem nem compreensão.
Antes de interpretar KPIs, verifique data_quality_score e event_integrity_status no summary.
Anexo: summary de uma sessão exportada + este catálogo.

Tarefa: [ex.: propor KPIs para professores / relatório de turma / indicadores para editorial]
```

---

## Uso, atenção e aprendizagem

Regra conceitual para **relatórios, dashboards, IA e comunicação com escolas**. Três camadas distintas — não misturar na interpretação.

> **Os eventos atuais medem uso, exposição, interação e sinais de engajamento. A camada de aprendizagem só deve ser considerada após implementação controlada das atividades e validação jurídica/pedagógica.**

### As três camadas

| Camada | O que significa | O piloto mede hoje? |
|--------|-----------------|---------------------|
| **Uso** | Acesso, navegação, abertura de recursos, tempo com aba visível | ✅ Sim — núcleo dos 25 eventos |
| **Atenção** (proxy) | Permanência, exposição na tela, interação intencional (zoom, play, modal) | ⚠️ Parcial — sinais, não cognição |
| **Aprendizagem** | Compreensão, domínio, desempenho, dificuldade cognitiva, habilidade | ❌ Não — requer camada de atividades |

### O que dá para afirmar hoje

Com os eventos atuais, é correto dizer que o participante:

| Afirmação | Eventos / métricas relacionados |
|-----------|-----------------------------------|
| Acessou o livro | `session_started`, `book_opened` |
| Permaneceu com a aba visível | `visible_time_seconds`, `page_completed` (tempo pausa fora da aba) |
| Percorreu páginas | `page_viewed`, jornada no dashboard |
| Concluiu páginas por critério de tempo | `page_completed`, `completion_rate` |
| Abriu recursos digitais | `resource_opened`, ODA, Escola Digital |
| Deu play em vídeo | `video_started` |
| Assistiu parcial ou completo | `video_progress_recorded`, `video_completed` |
| Interagiu com imagem (zoom) | `image_zoomed` (além de `image_viewed` = exposição) |
| Abriu o botão do professor | `teacher_button_opened` / `teacher_button_closed` |
| Deu feedback sobre a experiência | `feedback_submitted` |

**Exposição ≠ atenção:** `image_viewed` indica que o asset entrou na tela, não que o participante prestou atenção ou compreendeu.

**Profundidade de leitura** (`reading_depth`) é classificação de **tempo visível por página** — proxy de engajamento com o texto, não de aprendizagem.

### O que ainda não dá para afirmar

Mesmo com boa cobertura do manifest ou alto `completion_rate`, **não** use estes eventos para concluir que o participante:

- aprendeu;
- compreendeu o conteúdo;
- teve bom desempenho pedagógico;
- dominou o conteúdo ou uma habilidade;
- teve dificuldade cognitiva real.

Feedback (`rating`, comentários) expressa **percepção e satisfação**, não avaliação de aprendizagem.

### Camada futura: atividades e aprendizagem

O documento de roadmap prevê eventos dedicados, ainda **não ativos** neste piloto:

| event_name (planejado) | Uso previsto |
|------------------------|--------------|
| `activity_viewed` | Atividade exibida ao participante |
| `activity_started` | Início explícito da atividade |
| `activity_answer_changed` | Mudança de resposta (sem texto aberto cru no evento principal) |
| `activity_submitted` | Envio da tentativa |
| `activity_completed` | Conclusão com critério definido |

**Antes de aplicar com alunos reais:** validação **pedagógica** (o que cada evento representa) e **jurídica** (LGPD, menores, retenção de respostas). Não persistir texto livre de respostas sem política explícita.

### Mapa rápido: métrica → camada

| Métrica / evento | Uso | Atenção (proxy) | Aprendizagem |
|------------------|-----|-----------------|--------------|
| `page_viewed` | ✅ | — | — |
| `page_completed` | ✅ | ✅ tempo mínimo | — |
| `reading_depth` | ✅ | ✅ | — |
| `image_viewed` | ✅ exposição | — | — |
| `image_zoomed` | ✅ | ✅ interação | — |
| `video_*` | ✅ | ✅ | — |
| `resource_*` | ✅ | ✅ tempo no modal | — |
| `teacher_button_*` | ✅ | ✅ | — |
| `feedback_submitted` | ✅ | — | — |
| `chapter_completed` | ✅ critério de percurso | — | — |
| Atividades (futuro) | ✅ | ✅ | ⚠️ só após validação |

---

## Modelo de dados do export

Arquivo gerado por **Exportar eventos JSON** (`src/ld/exportEvents.ts`):

```text
{
  exported_at, exported_at_br, timezone,
  book_id, chapter_id, event_count,
  chapter_manifest: { ... inventário do capítulo ... },
  summary: { ... agregados + cobertura ... },
  events: [ { event_id, event_name, timestamp, session_id, participant_id,
              book_id, chapter_id, source, metadata } ],
  feedback_comments: [ { session_id, participant_id, comment, submitted_at, ... } ]
}
```

| Camada | Uso |
|--------|-----|
| **`chapter_manifest`** | Inventário do que o capítulo **deveria** conter (páginas, imagens, recursos…) — distinto dos eventos |
| **`events[]`** | Trilha cronológica — análise fina, sequência, debugging |
| **`summary`** | Agregados da sessão — dashboards, KPIs, comparações, **qualidade da coleta** |
| **`feedback_comments`** | Comentários à parte (privacidade; não vão no evento principal) |

**Armazenamento:** `sessionStorage` do navegador (por aba). **Não há backend centralizado** neste piloto — cada participante exporta manualmente.

**Privacidade:** sem nome, e-mail, CPF ou geolocalização. Identificador: `participant_id` (`P01`, `P02`…).

---

## Campos principais do `summary`

| Grupo | Campos | Origem |
|-------|--------|--------|
| **Identificação** | `book_id`, `chapter_id`, `participant_ids`, `session_ids`, `total_events` | Agregação |
| **Jornada** | `pages_viewed`, `pages_completed`, `pages_viewed_count`, `pages_completed_count`, `completion_rate`, `last_page_viewed`, `abandoned_before_end`, `abandonment_page` | `page_viewed` / `page_completed` + derivados em `session_finished` |
| **Tempo** | `duration_seconds`, `visible_time_seconds`, `hidden_time_seconds`, `visible_time_ratio`, `visibility_change_count`, `idle_time_seconds` | `session_finished` + `idle_started` / `idle_finished` |
| **Profundidade** | `reading_depth`, `reading_depth_label` | `session_finished` (baseado em tempo **visível**) |
| **Imagens** | `images_viewed_unique`, `images_viewed_unique_count`, `image_zoom_total`, `image_zoom_unique_count`, `images_with_errors` | eventos de imagem |
| **Recursos** | `resources_opened_total`, `oda_opened_count`, `oda_engagement_total_seconds`, `escola_digital_*`, `escola_digital_video_*` | MVP-03 |
| **Professor** | `teacher_button_opened_count`, `teacher_button_total_seconds`, `teacher_button_usage_by_section`, `most_opened_teacher_section` | MVP-05 |
| **Feedback** | `feedback`, `feedback_count` | `feedback_submitted` + `feedback_comments` |
| **Capítulo** | `chapter_finished_count`, `chapter_completed_count`, `chapter_*_page` | MVP-04 |
| **Ambiente** | `device_type`, `os_name`, `browser_name`, `screen_*`, `viewport_*`, `app_language`, `browser_language` | `session_started` |
| **Saúde técnica** | `page_load_time_ms`, `ttfb_ms`, `session_bytes_transferred`, `runtime_errors_count`, `has_technical_issues`, … | MVP-06 |
| **Qualidade da coleta** | `data_quality_score`, `event_integrity_status`, `missing_expected_events`, `duplicate_event_warnings`, `inconsistent_event_warnings`, `unexpected_event_warnings` | `collectionQuality.ts` |
| **Cobertura do capítulo** | `expected_*_count`, `*_coverage_rate`, `pages_not_viewed`, `images_not_exposed`, `resources_not_opened`, `teacher_buttons_not_used`, `activities_not_started` | `chapterManifest.ts` + eventos |

---

## Manifest do capítulo

O **manifest** descreve o que o capítulo **deveria conter** nesta versão do livro — não o que o usuário fez. Isso muda o tipo de análise:

| Sem manifest | Com manifest |
|--------------|--------------|
| “O usuário viu 5 imagens.” | “O capítulo tinha 5 imagens rastreáveis e o usuário foi exposto a 5/5.” |
| “Nenhuma atividade foi iniciada.” | “Este capítulo não possui atividades interativas rastreáveis nesta versão.” |

**Código:** `src/ld/chapterManifest.ts` → `CHAPTER_MANIFEST_REGISTRY`  
**Export:** objeto `chapter_manifest` na raiz do JSON  
**Dashboard:** seção **Cobertura do capítulo** no LD Insights

### Estrutura do manifest (cap. 07 piloto)

```json
{
  "book_id": "cap07_historia_ai43",
  "chapter_id": "cap07",
  "pages": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "expected_images": [
    "page_3_abertura_rialto",
    "page_5_feira_rolo",
    "page_6_moedas_lidia",
    "page_8_rota_seda",
    "page_9_nau_cabral"
  ],
  "expected_resources": [
    "escola_digital_video",
    "oda_page_10_comercio"
  ],
  "expected_teacher_buttons": [
    "teacher_section_page_3",
    "teacher_section_page_4",
    "teacher_section_page_7",
    "teacher_section_page_8",
    "teacher_section_page_10",
    "teacher_section_page_11",
    "teacher_section_page_12"
  ],
  "expected_activities": []
}
```

Ao portar um novo capítulo, alinhe o manifest ao HTML (`Book.tsx`, `TrackedImage`, `TeacherButton`, recursos).

### Campos de cobertura no `summary`

```json
{
  "expected_pages_count": 10,
  "expected_images_count": 5,
  "expected_resources_count": 2,
  "expected_teacher_buttons_count": 7,
  "expected_activities_count": 0,
  "pages_viewed_coverage_rate": 100,
  "pages_completed_coverage_rate": 80,
  "image_exposure_coverage_rate": 100,
  "resource_open_coverage_rate": 50,
  "teacher_button_usage_coverage_rate": 29,
  "activity_start_coverage_rate": null,
  "pages_not_viewed": [],
  "images_not_exposed": [],
  "resources_not_opened": ["oda_page_10_comercio"],
  "teacher_buttons_not_used": ["teacher_section_page_4", "..."],
  "activities_not_started": []
}
```

| Campo | Significado |
|-------|-------------|
| `expected_*_count` | Quantidade prevista no manifest |
| `*_coverage_rate` | % do inventário atingido na sessão (`null` quando `expected_*_count` = 0) |
| `*_not_*` / `pages_not_viewed` | Itens do inventário não alcançados — útil para QA e editorial |

> **Distinção:** **Manifest** = inventário editorial · **Eventos** = o que aconteceu · **Qualidade da coleta** = se os eventos são confiáveis.

---

## Qualidade da coleta

Antes de interpretar dados pedagógicos ou comparar sessões (5, 10, 30 ou 100 participantes), valide se a trilha de eventos está **íntegra e confiável**.

**Onde aparece:**

| Local | O que mostra |
|-------|----------------|
| **`summary` do export** | Score, status e listas de avisos (sempre calculados no export) |
| **LD Insights** | Seção **Qualidade da coleta** — score, badge de status, checks por categoria e avisos detalhados |
| **Saúde da coleta** (dashboard) | Checklist rápido do ciclo de vida (`session_started` → `events_exported`) |

**Código:** `src/ld/collectionQuality.ts` · integrado em `sessionSummary.ts` e `parseReport.ts` (JSONs antigos são revalidados ao carregar).

### Campos no `summary`

```json
{
  "data_quality_score": 92,
  "event_integrity_status": "ok",
  "missing_expected_events": [],
  "duplicate_event_warnings": [],
  "inconsistent_event_warnings": [],
  "unexpected_event_warnings": []
}
```

| Campo | Tipo | Significado |
|-------|------|-------------|
| `data_quality_score` | 0–100 | Pontuação geral de confiabilidade da sessão |
| `event_integrity_status` | `ok` \| `warning` \| `error` | `ok` = confiável · `warning` = atenção · `error` = comprometida |
| `missing_expected_events` | `string[]` | Eventos do ciclo de vida esperados mas ausentes |
| `duplicate_event_warnings` | `string[]` | Eventos que deveriam ocorrer uma vez por sessão, mas repetiram |
| `inconsistent_event_warnings` | `string[]` | Sequência ou valores incoerentes entre eventos |
| `unexpected_event_warnings` | `string[]` | Nomes fora do catálogo ou eventos marcados como inativos |

### O que é validado

#### Sessão

| Regra | Falha típica |
|-------|----------------|
| Existe `session_started`? | Sessão sem início registrado |
| Existe `book_opened`? | Livro exibido sem evento de abertura |
| Existe `session_finished`? | Export sem encerramento de sessão |
| Existe `events_exported`? | Download sem registro de exportação |
| `session_id` é único? | Múltiplos IDs no mesmo arquivo |
| `participant_id` presente e válido (`P01`…)? | Código ausente ou fora do padrão |

#### Jornada

| Regra | Falha típica |
|-------|----------------|
| `page_completed` só em página com `page_viewed`? | Conclusão sem visualização |
| `completion_rate` bate com concluídas/visualizadas? | Summary inconsistente |
| `chapter_completed` só se critério mínimo atingido? | Conclusão pedagógica indevida |
| `chapter_finished` ao finalizar? | `session_finished` sem `chapter_finished` |

#### Conteúdo

| Regra | Falha típica |
|-------|----------------|
| `image_zoomed` com `image_viewed` correspondente? | Zoom sem exposição prévia |
| `video_completed` com `video_started`? | Conclusão de vídeo sem play |
| `video_progress_recorded` + `video_completed` no mesmo vídeo (≥95%)? | Redundância — aviso, não erro fatal |
| `resource_engagement_recorded` após `resource_opened`? | Tempo em recurso sem abertura |

#### Professor

| Regra | Falha típica |
|-------|----------------|
| `teacher_button_closed` com abertura correspondente? | Fechamento órfão |
| `teacher_button_total_seconds` = soma das durações? | Total divergente dos fechamentos |
| `teacher_button_usage_by_section` marca repetição? | `opened_more_than_once` inconsistente com `open_count` |

### Interpretação do score

| Faixa | `event_integrity_status` | Uso recomendado |
|-------|--------------------------|-----------------|
| ≥ 85 | `ok` | Incluir em relatórios e agregações de turma |
| 60–84 | `warning` | Interpretar com cautela; revisar avisos |
| < 60 ou falha crítica | `error` | Excluir da amostra ou investigar antes de concluir |

> **Distinção:** **Qualidade da coleta** = integridade dos eventos. **Saúde técnica** (MVP-06) = erros de carga, script e performance. **Alertas de interpretação** = comportamento de leitura (varredura rápida, saída da aba) — não indicam falha na coleta.

---

## Catálogo de eventos ativos

Legenda das colunas:

- **Metadata** — campos típicos em `event.metadata`
- **KPI / indicador** — o que medir no `summary` ou por agregação
- **Público** — A = aluno · P = professor · E = escola/coordenação · R = editorial/produção
- **Relatório** — visualização sugerida (hoje = LD Insights ou export; futuro = turma/BI)

---

### Sessão e ciclo de vida (MVP-01 / 02)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `session_started` | Sessão iniciada | Código válido (P01…) aceito | `device_type`, `os_name`, `browser_name`, `browser_version`, `screen_*`, `viewport_*`, `is_touch_device`, `app_language`, `browser_language` | % mobile vs desktop; SO/navegador | E, R | Ambiente de acesso (dashboard) |
| `session_resumed` | Sessão retomada | F5 com sessão ativa | `page_load_time_ms`, `dom_content_loaded_ms`, `ttfb_ms`, `load_trigger` | Recargas por sessão | R | Saúde técnica |
| `book_opened` | Livro aberto | Capítulo exibido após gate | timing de carga (idem acima) | Tempo até livro utilizável | R | Status carga Bom/Moderado/Lento |
| `session_finished` | Sessão finalizada | Fechar aba ou **Finalizar teste** | `duration_seconds`, `visible_time_seconds`, `hidden_time_seconds`, `visible_time_ratio`, `visibility_change_count`, `pages_viewed_count`, `pages_completed_count`, `avg_seconds_per_viewed_page`, `avg_seconds_per_completed_page`, `reading_depth`, `reading_depth_label`, peso observado* | Tempo visível; profundidade; conclusão | P, E, R | Cards de tempo + insight (dashboard) |
| `events_exported` | Eventos exportados | Download do JSON | `event_count_before_export`, peso observado* | Taxa de exportação em piloto | E | Qualidade da coleta |

\* Peso: `session_bytes_transferred`, `resources_loaded_count`, `largest_images`, etc.

---

### Jornada de leitura (MVP-02)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `page_viewed` | Página visualizada | Marcador `data-book-page` cruza gatilho de scroll (1× por página/sessão) | `page` | Cobertura; funil por página | P, E, R | Jornada (emoji por página no dashboard) |
| `page_completed` | Página concluída | ≥5 s visível na aba** ou encerramento na página | `page`, `duration_seconds`, `completion_reason` | Taxa de conclusão **de páginas**; tempo por página | P, E, R | `completion_rate` no summary; exibir como “Taxa de conclusão de páginas” |

**Abandono (derivado, sem evento novo):** `last_page_viewed` (última página cronológica), `abandoned_before_end` (`pages_viewed_count < total`), `abandonment_page` (última página quando abandonou). Presentes em `chapter_finished`, `session_finished` e `summary`.

**Inatividade (aba visível):** `idle_started` / `idle_finished` (eventos) e `idle_time_seconds` (agregado em `session_finished`). Limiar: `ldConfig.idle.thresholdSeconds` (padrão 60 s).

** Regra atual: `ldConfig.page.completeMinSeconds` (padrão 5 s). Tempo pausa fora da aba.

**Profundidade de leitura** (`reading_depth`): derivada de `visible_time_seconds ÷ pages_viewed_count`. No dashboard, exibir sempre a explicação: *“Classificação baseada no tempo visível médio por página visualizada.”*

| Valor | Label | Média por página visualizada |
|-------|-------|---------------------------|
| `very_quick` | Leitura rápida | 0–5 s |
| `quick_scan` | Varredura rápida | 6–15 s |
| `moderate_reading` | Leitura moderada | 16–40 s |
| `deep_reading` | Leitura aprofundada | >40 s |

---

### Conteúdo — imagens e recursos (MVP-03)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `image_viewed` | Imagem exposta | ≥50% da imagem na viewport por ~750 ms | `image_id`, `page`, `src` | Cobertura de imagens vistas | R | Exposição vs zoom |
| `image_zoomed` | Zoom de imagem | Clique em **Ampliar** | `image_id`, `page`, `src` | Interesse por imagem | P, R | Imagens com mais zoom |
| `image_load_error` | Erro ao carregar imagem | Falha em `TrackedImage` | `image_id`, `page`, `src` | Assets quebrados | R | Alerta técnico |
| `resource_opened` | Recurso aberto | Abertura ODA, Escola Digital, link, QR | `link_id`, `page`, `type`, `href` | Adoção de recursos | P, E, R | Recursos externos (dashboard) |
| `resource_engagement_recorded` | Tempo no modal | Fechamento de modal ODA / Escola Digital | `link_id`, `page`, `type`, `duration_seconds` | Tempo com modal aberto (ODA / Escola Digital) | P, R | **Não** confundir com tempo assistido no vídeo |
| `video_started` | Vídeo iniciado | Play no vídeo Escola Digital | `video_id`, `page`, `type`, `video_duration_seconds` | Taxa de play | P, R | Funil vídeo |
| `video_completed` | Vídeo concluído | `ended` do vídeo | idem + `watch_duration_seconds`, `max_progress_percent` | **Vídeo concluído** (sim/não) | P, R | Distinto de tempo no modal |
| `video_progress_recorded` | Progresso do vídeo | Fechar sem terminar / fim de sessão | `watch_duration_seconds`, `max_progress_percent`, `watched_to_end` | **Tempo assistido** + **Progresso máximo** | P, R | Três métricas de vídeo separadas do modal |

**Imagens rastreadas no cap. 07:** `page_5_feira_rolo`, `page_6_moedas_lidia`, `page_8_rota_seda`, `page_9_nau_cabral`, `page_3_abertura_rialto` (capa).

**Recursos digitais:** `escola_digital_video` (pág. 3), `oda_page_10_comercio` (pág. 10).

> **Interpretação:** `image_viewed` = **Imagem exposta** na viewport — **não** representa atenção, apenas exposição na tela. `image_zoomed` = interação intencional.

> **Vídeo vs modal:** `resource_engagement_recorded` = **Tempo no modal**. Para o player: **Tempo assistido**, **Progresso máximo**, **Vídeo concluído** (`video_*`).

---

### Botão do professor (MVP-05)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `teacher_button_opened` | Botão professor aberto | Abre modal Para o Professor | `section_id`, `teacher_button_id`, `page` | Seções mais consultadas | P | Uso por página |
| `teacher_button_closed` | Botão professor fechado | Fecha modal | + `duration_seconds` | Tempo no material docente | P, E | Tempo total e por seção |

`summary.teacher_button_usage_by_section`: visão **obrigatória** por seção — aberturas (`open_count`), fechamentos, segundos (`total_seconds`), média e `opened_more_than_once` (repetição na mesma página). Mais útil que só totais agregados.

Exemplo:

```json
{
  "teacher_button_usage_by_section": [
    {
      "section_id": "teacher_section_page_10",
      "page": 10,
      "open_count": 2,
      "total_seconds": 11,
      "opened_more_than_once": true
    }
  ]
}
```

---

### Feedback e encerramento pedagógico (MVP-04)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `feedback_submitted` | Feedback enviado | Envio do formulário | `rating`, `navigation_clarity`, `visual_comfort`, `resource_usefulness`, `would_use_again` | NPS-like; satisfação | E, R | Cards feedback (dashboard) |
| `chapter_finished` | Capítulo finalizado | Botão **Finalizar teste** | métricas de capítulo, `reading_depth`, `completion_status` | Taxa de finalização | E | Status do capítulo |
| `chapter_completed` | Capítulo concluído | Finalizar + critério mínimo*** | idem | Conclusão pedagógica | E, R | Badge “Capítulo concluído” |

\*** Critério:** todas as páginas visualizadas + ≥70% concluídas (`ldConfig` / `chapterPageConfig`).

Comentários livres: array `feedback_comments` (exibir sob demanda no dashboard).

---

### Saúde técnica (MVP-06)

| event_name | Label | Quando dispara | Metadata principal | KPI | Público | Relatório sugerido |
|------------|-------|----------------|-------------------|-----|---------|-------------------|
| `asset_load_error` | Asset não carregou | Script/CSS/imagem sem rastreio falha | `asset_type`, `src` | Falhas de entrega | R | Alerta técnico |
| `runtime_error` | Erro de script | Exceção JS / promise rejeitada | `error_message`, `source`, `line` | Estabilidade | R | Contagem erros |
| `render_error` | Erro de renderização | Error Boundary | `boundary`, `page`, `error_message` | Telas quebradas | R | Página + componente |
| `link_open_failed` | Link interno quebrado | Link same-origin com HTTP erro | `link_id`, `page`, `href`, `http_status` | Links mortos no livro | R | Lista para correção |
| `resource_timing_snapshot` | Peso observado | Finalizar sessão ou exportar | `session_bytes_transferred`, `session_image_bytes_transferred`, `resources_loaded_count`, `largest_images`, `bytes_from_cache_only` | Peso da sessão; imagens pesadas | R | MB transferidos; top imagens |

**Timing** (em `book_opened` / `session_resumed`): `page_load_time_ms`, `dom_content_loaded_ms`, `ttfb_ms`  
Classificação no dashboard: Bom ≤2,5 s · Moderado ≤4 s · Lento.

---

## Eventos planejados (ainda não ativos)

| event_name | Label | MVP previsto | Uso futuro |
|------------|-------|--------------|------------|
| `activity_viewed` | Atividade exibida | 07+ | Exposição à atividade interativa |
| `activity_started` | Atividade iniciada | 07+ | Início explícito (ODA, exercícios) |
| `activity_answer_changed` | Resposta alterada | 07+ | Tentativas sem texto aberto no evento principal |
| `activity_submitted` | Atividade enviada | 07+ | Submissão da tentativa |
| `activity_completed` | Atividade concluída | 07+ | Conclusão com critério / score |
| `accessibility_changed` | Acessibilidade alterada | 07 | Fonte, contraste, leitura em voz alta |
| `link_clicked` | Link acessado | — | Legado; substituído por `resource_opened` |

> Camada de **aprendizagem**: só interpretar após implementação controlada e validação pedagógica/jurídica (ver [Uso, atenção e aprendizagem](#uso-atenção-e-aprendizagem)).

---

## O que o LD Insights já exibe

| Seção | Dados |
|-------|-------|
| Cards principais | Participante, duração total, tempo visível, fora da aba, % visível, páginas, status, profundidade, feedback |
| Resumo interpretativo | Texto narrativo (usa **tempo visível**) |
| Ambiente de acesso | Dispositivo, SO, navegador, resolução |
| Saúde técnica | Carga, TTFB, peso, erros |
| **Qualidade da coleta** | Score 0–100, status de integridade, validações por categoria (sessão, jornada, conteúdo, professor), avisos detalhados |
| **Cobertura do capítulo** | Taxas de exposição/abertura/uso vs inventário do manifest; itens faltantes |
| Saúde da coleta | Checklist rápido do ciclo de vida da sessão |
| Jornada de leitura | Páginas 3–12 com status visual |
| Imagens / recursos / professor | Engajamento com conteúdo |
| Alertas | Varredura rápida, capítulo parcial, **saída da aba**, comentário aberto |

Ver [DASHBOARD-MVP.md](./DASHBOARD-MVP.md).

---

## Relatórios por público

### Aluno (A)

| Pergunta | Dado disponível hoje | Gap |
|----------|---------------------|-----|
| Onde parei de ler? | `pages_viewed`, última página ativa | Sem UI “meu progresso” para aluno |
| Quanto tempo estudei? | `visible_time_seconds` | Só no export / futuro painel aluno |
| Dei feedback? | `feedback_submitted` | Formulário no fim do capítulo |

**Relatório possível hoje:** individual via JSON + dashboard (uso interno, não exposto ao aluno).

---

### Professor (P)

| Pergunta | Eventos / summary |
|----------|-------------------|
| Quem leu até onde? | `pages_viewed`, `pages_completed`, jornada |
| Leitura superficial? | `reading_depth`, tempo visível por página |
| Usou ODA, vídeo, botão professor? | `resource_*`, `video_*`, `teacher_button_*` |
| Teve problema técnico? | saúde técnica, `image_load_error` |
| O que achou do livro? | `feedback` + comentários (satisfação, não aprendizagem) |
| O aluno aprendeu ou teve dificuldade cognitiva? | **Fora do escopo** — ver [Uso, atenção e aprendizagem](#uso-atenção-e-aprendizagem) |

**Relatórios sugeridos**

1. **Ficha do participante** — 1 JSON → LD Insights (já existe).
2. **Painel da turma** (futuro) — agregar N exports: média `completion_rate`, distribuição `reading_depth`, % que abriu ODA.
3. **Alertas para intervenção** — `quick_scan` + baixa `completion_rate` + `hidden_time_seconds` alto.

---

### Escola / coordenação (E)

| Indicador | Fonte |
|-----------|-------|
| Taxa de conclusão do capítulo | `chapter_completed`, `completion_rate` agregado |
| Tempo médio de leitura visível | `visible_time_seconds` |
| Adoção de recursos digitais | `oda_opened_count`, `escola_digital_*` |
| Perfil de dispositivos | `session_started` |
| Qualidade de entrega | `has_technical_issues`, TTFB, erros |
| Confiabilidade dos dados | `data_quality_score`, `event_integrity_status` — filtrar sessões antes de agregar |
| Satisfação | `feedback.rating`, `would_use_again` |

**Relatórios sugeridos**

1. **Resumo executivo da turma** — KPIs agregados + amostra de comentários.
2. **Comparativo antes/depois** — piloto vs. baseline (quando houver histórico).
3. **Infraestrutura** — % sessões com carga Lenta ou erros de asset.

---

### Editorial / produção do livro (R)

| Pergunta de produto | Dado |
|---------------------|------|
| Qual página abandona? | `page_viewed` sem `page_completed` |
| Qual imagem gera interesse? | `image_zoomed` por `image_id` + `image_exposure_coverage_rate` |
| O usuário viu todas as imagens do capítulo? | `images_not_exposed` vs manifest |
| ODA é usado e por quanto tempo? | `resource_opened` + `resource_engagement_recorded` |
| Vídeo é assistido até o fim? | `video_completed` vs `video_progress_recorded` |
| Conteúdo quebra em campo? | erros de carga, links, render |
| Livro pesado demais? | `session_bytes_transferred`, `largest_images` |
| Material do professor é consultado? | MVP-05 |

**Relatórios sugeridos**

1. **Heatmap de páginas** — visualizadas vs concluídas (multi-sessão).
2. **Ranking de recursos** — aberturas e tempo médio.
3. **Relatório de qualidade técnica** — por `book_id` / versão de deploy.
4. **Brief de revisão editorial** — páginas com varredura rápida + baixo zoom + alto abandono.

---

## Matriz resumida: evento → valor de negócio

| Dimensão | Eventos-chave | Valor | Camada |
|----------|---------------|-------|--------|
| **Uso e percurso** | `page_*`, `session_*`, `resource_opened` | Onde e o que foi acessado | Uso |
| **Engajamento (proxy)** | `visible_time_seconds`, `reading_depth` | Tempo visível; ritmo de leitura | Atenção |
| **Persistência na página** | `page_completed`, `chapter_completed` | Critério de tempo no miolo — **não** é compreensão | Uso + atenção |
| **Interesse em mídia** | `image_zoomed`, `video_*` | Interação intencional | Atenção |
| **Recursos digitais** | `resource_*`, ODA, Escola Digital | Adoção e tempo em modais | Uso + atenção |
| **Suporte docente** | `teacher_button_*` | Consulta ao material do professor | Uso |
| **Voz do usuário** | `feedback_submitted` | Satisfação e percepção | Uso |
| **Qualidade de entrega** | MVP-06 | Corrigir antes de escalar | Técnico |
| **Integridade da coleta** | `data_quality_score`, avisos no `summary` | Confiar em relatórios multi-sessão | Técnico |
| **Cobertura editorial** | manifest + `*_coverage_rate` | Exposição real vs inventário do livro | Uso |
| **Contexto** | `session_started` | Mobile-first, idioma, SO | Uso |
| **Aprendizagem** | `activity_*` (planejado) | Só após validação pedagógica/jurídica | Aprendizagem |

---

## Limitações e próximos passos

| Limitação | Impacto | Direção futura |
|-----------|---------|----------------|
| Dados só no navegador | Sem painel de turma automático | Backend ou ingestão de JSONs |
| 1 export por participante | Agregação manual | Pipeline CSV / BI / LMS |
| Sessões com coleta falha | Dados enviesados em turma | Filtrar por `data_quality_score` ≥ 85 |
| Código anônimo (P01) | Não liga à matrícula | Integração escolar opcional |
| Um capítulo piloto | Generalizar por `CHAPTER_PAGE_REGISTRY` | Portar tracking por livro |
| `image_viewed` ≠ atenção | Exposição na tela, não cognição | Ver seção [Uso, atenção e aprendizagem](#uso-atenção-e-aprendizagem) |
| Relatórios implicam aprendizagem | Risco pedagógico e jurídico | Não inferir domínio até `activity_*` validado |
| Um capítulo piloto | Generalizar por `CHAPTER_PAGE_REGISTRY` | Portar tracking por livro |

**Próximo MVP planejado:** camada de atividades (`activity_viewed` → `activity_completed`) com validação pedagógica e jurídica antes de uso com alunos reais.

---

## Documentação relacionada

| Documento | Conteúdo |
|-----------|----------|
| [RELATORIO-USO-LIVRO.md](./RELATORIO-USO-LIVRO.md) | Roadmap e arquitetura |
| [MVP-01-BASE.md](./MVP-01-BASE.md) | Sessão, gate, exportação |
| [MVP-02-JORNADA-LEITURA.md](./MVP-02-JORNADA-LEITURA.md) | Páginas, tempo, profundidade |
| [MVP-03-INTERACOES-CONTEUDO.md](./MVP-03-INTERACOES-CONTEUDO.md) | Imagens, ODA, vídeo |
| [MVP-04-FEEDBACK.md](./MVP-04-FEEDBACK.md) | Feedback e encerramento |
| [MVP-05-BOTAO-PROFESSOR.md](./MVP-05-BOTAO-PROFESSOR.md) | Botão Para o Professor |
| [MVP-06-SAUDE-TECNICA.md](./MVP-06-SAUDE-TECNICA.md) | Erros e performance |
| [DASHBOARD-MVP.md](./DASHBOARD-MVP.md) | LD Insights |
| [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md) | Limiares editáveis |
| [EVIDENCIAS.md](./EVIDENCIAS.md) | Histórico de mudanças |

**Código:** `src/ld/sessionLabels.ts` (catálogo vivo) · `src/ld/sessionSummary.ts` (agregados do export) · `src/ld/collectionQuality.ts` (validação de integridade) · `src/ld/chapterManifest.ts` (inventário do capítulo)

---

*Última revisão: julho/2026 — alinhado aos 25 eventos ativos, tempo visível, qualidade da coleta, manifest do capítulo, regra uso/atenção/aprendizagem e LD Insights v0.1.*
