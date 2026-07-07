import { listChapterPageNumbers, getChapterPageConfig } from '@book/chapter/chapterPageConfig';
import { BOOK_PILOT } from '@analytics/sessionTypes';
import { isResourceOpenedEvent } from '@analytics/resourceSignals';
import { ANALYTICS_EVENT_NAMES } from '@analytics/sessionTypes';
import type { AnalyticsEvent } from '@analytics/sessionTypes';

/**
 * Inventário do que o capítulo deveria conter — distinto dos eventos coletados.
 * Ao portar um novo capítulo, adicione uma entrada em `CHAPTER_MANIFEST_REGISTRY`.
 *
 * Documentação: docs/CATÁLOGO-EVENTOS-E-RELATÓRIOS.md § Manifest do capítulo
 */
export type DigitalResourceKind = 'video' | 'oda' | 'other';

export const DIGITAL_RESOURCE_LABELS: Record<string, string> = {
  escola_digital_video: 'Vídeo Escola Digital',
  oda_page_10_comercio: 'ODA',
};

export function getDigitalResourceKind(resourceId: string): DigitalResourceKind {
  if (resourceId === 'escola_digital_video') return 'video';
  if (resourceId.startsWith('oda_')) return 'oda';
  return 'other';
}

export interface DigitalResourceCoverageRow {
  kind: Exclude<DigitalResourceKind, 'other'>;
  label: string;
  expected: number;
  coverage_rate: number | null;
  missing: string[];
}

export function buildDigitalResourceCoverageRows(
  manifest: ChapterManifest,
  resourcesNotOpened: string[],
): DigitalResourceCoverageRow[] {
  const notOpened = new Set(resourcesNotOpened);
  const byKind: Record<'video' | 'oda', string[]> = { video: [], oda: [] };

  for (const id of manifest.expected_resources) {
    const kind = getDigitalResourceKind(id);
    if (kind === 'video' || kind === 'oda') byKind[kind].push(id);
  }

  return (['video', 'oda'] as const)
    .map((kind) => {
      const expected = byKind[kind];
      const missing = expected.filter((id) => notOpened.has(id));
      return {
        kind,
        label: kind === 'video' ? 'Vídeo Escola Digital' : 'ODA',
        expected: expected.length,
        coverage_rate: coverageRate(expected.length - missing.length, expected.length),
        missing: missing.map((id) => DIGITAL_RESOURCE_LABELS[id] ?? id),
      };
    })
    .filter((row) => row.expected > 0);
}

export interface ChapterManifest {
  book_id: string;
  chapter_id: string;
  pages: number[];
  expected_images: string[];
  /** Recursos digitais previstos (vídeo, ODA, links externos, etc.). */
  expected_resources: string[];
  expected_teacher_buttons: string[];
  /** Atividades interativas com resposta (futuro: activity_started). */
  expected_activities: string[];
}

export interface ChapterCoverageSummary {
  expected_pages_count: number;
  expected_images_count: number;
  expected_resources_count: number;
  expected_teacher_buttons_count: number;
  expected_activities_count: number;
  pages_viewed_coverage_rate: number | null;
  pages_completed_coverage_rate: number | null;
  image_exposure_coverage_rate: number | null;
  resource_open_coverage_rate: number | null;
  teacher_button_usage_coverage_rate: number | null;
  activity_start_coverage_rate: number | null;
  pages_not_viewed: number[];
  images_not_exposed: string[];
  resources_not_opened: string[];
  teacher_buttons_not_used: string[];
  activities_not_started: string[];
}

function registryKey(bookId: string, chapterId: string): string {
  return `${bookId}::${chapterId}`;
}

function buildPagesFromConfig(bookId: string, chapterId: string): number[] {
  const bounds = getChapterPageConfig(bookId, chapterId);
  return listChapterPageNumbers(bounds);
}

/**
 * Registro por livro + capítulo — alinhado ao HTML em `Book.tsx` / `Poster.tsx`.
 */
export const CHAPTER_MANIFEST_REGISTRY: Record<string, ChapterManifest> = {
  [registryKey(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id)]: {
    book_id: BOOK_PILOT.book_id,
    chapter_id: BOOK_PILOT.chapter_id,
    pages: buildPagesFromConfig(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id),
    expected_images: [
      'page_3_abertura_rialto',
      'page_5_feira_rolo',
      'page_6_moedas_lidia',
      'page_8_rota_seda',
      'page_9_nau_cabral',
    ],
    expected_resources: ['escola_digital_video', 'oda_page_10_comercio'],
    expected_teacher_buttons: [
      'teacher_section_page_3',
      'teacher_section_page_4',
      'teacher_section_page_7',
      'teacher_section_page_8',
      'teacher_section_page_10',
      'teacher_section_page_11',
      'teacher_section_page_12',
    ],
    expected_activities: [],
  },
};

export function getChapterManifest(bookId: string, chapterId: string): ChapterManifest {
  const manifest = CHAPTER_MANIFEST_REGISTRY[registryKey(bookId, chapterId)];
  if (!manifest) {
    throw new Error(
      `Manifest do capítulo não encontrado para ${bookId} / ${chapterId}. ` +
        'Adicione uma entrada em src/book/chapter/chapterManifest.ts → CHAPTER_MANIFEST_REGISTRY.',
    );
  }
  return manifest;
}

