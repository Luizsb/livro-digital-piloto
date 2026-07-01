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
4. Se mudou evento ou label → `eventLabels.ts` e tabela em `RELATORIO-USO-LIVRO.md`.
5. Se mudou dashboard → `DASHBOARD-MVP.md`.

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
| [README.md](../README.md) | Porta de entrada do projeto | Fase atual, links, estrutura |

---

## Estado atual (snapshot)

**Fase:** MVP-05 concluído + extensões MVP-03 (vídeo e modal robusto)  
**Capítulo piloto:** `cap07_historia_ai43` / `cap07` (páginas 3–12)  
**Última atualização deste doc:** 2026-07-01  
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
| `parseReport.ts` | Enriquecimento de JSONs antigos no dashboard |

---

## Registro cronológico

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
| Saúde técnica na navegação (Fases 1–2) | 06 | ✅ Ver `MVP-06-SAUDE-TECNICA.md` |
| Atividades interativas (`activity_started` / `activity_completed`) | 07 | ⏳ Planejado |
| Git LFS para vídeo grande (opcional) | infra | ⏳ Avaliar |

---

## Para handoff (copiar em outra ferramenta)

> Piloto Livro Digital — analytics por fases. Repo: github.com/Luizsb/livro-digital-piloto  
> Índice: `docs/RELATORIO-USO-LIVRO.md` · Evoluções: `docs/EVIDENCIAS.md`  
> ODA/Escola Digital: abertura + tempo no modal (`resource_*`). Vídeo: `video_*`.  
> Config: `analyticsConfig.ts` + `docs/CONFIGURACAO-ANALYTICS.md`
