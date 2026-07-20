# Dashboard MVP v0.1 — LD Insights

Visualização de relatórios JSON exportados pelo Livro Digital Piloto.

## Acesso

Com o servidor rodando:

```text
http://localhost:5173/#/dashboard
```

No piloto do livro, use o botão **LD Insights** (canto inferior esquerdo durante a leitura) ou **Abrir dashboard (LD Insights)** na tela de acesso ao livro.

## Uso

### Sessão individual

1. No livro, exporte o JSON (**Exportar eventos JSON**).
2. Abra o dashboard (`#/dashboard`).
3. Mantenha **1 sessão** selecionado e clique em **Carregar relatório JSON**.

### Grupo de teste (multi-sessão)

1. Exporte um JSON por participante (P01, P02, …).
2. No dashboard, selecione **Grupo de teste**.
3. Clique em **Carregar JSONs do grupo** e selecione todos os arquivos de uma vez (Ctrl+clique ou Shift+clique).

O relatório consolidado inclui KPIs médios, heatmap de páginas (visualizada / concluída / vista sem conclusão / abandono), ritmo por página vista, dispositivos, feedback agregado e tabela por sessão. **Por padrão**, Executivo, Consolidado, Retomada, Editorial, Recursos e IA agregam só sessões com `data_quality_score` ≥ 85; na aba **Consolidado**, o toggle **Incluir sessões duvidosas** reincorpora o lote completo. A aba **Técnico & QA** sempre mostra todas as sessões.

## Fonte de dados

- **Primária:** objeto `summary` do export.
- **Complementar:** `events` (duração, profundidade, zooms) e `feedback_comments` (comentário sob demanda).

### Enriquecimento ao carregar JSON

Relatórios antigos ou sem `session_finished` são completados em `parseReport.ts` / `reportExtractors.ts`:

| Métrica | Ordem de leitura |
|---------|------------------|
| **Ritmo por página vista** (`reading_depth`) | `summary` → `session_finished` → `chapter_finished` → `chapter_completed` |
| **Abertura / conclusão no capítulo** | `pages_viewed_count`, `pages_completed_count`, `pages_*_coverage_rate` no `summary` |
| **Conclusão das páginas vistas** (`completion_rate`) | `concluídas ÷ visualizadas` — distinto de abertura e conclusão no capítulo |
| **Última página / abandono** | `last_page_viewed`, `abandonment_page`, `abandoned_before_end` — eventos de fim + `sessionJourneyMetrics` |
| **Tempo médio por página concluída** | `avg_seconds_per_completed_page` em `session_finished` ou recálculo via `page_completed` |
| **Gap abertura × conclusão** | Páginas em `pages_viewed` que não estão em `pages_completed` |
| **Duração da sessão** | `session_finished.duration_seconds` (total) e `visible_time_seconds` (aba visível) |
| **Ambiente / idiomas** | `summary` ou metadata de `session_started`; JSONs antigos com só `language` tratam como idioma do navegador |
| **Saúde técnica** | `resource_timing_snapshot` → `events_exported` / `session_finished`; erros e timing nos eventos da sessão |
| **Qualidade da coleta** | `summary` (campos `data_quality_*`) ou recálculo em `collectionQuality.ts` a partir de `events[]` |
| **Inventário editorial** | `chapter_manifest` no export ou `CHAPTER_MANIFEST_REGISTRY`; taxas em `summary` ou recálculo em `chapterManifest.ts` |

## Seções

| Seção | Conteúdo |
|-------|----------|
| Cards principais | Participante, tempo, **abertura/conclusão no capítulo**, conclusão das vistas, status, última página/abandono, gap, tempo/página concluída, ritmo |
| Resumo interpretativo | Texto narrativo executivo da sessão (destaque visual após os cards) |
| Ambiente de acesso | Dispositivo, SO, navegador, resolução, touch, idioma do app e do navegador (`session_started`) |
| Saúde técnica na navegação | Tempo de carga (com status Bom/Moderado/Lento), peso observado, erros, links quebrados; botão **(i)** explica cada métrica (ex.: TTFB) |
| Jornada de leitura | Páginas do livro (pág. 3–12): legenda + cartões com emoji, **Pág.** e número |
| Status do capítulo | Badge + insight + métricas de progresso |
| Imagens no capítulo | Exposição (`image_viewed`) vs interação intencional (`image_zoomed`) |
| Recursos externos | ODA e Escola Digital (modal + reprodução do vídeo) |
| Botão do professor | Aberturas, tempo total e seções abertas |
| Feedback | Notas sem comentário aberto por padrão |
| Métricas com rótulos claros | Ver tabela em [CATÁLOGO § Rótulos de exibição](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md) |
| **Qualidade da coleta** | Score 0–100, badge de status (`ok` / `warning` / `error`), validações por categoria e avisos detalhados |
| **Inventário editorial do capítulo** | Taxas vs manifest (páginas, imagens, recursos, professor, atividades); itens faltantes — aba Recursos |
| Saúde da coleta | Checklist rápido do ciclo de vida (`session_started` → `events_exported`) |
| Alertas de interpretação | Sinais de comportamento (saída da aba, varredura rápida, capítulo parcial, comentário aberto) — **não** indicam aprendizagem |
| **Grupo — heatmap** | Por página: visualizada, concluída, vista sem conclusão, abandono |
| **Retomada pedagógica** (grupo) | Aba dedicada: páginas prioritárias, recursos ignorados, participantes com sinais, pontos para aula |
| **Editorial & produto** (grupo) | Backlog de melhorias: páginas a revisar, imagens com zoom, recursos subutilizados, feedback UX, dispositivos |

> **Interpretação:** alertas descrevem padrões de uso e engajamento. Não inferir compreensão ou desempenho pedagógico — ver [CATÁLOGO-EVENTOS-E-RELATÓRIOS.md § Uso, atenção e aprendizagem](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md#uso-atenção-e-aprendizagem).

### Qualidade da coleta (detalhe)

Validação de **integridade dos eventos** — distinta de saúde técnica (erros de carga) e de alertas de interpretação (comportamento de leitura).

| Elemento | Descrição |
|----------|-----------|
| **Score** | `data_quality_score` (0–100) no `summary` |
| **Status** | `event_integrity_status`: Confiável / Atenção / Comprometida |
| **Categorias** | Sessão · Jornada · Conteúdo · Professor |
| **Avisos** | Listas `missing_expected_events`, `duplicate_event_warnings`, `inconsistent_event_warnings`, `unexpected_event_warnings` |

Regras completas: [CATÁLOGO-EVENTOS-E-RELATÓRIOS.md § Qualidade da coleta](./CATÁLOGO-EVENTOS-E-RELATÓRIOS.md#qualidade-da-coleta).

**Uso em piloto com turma:** o LD Insights aplica esse filtro automaticamente nas abas analíticas; use o toggle no Consolidado para incluir sessões duvidosas quando necessário.

## Privacidade

Comentários ficam em `feedback_comments` e só aparecem após clicar em **Ver comentário**, com aviso de validação interna.

## Fora de escopo (v0.1)

Backend, login, gráficos avançados exportáveis.

## Código

```text
src/dashboard/
  DashboardPage.tsx       ← modos 1 sessão / grupo de teste
  GroupReportContent.tsx  ← UI do relatório consolidado
  buildGroupReport.ts     ← agregação multi-sessão
  parseReport.ts          ← parse único e múltiplo
  reportExtractors.ts
  reportInsights.ts
  InfoHint.tsx
  types.ts
src/ld/
  collectionQuality.ts    ← validação de integridade (também no export)
  chapterManifest.ts      ← inventário do capítulo + cobertura
```