export function getActiveChapterManifest(): ChapterManifest {
  return getChapterManifest(BOOK_PILOT.book_id, BOOK_PILOT.chapter_id);
}

export function tryGetChapterManifest(
  bookId: string,
  chapterId: string,
): ChapterManifest | null {
  try {
    return getChapterManifest(bookId, chapterId);
  } catch {
    return null;
  }
}

function coverageRate(matched: number, expected: number): number | null {
  if (expected <= 0) return null;
  return Math.round((matched / expected) * 100);
}

function collectStartedActivityIds(events: AnalyticsEvent[]): Set<string> {
  const started = new Set<string>();
  for (const event of events) {
    if (event.event_name === ANALYTICS_EVENT_NAMES.activityStarted) {
      const activityId = event.metadata?.activity_id;
      if (typeof activityId === 'string') started.add(activityId);
      continue;
    }
    if (!isResourceOpenedEvent(event)) continue;
    const meta = event.metadata ?? {};
    if (meta.type === 'oda_opened' && typeof meta.link_id === 'string') {
      started.add(meta.link_id);
    }
  }
  return started;
}

function collectOpenedResourceIds(events: AnalyticsEvent[]): Set<string> {
  const opened = new Set<string>();
  for (const event of events) {
    if (!isResourceOpenedEvent(event)) continue;
    const linkId = event.metadata?.link_id;
    if (typeof linkId === 'string') opened.add(linkId);
  }
  return opened;
}

function collectTeacherSectionsUsed(events: AnalyticsEvent[]): Set<string> {
  const sections = new Set<string>();
  for (const event of events) {
    if (event.event_name !== ANALYTICS_EVENT_NAMES.teacherButtonOpened) continue;
    const meta = event.metadata ?? {};
    const sectionId =
      typeof meta.section_id === 'string'
        ? meta.section_id
        : typeof meta.section === 'string'
          ? meta.section
          : null;
    if (sectionId) sections.add(sectionId);
  }
  return sections;
}

export interface BuildChapterCoverageInput {
  book_id: string;
  chapter_id: string;
  pages_viewed: number[];
  pages_completed: number[];
  images_viewed_unique: string[];
  activities_started: string[];
  events: AnalyticsEvent[];
}

export function buildChapterCoverageSummary(
  manifest: ChapterManifest,
  input: BuildChapterCoverageInput,
): ChapterCoverageSummary {
  const pagesViewed = new Set(input.pages_viewed);
  const pagesCompleted = new Set(input.pages_completed);
  const imagesViewed = new Set(input.images_viewed_unique);
  const activitiesStarted = collectStartedActivityIds(input.events);
  const resourcesOpened = collectOpenedResourceIds(input.events);
  const teacherSectionsUsed = collectTeacherSectionsUsed(input.events);

  const pages_not_viewed = manifest.pages.filter((page) => !pagesViewed.has(page));
  const images_not_exposed = manifest.expected_images.filter((id) => !imagesViewed.has(id));
  const resources_not_opened = manifest.expected_resources.filter((id) => !resourcesOpened.has(id));
  const teacher_buttons_not_used = manifest.expected_teacher_buttons.filter(
    (id) => !teacherSectionsUsed.has(id),
  );
  const activities_not_started = manifest.expected_activities.filter(
    (id) => !activitiesStarted.has(id),
  );

  const pagesViewedMatched = manifest.pages.length - pages_not_viewed.length;
  const pagesCompletedMatched = manifest.pages.filter((page) => pagesCompleted.has(page)).length;

  return {
    expected_pages_count: manifest.pages.length,
    expected_images_count: manifest.expected_images.length,
    expected_resources_count: manifest.expected_resources.length,
    expected_teacher_buttons_count: manifest.expected_teacher_buttons.length,
    expected_activities_count: manifest.expected_activities.length,
    pages_viewed_coverage_rate: coverageRate(pagesViewedMatched, manifest.pages.length),
    pages_completed_coverage_rate: coverageRate(pagesCompletedMatched, manifest.pages.length),
    image_exposure_coverage_rate: coverageRate(
      manifest.expected_images.length - images_not_exposed.length,
      manifest.expected_images.length,
    ),
    resource_open_coverage_rate: coverageRate(
      manifest.expected_resources.length - resources_not_opened.length,
      manifest.expected_resources.length,
    ),
    teacher_button_usage_coverage_rate: coverageRate(
      manifest.expected_teacher_buttons.length - teacher_buttons_not_used.length,
      manifest.expected_teacher_buttons.length,
    ),
    activity_start_coverage_rate: coverageRate(
      manifest.expected_activities.length - activities_not_started.length,
      manifest.expected_activities.length,
    ),
    pages_not_viewed,
    images_not_exposed,
    resources_not_opened,
    teacher_buttons_not_used,
    activities_not_started,
  };
}

export function buildChapterCoverageForBook(
  bookId: string,
  chapterId: string,
  input: BuildChapterCoverageInput,
): ChapterCoverageSummary | null {
  const manifest = tryGetChapterManifest(bookId, chapterId);
  if (!manifest) return null;
  return buildChapterCoverageSummary(manifest, input);
}
