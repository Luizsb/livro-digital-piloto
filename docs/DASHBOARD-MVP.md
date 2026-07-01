# Dashboard MVP v0.1 — LD Insights

Visualização de relatórios JSON exportados pelo Livro Digital Piloto.

## Acesso

Com o servidor rodando:

```text
http://localhost:5173/#/dashboard
```

No piloto do livro, use o botão **LD Insights** (canto inferior esquerdo durante a leitura) ou **Abrir dashboard (LD Insights)** na tela de acesso ao livro.

## Uso

1. No livro, exporte o JSON (**Exportar eventos JSON**).
2. Abra o dashboard (`#/dashboard`).
3. Clique em **Carregar relatório JSON** e selecione o arquivo.

## Fonte de dados

- **Primária:** objeto `summary` do export.
- **Complementar:** `events` (duração, profundidade, zooms) e `feedback_comments` (comentário sob demanda).

### Enriquecimento ao carregar JSON

Relatórios antigos ou sem `session_finished` são completados em `parseReport.ts` / `reportExtractors.ts`:

| Métrica | Ordem de leitura |
|---------|------------------|
| **Profundidade de leitura** | `summary` → `session_finished` → `chapter_finished` → `chapter_completed` |
| **Duração da sessão** | `session_finished.duration_seconds` → intervalo `session_started` até `chapter_finished` → primeiro/último evento |
| **Ambiente / idiomas** | `summary` ou metadata de `session_started`; JSONs antigos com só `language` tratam como idioma do navegador |
| **Saúde técnica** | `resource_timing_snapshot` → `events_exported` / `session_finished`; erros e timing nos eventos da sessão |

## Seções

| Seção | Conteúdo |
|-------|----------|
| Cards principais | Participante, duração, páginas, status (badge), profundidade, feedback, usaria novamente |
| Resumo interpretativo | Texto narrativo executivo da sessão (destaque visual após os cards) |
| Ambiente de acesso | Dispositivo, SO, navegador, resolução, touch, idioma do app e do navegador (`session_started`) |
| Saúde técnica na navegação | Tempo de carga (com status Bom/Moderado/Lento), peso observado, erros, links quebrados; botão **(i)** explica cada métrica (ex.: TTFB) |
| Jornada de leitura | Páginas do livro (pág. 3–12): legenda + cartões com emoji, **Pág.** e número |
| Status do capítulo | Badge + insight + taxa de conclusão |
| Imagens no capítulo | Exposição (`image_viewed`) vs interação intencional (`image_zoomed`) |
| Recursos externos | ODA e Escola Digital (modal + reprodução do vídeo) |
| Botão do professor | Aberturas, tempo total e seções abertas |
| Feedback | Notas sem comentário aberto por padrão |
| Saúde da coleta | Checklist técnico dos eventos (+ problemas técnicos, se houver) |
| Alertas de interpretação | Sinais de comportamento (varredura rápida, capítulo parcial, comentário aberto) |

## Privacidade

Comentários ficam em `feedback_comments` e só aparecem após clicar em **Ver comentário**, com aviso de validação interna.

## Fora de escopo (v0.1)

Backend, login, múltiplas sessões consolidadas, gráficos avançados.

## Código

```text
src/dashboard/
  DashboardPage.tsx
  parseReport.ts
  reportExtractors.ts
  reportInsights.ts
  InfoHint.tsx
  types.ts
```
