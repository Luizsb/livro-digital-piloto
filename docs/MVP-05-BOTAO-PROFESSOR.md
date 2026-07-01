# MVP-05 — Botão do Professor

Coleta de interação com o botão **Para o Professor** já existente no livro piloto.

## Eventos

### `teacher_button_opened`

Disparado ao abrir o modal do professor.

```json
{
  "page": 5,
  "teacher_button_id": "teacher_button_page_5",
  "section_id": "teacher_section_page_5"
}
```

### `teacher_button_closed`

Disparado ao fechar o modal (botão ×, clique no fundo ou tecla Escape).

```json
{
  "page": 5,
  "teacher_button_id": "teacher_button_page_5",
  "section_id": "teacher_section_page_5",
  "duration_seconds": 12
}
```

## Regras

- Múltiplas aberturas na mesma sessão são permitidas.
- O tempo é calculado entre abertura e fechamento (mínimo 1 segundo).
- Se o capítulo/sessão for finalizado com o modal aberto, `teacher_button_closed` é registrado automaticamente antes de `chapter_finished` / `session_finished`.

## Summary

Campos adicionados ao export:

| Campo | Descrição |
|-------|-----------|
| `teacher_button_opened_count` | Total de aberturas |
| `teacher_button_closed_count` | Total de fechamentos |
| `teacher_button_total_seconds` | Soma de `duration_seconds` nos fechamentos |
| `teacher_sections_opened` | IDs únicos das seções abertas |
| `teacher_button_usage_by_section` | Detalhe por seção (aberturas, tempo, repetição) |
| `teacher_button_unique_count` | Quantidade de botões/seções diferentes |
| `teacher_button_repeated_sections` | Seções abertas mais de uma vez |
| `most_opened_teacher_section` | Seção com mais aberturas |

Consolidação: `src/analytics/teacherButtonSummary.ts`

## Dashboard

- Seção **Botão do professor** com aberturas, tempo total e seções.
- **Resumo interpretativo** menciona uso ou ausência do botão.
- **Saúde da coleta:** ✓ quando houve uso; ℹ em alertas de interpretação quando não houve acesso.

## Código

- `src/analytics/teacherButtonTracking.ts` — registro e flush ao encerrar sessão
- `src/analytics/teacherButtonSummary.ts` — consolidação no export
- `src/components/TeacherButton.tsx` — integração no modal existente
- `src/components/Book.tsx` — prop `page` em cada instância do botão

## Fora de escopo

Perfil professor/aluno, autenticação, painel do professor, gabaritos separados e atividades interativas.
