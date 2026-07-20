# Evidências e evolução do piloto

Registro cronológico das **mudanças, melhorias e correções** do Livro Digital Piloto.  
Use este arquivo para acompanhar o que foi feito, validar com a equipe e atualizar contexto em outras ferramentas (ex.: GPT).

**Repositório:** [github.com/Luizsb/livro-digital-piloto](https://github.com/Luizsb/livro-digital-piloto)

---

## Como manter este documento

Sempre que houver mudança relevante no piloto:

1. **Adicione uma entrada** na seção [Registro cronológico](#registro-cronológico) (mais recente no topo).
2. **Atualize o doc de MVP** correspondente (ex.: nova métrica → `MVP-03-INTERACOES-CONTEUDO.md`).
3. Se mudou limiar ou parâmetro → `CONFIGURACAO-ANALYTICS.md` e `analyticsConfig.ts`.
4. Se mudou evento ou label → `sessionLabels.ts` e tabela em `RELATORIO-USO-LIVRO.md` / `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`.
5. Se mudou dashboard → `DASHBOARD-MVP.md`.
6. Se mudou validação de integridade → `collectionQuality.ts` e seção **Qualidade da coleta** no catálogo.
7. Se mudou inventário do capítulo (páginas, imagens, recursos) → `chapterManifest.ts` e seção **Manifest** no catálogo.

### Modelo de entrada

```markdown
### AAAA-MM-DD — Título curto

**Tipo:** feature | fix | docs | UX | infra  
**MVP:** 01–05 (ou transversal)  
**Resumo:** uma frase do que mudou e por quê.  
**Arquivos:** lista dos principais arquivos alterados.  
**Docs atualizados:** links ou “pendente”.  
**Como validar:** passos rápidos de teste.
```

---

## Mapa da documentação

| Documento | Função | Atualizar quando… |
|-----------|--------|-------------------|
| **[EVIDENCIAS.md](./EVIDENCIAS.md)** (este) | Histórico de evoluções | Qualquer entrega ou correção relevante |
| [RELATORIO-USO-LIVRO.md](./RELATORIO-USO-LIVRO.md) | Índice, arquitetura, lista de eventos | Novo evento, nova camada analytics |
| [MVP-01 … MVP-05](./MVP-01-BASE.md) | Especificação por fase | Regra de negócio ou critério de aceite |
| [CONFIGURACAO-ANALYTICS.md](./CONFIGURACAO-ANALYTICS.md) | Limiares editáveis | Mudança em `analyticsConfig.ts` |
| [DASHBOARD-MVP.md](./DASHBOARD-MVP.md) | LD Insights | Nova seção ou métrica no dashboard |
| [CATÁLOGO-EVENTOS-E-RELATÓRIOS.md](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md) | Catálogo único, KPIs, qualidade da coleta, **uso vs aprendizagem** | Novo evento, campo do summary, regra de validação ou interpretação |
| [README.md](../README.md) | Porta de entrada do projeto | Fase atual, links, estrutura |

---

## Estado atual (snapshot)

**Fase:** MVP-05 concluído + extensões MVP-03 (vídeo e modal robusto)  
**Capítulo piloto:** `cap07_historia_ai43` / `cap07` (páginas 3–12)  
**Última atualização deste doc:** 2026-07-06  
**Deploy público:** https://luizsb.github.io/livro-digital-piloto/

### Funcionalidades ativas

| Área | O que coleta / exibe |
|------|----------------------|
| Sessão | Código P01… (digita só o número), `session_started` (+ dispositivo/SO/navegador), `session_resumed` no F5, export JSON |
| Jornada | `page_viewed`, `page_completed`, `reading_depth` |
| Imagens | `image_viewed` (exposição), `image_zoomed`, lightbox sem rolagem |
| ODA | `resource_opened` + `resource_engagement_recorded` (tempo no modal) |
| Escola Digital | Modal + vídeo: `video_started`, `video_completed`, `video_progress_recorded` |
| Professor | `teacher_button_opened` / `teacher_button_closed` |
| Encerramento | `feedback_submitted`, `chapter_finished`, `chapter_completed`, `session_finished` |
| Tela pós-teste | **Teste finalizado** — exportar JSON ou iniciar novo teste (sem voltar ao livro) |
| Painel em tempo real | Acordeão (catálogo / resumo / log), timer de sessão ao vivo, ícones por seção |
| Dashboard | LD Insights em `#/dashboard` (também no gate de acesso) |
| Qualidade da coleta | `data_quality_score` e validações de integridade no `summary` + seção no LD Insights |
| Manifest do capítulo | `chapter_manifest` no export + cobertura (`*_coverage_rate`) no `summary` |

### Arquivos-chave (além dos MVPs originais)

| Arquivo | Papel |
|---------|--------|
| `modalResourceTracking.ts` | Sessão de modal ODA/Escola Digital; tempo ao fechar |
| `videoTracking.ts` + `TrackedVideo.tsx` | Play, conclusão e progresso do vídeo |
| `teacherButtonTracking.ts` | Abertura/fechamento do botão do professor |
| `sessionStatus.ts` | Status da sessão (`not_started` / `active` / `finished`) |
| `exportSessionReport.ts` | Export JSON com `events_exported` antes do download |
| `TestFinishedScreen.tsx` | Tela de encerramento após Finalizar teste |
| `contentInteractionsSummary.ts` | Agregados ODA, Escola Digital e vídeo no export |
| `EventReportPanel.tsx` | Painel em tempo real — acordeão, timer de sessão, resumo e log |
| `ClosePillButton.tsx` | Botão Fechar padronizado em modais e painel de eventos |
| `useLiveSessionDuration.ts` | Contador ao vivo desde `session_started` |
| `sessionVisibleTime.ts` | Tempo visível na aba (pausa ao trocar de guia) |
| `parseReport.ts` | Enriquecimento de JSONs antigos no dashboard |
| `collectionQuality.ts` | Score e validações de integridade dos eventos no export |
| `chapterManifest.ts` | Inventário do capítulo + taxas de cobertura no summary |

---

## Registro cronológico

### 2026-07-20 — Filtro de qualidade no grupo (score ≥ 85)

**Tipo:** feature + UX + docs  
**MVP:** dashboard  
**Resumo:** Análises de grupo padronizadas com `data_quality_score` ≥ 85. Toggle **Incluir sessões duvidosas** na aba Consolidado reincorpora o lote completo; Técnico & QA sempre mostra todas as sessões. Banner indica quantas sessões entraram nas métricas.  
**Arquivos:** `buildGroupReport.ts`, `GroupReportContent.tsx`, `DashboardPage.tsx`, `types.ts`  
**Docs atualizados:** `DASHBOARD-MVP.md`, `EVIDENCIAS.md`  
**Como validar:** carregar grupo com sessões score &lt; 85 → KPIs usam só confiáveis → Consolidado → ativar toggle → métricas incluem todas → Técnico & QA inalterado.

---

### 2026-07-20 — Relatório editorial & melhoria de produto

**Tipo:** feature + docs  
**MVP:** dashboard  
**Resumo:** Nova aba **Editorial & produto** no LD Insights (grupo): backlog sugerido por área (conteúdo, recurso, UX, técnico), páginas para revisão, imagens com interação, recursos subutilizados, dimensões de feedback e experiência por dispositivo.  
**Arquivos:** `GroupEditorialImprovementReport.tsx`, `buildGroupEditorialImprovement.ts`, `GroupReportContent.tsx`, `projectHubContent.ts`  
**Docs atualizados:** `DASHBOARD-MVP.md`, `CATÁLOGO`, `EVIDENCIAS.md`  
**Como validar:** carregar grupo → aba Editorial & produto → conferir backlog e tabelas.

---

### 2026-07-20 — Retomada pedagógica + métricas de jornada no grupo

**Tipo:** feature + UX + docs  
**MVP:** jornada + dashboard  
**Resumo:** Aba **Retomada pedagógica** no LD Insights (grupo): páginas prioritárias, recursos pouco adotados, participantes com sinais e pontos para discussão. Consolidado ampliado: tempo médio por página concluída, gap e abandono na tabela comparativa. Rótulos de jornada renomeados (Abertura/Conclusão no capítulo, Ritmo por página vista).  
**Arquivos:** `GroupPedagogicalResumptionReport.tsx`, `buildGroupPedagogicalResumption.ts`, `GroupReportContent.tsx`, `buildGroupReport.ts`, `metricDisplayLabels.ts`  
**Docs atualizados:** `DASHBOARD-MVP.md`, `CATÁLOGO`, `MVP-02`, `EVIDENCIAS.md`, `projectHubContent.ts`  
**Como validar:** carregar grupo → aba Retomada pedagógica → ver páginas prioritárias e tabela de participantes; Consolidado → KPI tempo médio/página e tabela com gap/abandono.

---

### 2026-07-20 — Jornada: rótulos, métricas de retomada e heatmap ampliado

**Tipo:** UX + feature  
**MVP:** jornada + dashboard  
**Resumo:** Renomeação de métricas de jornada (Abertura/Conclusão no capítulo, Conclusão das vistas, Ritmo por página vista, Inventário editorial). Novos cards: última página/abandono, gap abertura×conclusão, tempo médio por página concluída. Heatmap de grupo com barra “vista sem conclusão” e KPI agregado de gap. Vídeo etapa 2 (playback wall, seeks) e Resumo com IA (JSON + proxy Gemini) documentados no catálogo.  
**Arquivos:** `metricDisplayLabels.ts`, `SessionConsolidatedReport.tsx`, `GroupReportContent.tsx`, `groupCharts.tsx`, `buildGroupReport.ts`, `reportExtractors.ts`, `geminiClient.ts`, `GroupAiSummarySection.tsx`  
**Docs atualizados:** `DASHBOARD-MVP.md`, `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `MVP-02-JORNADA-LEITURA.md`, `README.md`, `EVIDENCIAS.md`  
**Como validar:** exportar sessão parcial (1/10 págs) → Consolidado mostra abertura 10%, conclusão no capítulo 10%, conclusão das vistas 100%, abandono e gap → carregar grupo → heatmap com 4 barras por página.

---

### 2026-07-06 — Remoção de `page_revisited`

**Tipo:** decisão de produto / simplificação  
**MVP:** jornada  
**Resumo:** Removidos evento `page_revisited` e derivados (`page_revisited_count`, `pages_revisited`, badges no dashboard). Scroll não é proxy confiável de intenção de revisita; cobertura segue em `page_viewed`, permanência em `page_completed`, abandono em `abandonment_page`.  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Correção `page_viewed` / `page_revisited`

**Tipo:** bugfix  
**MVP:** jornada  
**Resumo:** Oscilação na borda do scroll gerava `page_viewed` prematuro e centenas de `page_revisited` falsos. Agora a página precisa estabilizar 250 ms (`scroll.pageCommitDelayMs`) antes de registrar evento; revisita só ao rolar **para trás** a uma página já vista. `revisit_count` = ordinal do retorno na sessão (1º, 2º…).  
**Docs:** `CONFIGURACAO-ANALYTICS.md`, `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`

---

### 2026-07-06 — Relatório multi-sessão (grupo de teste)

**Tipo:** feature  
**MVP:** dashboard  
**Resumo:** Modo **Grupo de teste** no LD Insights: carregar vários JSONs e gerar relatório consolidado (KPIs médios, heatmap de páginas, feedback agregado, tabela por participante). Arquivos inválidos são listados sem bloquear o lote.  
**Docs:** `DASHBOARD-MVP.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Revisita, abandono e inatividade

**Tipo:** feature  
**MVP:** jornada / sessão  
**Resumo:** Novo evento `page_revisited` ao voltar a página já vista. Métricas derivadas `last_page_viewed`, `abandoned_before_end`, `abandonment_page` em `chapter_finished` / `session_finished` / summary. Inatividade na aba visível: `idle_started`, `idle_finished`, `idle_time_seconds` (limiar 60 s em `ldConfig.idle`). Dashboard: card tempo inativo, abandono e badges ↩ na jornada.  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `CONFIGURACAO-ANALYTICS.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Cards do dashboard LD Insights (tempo e feedback)

**Tipo:** UX  
**MVP:** dashboard  
**Resumo:** Um único card **Tempo no livro** quando a aba ficou sempre em foco; cards separados (visível, fora da aba, duração) só quando houve saída da guia. Removidos cards duplicados de feedback do topo (ficam na seção Feedback). Removida lista “Maiores imagens carregadas” da saúde técnica.  
**Docs:** `DASHBOARD-MVP.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Rótulos de métricas (dashboard e catálogo)

**Tipo:** docs / UX  
**MVP:** transversal  
**Resumo:** Padronização de rótulos: “Taxa de conclusão de páginas”, explicação fixa de `reading_depth`, “Tempo no modal” vs métricas de vídeo (Tempo assistido, Progresso máximo, Vídeo concluído), reforço de “Imagem exposta” e destaque de `teacher_button_usage_by_section`. Código: `metricDisplayLabels.ts`, `escola_digital_video_watch_total_seconds` no summary.  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `MVP-02-JORNADA-LEITURA.md`, `DASHBOARD-MVP.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Regra conceitual: uso, atenção e aprendizagem

**Tipo:** documentação  
**MVP:** transversal  
**Resumo:** Seção no catálogo que diferencia o que os eventos atuais permitem afirmar (uso, exposição, engajamento) do que ainda não pode ser inferido (aprendizagem, compreensão, domínio). Inclui frase-guia para relatórios e IA, mapa de camadas, lista de eventos `activity_*` planejados e requisito de validação pedagógica/jurídica.  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `RELATORIO-USO-LIVRO.md`, `DASHBOARD-MVP.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Manifest do capítulo e cobertura editorial

**Tipo:** feature / métrica  
**MVP:** transversal (02–05)  
**Resumo:** Novo **manifest do capítulo** (`chapter_manifest` no export) declara o que o capítulo deveria conter: páginas, imagens, recursos, botões do professor e atividades. O `summary` passa a incluir contagens esperadas, taxas de cobertura (`image_exposure_coverage_rate`, `resource_open_coverage_rate`, etc.) e listas do que faltou. LD Insights exibe seção **Cobertura do capítulo**. Evita interpretação errada (ex.: “nenhuma atividade” quando o capítulo não tem atividades).  
**Arquivos:** `chapterManifest.ts`, `sessionSummary.ts`, `exportEvents.ts`, `parseReport.ts`, `DashboardPage.tsx`, `reportInsights.ts`, `reportExtractors.ts`  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `DASHBOARD-MVP.md`, `MVP-01-BASE.md`, `EVIDENCIAS.md`  
**Como validar:** exportar JSON → conferir `chapter_manifest` e campos `expected_*` / `*_coverage_rate` → abrir LD Insights → seção Cobertura do capítulo.

---

### 2026-07-06 — Qualidade da coleta (integridade dos eventos)

**Tipo:** feature / métrica  
**MVP:** transversal (01–06)  
**Resumo:** Nova camada **Qualidade da coleta** valida integridade dos eventos antes de interpretar relatórios. O `summary` do export passa a incluir `data_quality_score`, `event_integrity_status` e listas de avisos (`missing_expected_events`, `duplicate_event_warnings`, `inconsistent_event_warnings`, `unexpected_event_warnings`). LD Insights exibe seção dedicada com score, status e checks por categoria (sessão, jornada, conteúdo, professor). JSONs antigos são revalidados em `parseReport.ts`.  
**Arquivos:** `collectionQuality.ts`, `sessionSummary.ts`, `parseReport.ts`, `reportInsights.ts`, `DashboardPage.tsx`  
**Docs:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md`, `DASHBOARD-MVP.md`, `MVP-01-BASE.md`, `EVIDENCIAS.md`  
**Como validar:** exportar JSON após sessão completa → abrir LD Insights → conferir score e seção **Qualidade da coleta**; simular sessão incompleta (sem `session_finished`) e verificar avisos.

---

### 2026-07-06 — Correção do timer congelado no painel de eventos

**Tipo:** fix  
**MVP:** 01 + 02  
**Resumo:** Timer do painel **Eventos em tempo real** parava de subir enquanto eventos continuavam sendo capturados (estado `visibleSinceMs` perdido após HMR ou recuperação de sessão). Implementada auto-recuperação do relógio (`ensureActiveVisibleClock`) e retomada após F5.  
**Arquivos:** `sessionVisibleTime.ts`, `useLiveSessionDuration.ts`, `SessionProvider.tsx`  
**Docs:** `EVIDENCIAS.md`  
**Como validar:** abrir livro → Ver eventos → timer sobe a cada segundo com aba visível; F5 com sessão ativa → timer retoma.

---

### 2026-07-06 — Catálogo único de eventos e relatórios

**Tipo:** documentação  
**MVP:** transversal  
**Resumo:** `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md` — referência única com 25 eventos ativos, metadata, KPIs, relatórios por público (aluno, professor, escola, editorial), modelo do export e prompt para IA.  
**Docs:** `README.md`, `RELATORIO-USO-LIVRO.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Tempo visível no export, summary e dashboard

**Tipo:** feature / métrica  
**MVP:** 01 + 02  
**Resumo:** `session_finished` e `summary` passam a diferenciar duração total (`duration_seconds`), tempo visível (`visible_time_seconds`), tempo fora da aba (`hidden_time_seconds`), proporção (`visible_time_ratio`) e `visibility_change_count`. LD Insights exibe cards dedicados, insight usa tempo visível e alerta interpretativo quando houve saída da aba.  
**Arquivos:** `sessionVisibleTime.ts`, `sessionVisibilityMetrics.ts`, `sessionFinishMetrics.ts`, `sessionSummary.ts`, `reportExtractors.ts`, `reportInsights.ts`, `DashboardPage.tsx`, `parseReport.ts`  
**Docs:** `MVP-02-JORNADA-LEITURA.md`, `DASHBOARD-MVP.md`, `EVIDENCIAS.md`

---

### 2026-07-06 — Timer de sessão só com aba visível

**Tipo:** feature / métrica  
**MVP:** 01 + 02  
**Resumo:** O timer do painel e o `duration_seconds` do `session_finished` contam apenas enquanto a aba do livro está em foco. Ao trocar de guia, o relógio pausa; o tempo mínimo de `page_completed` também não avança fora da tela. Implementação via Page Visibility API (`sessionVisibleTime.ts`).  
**Arquivos:** `sessionVisibleTime.ts`, `useLiveSessionDuration.ts`, `sessionFinishMetrics.ts`, `pageReadingState.ts`, `EventReportPanel.tsx`, `AnalyticsProvider.tsx`, `finishSession.ts`  
**Docs:** `MVP-01-BASE.md`, `MVP-02-JORNADA-LEITURA.md`, `EVIDENCIAS.md`

---

### 2026-06-30 — Botão Fechar padronizado e catálogo do painel de eventos

**Tipo:** UX / acessibilidade  
**MVP:** transversal (01 + 03)  
**Resumo:** `ClosePillButton` roxo compartilhado em imagem ampliada (`aria-label="Fechar imagem ampliada"`), ODA (`Fechar atividade digital`), Escola Digital (`Fechar Escola Digital`) e painel **Eventos em tempo real** (`Fechar painel de eventos`). `TrackedImage` sem `title` na imagem (evita tooltip com caminho do arquivo no hover de Ampliar/Fechar). Catálogo “O que está sendo coletado?” ordenado (25 eventos), com scroll e descrições atualizadas (timing, peso observado).  
**Arquivos:** `ClosePillButton.tsx`, `TrackedImage.tsx`, `GameModal.tsx`, `Book.tsx`, `EscolaDigital.tsx`, `EventReportPanel.tsx`, `eventLabels.ts`  
**Docs:** `MVP-01-BASE.md`, `MVP-03-INTERACOES-CONTEUDO.md`, `EVIDENCIAS.md`

---

### 2026-07-01 — Saúde técnica na navegação (Fases 1 e 2)

**Tipo:** feature  
**MVP:** 06  
**Resumo:** Coleta de erros e performance **só do que o participante vivencia**: `image_load_error`, `runtime_error`, `render_error`, `asset_load_error`; timing em `book_opened`/`session_resumed`; `resource_timing_snapshot` (peso observado) e `link_open_failed` ao exportar/finalizar. LD Insights: seção **Saúde técnica** com status de carregamento, botões **(i)** nas métricas, jornada de leitura com emoji por página.  
**Arquivos:** `captureLoadTiming.ts`, `captureResourceTiming.ts`, `technicalHealthSummary.ts`, `resourceTimingSnapshot.ts`, `linkOpenValidation.ts`, `useRuntimeErrorTracking.ts`, `AnalyticsErrorBoundary.tsx`, `InfoHint.tsx`, `DashboardPage.tsx`, …  
**Docs atualizados:** `MVP-06-SAUDE-TECNICA.md`, `EVIDENCIAS.md`, `DASHBOARD-MVP.md`, `RELATORIO-USO-LIVRO.md`, `README.md`  
**Como validar:** Sessão P01 → navegar → exportar JSON → dashboard com peso/recursos, TTFB com (i), emojis nas páginas.

---

### 2026-07-01 — Ambiente de acesso (dispositivo, SO, navegador)

**Tipo:** feature  
**MVP:** 01 (transversal)  
**Resumo:** `session_started` registra tipo de dispositivo (computador/tablet/celular), sistema operacional, navegador, resolução, viewport, touch e idiomas (`app_language` do `<html lang>`, `browser_language` do navegador) — sem user-agent bruto. Campos no `summary` do export e seção **Ambiente de acesso** no LD Insights.  
**Arquivos:** `deviceContext.ts`, `deviceContextSummary.ts`, `AnalyticsProvider.tsx`, `eventSummary.ts`, `DashboardPage.tsx`, `parseReport.ts`  
**Docs atualizados:** `EVIDENCIAS.md`, `MVP-01-BASE.md`, `DASHBOARD-MVP.md`, `RELATORIO-USO-LIVRO.md`  
**Como validar:** Nova sessão P01 → Ver eventos (metadata em Sessão iniciada) → exportar JSON → dashboard mostra Ambiente de acesso.

---

### 2026-07-01 — Dashboard: duração, profundidade e emojis na jornada

**Tipo:** fix + UX  
**MVP:** transversal  
**Resumo:** LD Insights voltou a exibir **duração** e **profundidade de leitura** em JSONs só com `chapter_finished` (fallback nos eventos). Jornada de leitura com emojis ✅ / 👁️ / ⚪. Export passa a gravar profundidade também a partir de `chapter_finished`.  
**Arquivos:** `reportExtractors.ts`, `parseReport.ts`, `DashboardPage.tsx`, `eventSummary.ts`  
**Docs atualizados:** `EVIDENCIAS.md`, `DASHBOARD-MVP.md`  
**Como validar:** Carregar JSON com `chapter_finished` sem `session_finished` → cards de duração e profundidade preenchidos; grid da jornada com emojis.

---

### 2026-06-30 — Painel de eventos: acordeão, timer e ícones

**Tipo:** UX  
**MVP:** 01 (transversal)  
**Resumo:** `EventReportPanel` com três seções em acordeão (só uma aberta por vez): catálogo, resumo da coleta e log. Ícone por seção; chevron de expansão visível; timer de sessão ao vivo no resumo (roxo na linha compacta; banner completo ao expandir).  
**Arquivos:** `EventReportPanel.tsx`, `useLiveSessionDuration.ts`, `lib/formatDuration.ts`  
**Docs atualizados:** `EVIDENCIAS.md`, `MVP-01-BASE.md`, `RELATORIO-USO-LIVRO.md`  
**Como validar:** Ver eventos → expandir cada seção (as outras fecham) → conferir timer subindo no resumo recolhido.

---

### 2026-06-30 — Fluxo de finalização do teste + UX do gate

**Tipo:** feature + fix + UX  
**MVP:** 01, 04 (transversal)  
**Resumo:** Botão **Finalizar teste** exibe tela de encerramento com export JSON e **Iniciar novo teste** (sem “Voltar ao livro”). Status `active`/`finished` em `sessionStorage`; coleta bloqueada após finalizar (exceto `events_exported`). F5 **não** finaliza sessão ativa — registra `session_resumed`. Gate com **P** fixo (só digita o número) e link **Abrir dashboard (LD Insights)**.  
**Arquivos:** `sessionStatus.ts`, `finishSession.ts`, `exportSessionReport.ts`, `TestFinishedScreen.tsx`, `ParticipantGate.tsx`, `App.tsx`, `AnalyticsProvider.tsx`, `useSessionFinishOnUnload.ts`  
**Docs atualizados:** `EVIDENCIAS.md`, `MVP-01-BASE.md`, `MVP-04-FEEDBACK.md`, `MVP-02-JORNADA-LEITURA.md`, `RELATORIO-USO-LIVRO.md`, `DASHBOARD-MVP.md`, `README.md`  
**Como validar:** Entrar P01 → ler → F5 volta ao livro → Finalizar → tela de encerramento → F5 mantém tela → Exportar → Iniciar novo teste limpa e volta ao gate.

---

### 2026-06-30 — Datas pt-BR e cores no painel de eventos

**Tipo:** UX  
**MVP:** transversal  
**Resumo:** Timestamps em fuso `America/Sao_Paulo` no export e painel; ícones/cores por categoria no `EventReportPanel`.  
**Arquivos:** `formatDateTimeBr.ts`, `eventVisualStyle.ts`, `EventReportPanel.tsx`, `exportEvents.ts`

---

### 2026-06-30 — Deploy no GitHub Pages

**Tipo:** infra  
**MVP:** transversal  
**Resumo:** Piloto publicado em https://luizsb.github.io/livro-digital-piloto/ para testes externos; build na branch `gh-pages` (não publicar `main` diretamente).  
**Arquivos:** `.github/workflows/deploy-pages.yml`, `vite.config.ts`, `package.json`, `README.md`  
**Como validar:** Settings → Pages → branch `gh-pages`; abrir a URL, informar `P01`, navegar o capítulo.

---

### 2026-06-30 — Documento de evidências criado

**Tipo:** docs  
**MVP:** transversal  
**Resumo:** Criação deste arquivo para centralizar evoluções e regras de manutenção da documentação.  
**Docs atualizados:** `EVIDENCIAS.md`, `README.md`, `RELATORIO-USO-LIVRO.md`.

---

### 2026-06-30 — Correção de referência MVP (`readingQuality`)

**Tipo:** docs  
**MVP:** 02  
**Resumo:** `readingQuality` em `analyticsConfig.ts` referenciado como MVP-02 (jornada), não MVP-04 (feedback).  
**Arquivos:** `analyticsConfig.ts`, `CONFIGURACAO-ANALYTICS.md`.

---

### 2026-06-30 — Repositório publicado no GitHub

**Tipo:** infra  
**MVP:** transversal  
**Resumo:** Projeto versionado e enviado para `Luizsb/livro-digital-piloto` (branch `main`).  
**Observação:** vídeo `SAE26_AI43_HIS_C07_VA1.mp4` (~97 MB) — GitHub recomenda LFS acima de 50 MB.

---

### 2026-06-30 — Lightbox de imagens sem rolagem

**Tipo:** UX  
**MVP:** 03  
**Resumo:** Modal de ampliação redimensiona a imagem com `object-contain` para caber na tela, sem barra de rolagem.  
**Arquivos:** `TrackedImage.tsx`  
**Como validar:** Ampliar mapa “Circulação de pessoas e mercadorias” — imagem inteira visível, sem scroll.

---

### 2026-06-30 — Layout dos modais ODA e vídeo

**Tipo:** fix + UX  
**MVP:** 03  
**Resumo:** Botão fechar voltou a sobrepor o conteúdo (sem barra que cortava área útil); modal até 90vh; iframe/vídeo em altura total.  
**Arquivos:** `GameModal.tsx`, `OdaApp.tsx`, `EscolaDigital.tsx`

---

### 2026-06-30 — Tempo no ODA/Escola Digital (registro ao fechar)

**Tipo:** fix  
**MVP:** 03  
**Resumo:** `resource_engagement_recorded` passou a ser garantido no cleanup do modal e ao encerrar sessão (`modalResourceTracking.ts`). Corrige caso em que só aparecia `resource_opened`.  
**Arquivos:** `modalResourceTracking.ts`, `GameModal.tsx`, `finishSession.ts`  
**Como validar:** Abrir ODA → esperar → fechar pelo X roxo → painel deve mostrar **Recurso aberto** e **Tempo no recurso**.

---

### 2026-06-30 — Rastreamento de vídeo Escola Digital

**Tipo:** feature  
**MVP:** 03  
**Resumo:** Novos eventos de reprodução, distintos do tempo com modal aberto.  
**Eventos:** `video_started`, `video_completed`, `video_progress_recorded`  
**Summary:** `escola_digital_video_play_count`, `escola_digital_video_watched_to_end`, `escola_digital_video_max_progress_percent`, etc.  
**Arquivos:** `TrackedVideo.tsx`, `videoTracking.ts`, `videoInteractionTypes.ts`, `contentInteractionsSummary.ts`, `eventSummary.ts`, `DashboardPage.tsx`, `reportInsights.ts`  
**Docs:** `MVP-03-INTERACOES-CONTEUDO.md`, `RELATORIO-USO-LIVRO.md`, `DASHBOARD-MVP.md`

---

### 2026-06-30 — Painel “Eventos em tempo real” refinado

**Tipo:** UX  
**MVP:** transversal  
**Resumo:** Resumo da coleta (jornada, imagens, recursos) recolhível por padrão; log de eventos com mais altura e scroll. Tempo no recurso **sempre visível** no log (decisão de produto).  
**Arquivos:** `EventReportPanel.tsx`

---

### 2026-06 (anterior) — MVP-05 Botão do professor

**Tipo:** feature  
**MVP:** 05  
**Resumo:** `teacher_button_opened` / `teacher_button_closed`, summary por seção, dashboard e insights.  
**Docs:** [MVP-05-BOTAO-PROFESSOR.md](./MVP-05-BOTAO-PROFESSOR.md)

---

### 2026-06 (anterior) — Dashboard LD Insights v0.1

**Tipo:** feature  
**MVP:** transversal  
**Resumo:** Visualização do JSON exportado; cards, jornada, recursos, professor, feedback, saúde da coleta.  
**Docs:** [DASHBOARD-MVP.md](./DASHBOARD-MVP.md)

---

### 2026-06 (anterior) — MVPs 01–04 implementados

**Tipo:** feature  
**MVP:** 01–04  
**Resumo:** Base de sessão, jornada de leitura, interações com conteúdo, feedback e encerramento do capítulo.  
**Docs:** `MVP-01-BASE.md` … `MVP-04-FEEDBACK.md`

---

## Próximos passos previstos

| Item | MVP | Status |
|------|-----|--------|
| Catálogo único eventos + relatórios | transversal | ✅ `CATÁLOGO-EVENTOS-E-RELATÓRIOS.md` |
| Saúde técnica na navegação (Fases 1–2) | 06 | ✅ Ver `MVP-06-SAUDE-TECNICA.md` |
| Camada de atividades (`activity_viewed` … `activity_completed`) | 07+ | ⏳ Planejado — validação pedagógica/jurídica antes de alunos reais |
| Git LFS para vídeo grande (opcional) | infra | ⏳ Avaliar |

---

## Para handoff (copiar em outra ferramenta)

> Piloto Livro Digital — analytics por fases. Repo: github.com/Luizsb/livro-digital-piloto  
> Índice: `docs/RELATORIO-USO-LIVRO.md` · Evoluções: `docs/EVIDENCIAS.md`  
> ODA/Escola Digital: abertura + tempo no modal (`resource_*`). Vídeo: `video_*`.  
> Config: `analyticsConfig.ts` + `docs/CONFIGURACAO-ANALYTICS.md`
