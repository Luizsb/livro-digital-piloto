/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURAÇÃO CENTRAL — limiares universais do piloto de analytics
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Limiares que valem para qualquer livro** (tempos, taxas, scroll, imagens).
 *
 * Páginas iniciais/finais e total por capítulo **não ficam aqui** — cada livro
 * tem numeração própria. Configure em:
 *   → src/ld/chapterPageConfig.ts
 *
 * Documentação: docs/CONFIGURACAO-ANALYTICS.md
 * README: README.md § "Configurar critérios das métricas"
 *
 * ─── Mapa rápido ─────────────────────────────────────────────────────────
 *
 * | Bloco            | Afeta principalmente                          |
 * |------------------|-----------------------------------------------|
 * | page             | `page_completed` (tempo mínimo na página)     |
 * | chapter          | taxa mínima de `chapter_completed` (%)        |
 * | scroll           | `page_viewed`, paginação por scroll           |
 * | image            | `image_viewed` (exposição na viewport)        |
 * | readingQuality   | `session_finished.reading_depth` (MVP-02)     |
 *
 * | Páginas do capítulo | chapterPageConfig.ts → CHAPTER_PAGE_REGISTRY |
 */

export const ANALYTICS_CONFIG = {
  // ── Jornada de leitura (MVP-02) ─────────────────────────────────────────
  page: {
    /**
     * Segundos mínimos na página para registrar `page_completed`.
     * Usado ao avançar de página, em Finalizar teste e ao fechar a aba.
     */
    completeMinSeconds: 20,
  },

  // ── Conclusão pedagógica do capítulo (MVP-04) ─────────────────────────────
  chapter: {
    /**
     * Taxa mínima (%) para disparar `chapter_completed` ao clicar em Finalizar teste.
     * Pode ser sobrescrita por capítulo em `chapterPageConfig.ts`.
     *
     * Critério completo (ambos obrigatórios):
     *   1. pages_viewed_count === chapter_total_pages (todas vistas)
     *   2. completion_rate >= minCompletionRateForChapterCompleted
     *
     * Lógica: chapterMetrics.ts → meetsChapterCompletedCriteria()
     */
    minCompletionRateForChapterCompleted: 99,
  },

  // ── Scroll — quando uma página “vira” ativa (MVP-02) ────────────────────
  scroll: {
    triggerMinPx: 56,
    triggerMaxPx: 160,
    triggerViewportRatio: 0.1,
    /**
     * A página precisa permanecer ativa por este tempo antes de registrar
     * `page_viewed` — evita falsos positivos na borda do scroll.
     */
    pageCommitDelayMs: 250,
  },

  // ── Imagens — exposição na tela (MVP-03) ────────────────────────────────
  image: {
    viewThreshold: 0.5,
    viewDelayMs: 750,
  },

  // ── Profundidade de leitura em `session_finished` (MVP-02) ─────────────
  readingQuality: {
    veryQuickMaxSeconds: 5,
    quickScanMaxSeconds: 15,
    moderateMaxSeconds: 40,
  },

  // ── Inatividade com a aba visível ───────────────────────────────────────
  idle: {
    /** Segundos sem interação (mouse, teclado, scroll, toque) para considerar inativo. */
    thresholdSeconds: 60,
  },
} as const;

export type AnalyticsConfig = typeof ANALYTICS_CONFIG;
