# Dashboard MVP v0.1 — LD Insights

Visualização de relatórios JSON exportados pelo Livro Digital Piloto.

## Acesso

Com o servidor rodando:

```text
http://localhost:5173/#/dashboard
```

No piloto do livro, use o botão **LD Insights** (canto inferior esquerdo).

## Uso

1. No livro, exporte o JSON (**Exportar eventos JSON**).
2. Abra o dashboard (`#/dashboard`).
3. Clique em **Carregar relatório JSON** e selecione o arquivo.

## Fonte de dados

- **Primária:** objeto `summary` do export.
- **Complementar:** `events` (duração, zooms) e `feedback_comments` (comentário sob demanda).

## Seções

| Seção | Conteúdo |
|-------|----------|
| Cards principais | Participante, duração, páginas, status (badge), profundidade, feedback, usaria novamente |
| Resumo interpretativo | Texto narrativo executivo da sessão (destaque visual após os cards) |
| Jornada de leitura | Grid páginas 3–12 com legenda: ✓ Concluída · • Apenas visualizada · ○ Não visualizada |
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
  types.ts
```
