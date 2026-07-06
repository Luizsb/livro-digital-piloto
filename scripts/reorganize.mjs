/**
 * One-shot reorganization: moves src files into domain folders and rewrites imports.
 * Run: node scripts/reorganize.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'src');

const APP_FILES = [
  'App.tsx',
  'ParticipantGate.tsx',
  'TestPilotGate.tsx',
  'TestPilotRoute.tsx',
  'ParticipantHubRoute.tsx',
  'ProjectHubPage.tsx',
  'projectHubContent.ts',
  'pilotParticipants.ts',
  'TestFinishedScreen.tsx',
];

const ANALYTICS_UI_FILES = [
  'TrackedImage.tsx',
  'TrackedLink.tsx',
  'TrackedVideo.tsx',
  'SessionLifecycle.tsx',
  'AnalyticsErrorBoundary.tsx',
  'EventsPanelButton.tsx',
  'EventReportPanel.tsx',
  'ExportEventsButton.tsx',
  'FinishTestButton.tsx',
  'BookPageTracker.tsx',
];

const BOOK_FILES = [
  'Book.tsx',
  'Chapter.tsx',
  'Header.tsx',
  'Footer.tsx',
  'Poster.tsx',
  'Pagination.tsx',
  'ScrollPageIndicator.tsx',
  'ContinuaProximaPagina.tsx',
  'ClosePillButton.tsx',
  'CaixaTexto.tsx',
  'EscolaDigital.tsx',
  'ConversaVai.tsx',
  'ConversaVem.tsx',
  'ParaSaberMais.tsx',
  'OrganizandoConhecimentos.tsx',
  'SaberesAcao.tsx',
  'TestandoIdeias.tsx',
  'AgoraVoceJaSabe.tsx',
  'CriteriosAvaliacao.tsx',
  'TeacherButton.tsx',
  'TeacherAnswers.tsx',
  'GameModal.tsx',
  'ChapterFeedback.tsx',
  'QuestionRenderer.tsx',
  'QuestionAlternative.tsx',
  'QuestionFillBlanks.tsx',
  'QuestionMultipleChoice.tsx',
  'QuestionOrdering.tsx',
  'QuestionTableFill.tsx',
  'QuestionTextInput.tsx',
  'QuestionTextInputWithEmbedded.tsx',
  'QuestionTrueFalse.tsx',
];

const CHAPTER_FILES = ['chapterPageConfig.ts', 'chapterManifest.ts'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveFile(from, to) {
  if (!fs.existsSync(from)) {
    if (fs.existsSync(to)) return;
    console.warn('skip missing:', from);
    return;
  }
  ensureDir(path.dirname(to));
  if (fs.existsSync(to)) fs.unlinkSync(to);
  fs.renameSync(from, to);
}

function moveDir(from, to) {
  if (!fs.existsSync(from)) {
    if (fs.existsSync(to)) return;
    console.warn('skip missing dir:', from);
    return;
  }
  ensureDir(path.dirname(to));
  if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });
  fs.renameSync(from, to);
}

function moveFiles() {
  const dirs = [
    'app',
    'book/components/shared',
    'book/chapter',
    'book/data',
    'book/hooks',
    'book/types',
    'book/oda',
    'analytics',
    'analytics-ui',
    'shared/lib',
    'shared/utils',
    'shared/constants',
  ];
  dirs.forEach((d) => ensureDir(path.join(src, d)));

  APP_FILES.forEach((f) =>
    moveFile(path.join(src, 'components', f), path.join(src, 'app', f)),
  );

  ANALYTICS_UI_FILES.forEach((f) =>
    moveFile(path.join(src, 'components', f), path.join(src, 'analytics-ui', f)),
  );

  BOOK_FILES.forEach((f) =>
    moveFile(path.join(src, 'components', f), path.join(src, 'book', 'components', f)),
  );

  moveDir(
    path.join(src, 'components', 'shared'),
    path.join(src, 'book', 'components', 'shared'),
  );

  CHAPTER_FILES.forEach((f) =>
    moveFile(path.join(src, 'ld', f), path.join(src, 'book', 'chapter', f)),
  );

  moveDir(path.join(src, 'ld'), path.join(src, 'analytics'));
  moveDir(path.join(src, 'ODAS'), path.join(src, 'book', 'oda'));
  moveDir(path.join(src, 'data'), path.join(src, 'book', 'data'));
  moveDir(path.join(src, 'hooks'), path.join(src, 'book', 'hooks'));
  moveDir(path.join(src, 'types'), path.join(src, 'book', 'types'));
  moveDir(path.join(src, 'lib'), path.join(src, 'shared', 'lib'));
  moveDir(path.join(src, 'utils'), path.join(src, 'shared', 'utils'));
  moveDir(path.join(src, 'constants'), path.join(src, 'shared', 'constants'));

  const componentsDir = path.join(src, 'components');
  if (fs.existsSync(componentsDir)) {
    const remaining = fs.readdirSync(componentsDir);
    if (remaining.length === 0) fs.rmdirSync(componentsDir);
    else console.warn('components leftovers:', remaining);
  }
}

/** Map legacy import prefixes to path aliases (longest match first). */
const ALIAS_RULES = [
  ['@book/chapter/chapterPageConfig', ['../ld/chapterPageConfig', '../../ld/chapterPageConfig', '../../../ld/chapterPageConfig', './chapterPageConfig', '../chapterPageConfig']],
  ['@book/chapter/chapterManifest', ['../ld/chapterManifest', '../../ld/chapterManifest', '../../../ld/chapterManifest', './chapterManifest', '../chapterManifest']],
  ['@analytics/', ['../ld/', '../../ld/', '../../../ld/', '../../../../ld/', './ld/']],
  ['@analytics-ui/', ['../components/Tracked', '../components/Session', '../components/Analytics', '../components/Events', '../components/Event', '../components/Export', '../components/Finish', '../components/BookPageTracker']],
  ['@app/', ['../components/Participant', '../components/Test', '../components/Project', '../components/pilot', '../components/project', './App', '../App']],
  ['@book/oda/', ['../ODAS/', '../../ODAS/', '../../../ODAS/']],
  ['@book/components/', ['../components/', '../../components/', '../../../components/', './components/']],
  ['@book/data/', ['../data/', '../../data/']],
  ['@book/hooks/', ['../hooks/', '../../hooks/']],
  ['@book/types/', ['../types/', '../../types/']],
  ['@shared/lib/', ['../lib/', '../../lib/', '../../../lib/']],
  ['@shared/utils/', ['../utils/', '../../utils/', '../../../utils/']],
  ['@shared/constants/', ['../constants/', '../../constants/']],
  ['@dashboard/', ['../dashboard/', '../../dashboard/']],
];

function rewriteImports(content) {
  let out = content;

  out = out.replace(/from ['"]\.\/App\.tsx['"]/g, "from '@app/App'");
  out = out.replace(/from ['"]\.\/App['"]/g, "from '@app/App'");
  out = out.replace(/from ['"]\.\.\/components\/Book['"]/g, "from '@book/components/Book'");
  out = out.replace(/from ['"]\.\/components\/Book['"]/g, "from '@book/components/Book'");

  const componentAnalyticsUi = [
    'TrackedImage', 'TrackedLink', 'TrackedVideo', 'SessionLifecycle',
    'AnalyticsErrorBoundary', 'EventsPanelButton', 'EventReportPanel',
    'ExportEventsButton', 'FinishTestButton', 'BookPageTracker',
  ];
  for (const name of componentAnalyticsUi) {
    out = out.replaceAll(`from '../components/${name}'`, `from '@analytics-ui/${name}'`);
    out = out.replaceAll(`from './components/${name}'`, `from '@analytics-ui/${name}'`);
    out = out.replaceAll(`from '../../components/${name}'`, `from '@analytics-ui/${name}'`);
  }

  const componentApp = [
    'ParticipantGate', 'TestPilotGate', 'TestPilotRoute', 'ParticipantHubRoute',
    'ProjectHubPage', 'TestFinishedScreen',
  ];
  for (const name of componentApp) {
    out = out.replaceAll(`from '../components/${name}'`, `from '@app/${name}'`);
    out = out.replaceAll(`from './components/${name}'`, `from '@app/${name}'`);
  }

  out = out.replaceAll("from '../ld/", "from '@analytics/");
  out = out.replaceAll("from '../../ld/", "from '@analytics/");
  out = out.replaceAll("from '../../../ld/", "from '@analytics/");
  out = out.replaceAll("from './ld/", "from '@analytics/");
  out = out.replaceAll("from '../SessionProvider'", "from '@analytics/SessionProvider'");
  out = out.replaceAll("from '../ld/SessionProvider'", "from '@analytics/SessionProvider'");

  out = out.replaceAll("from './chapterPageConfig'", "from '@book/chapter/chapterPageConfig'");
  out = out.replaceAll("from '../chapterPageConfig'", "from '@book/chapter/chapterPageConfig'");
  out = out.replaceAll("from './chapterManifest'", "from '@book/chapter/chapterManifest'");
  out = out.replaceAll("from '../chapterManifest'", "from '@book/chapter/chapterManifest'");

  out = out.replaceAll("from '../lib/", "from '@shared/lib/");
  out = out.replaceAll("from '../../lib/", "from '@shared/lib/");
  out = out.replaceAll("from '../../../lib/", "from '@shared/lib/");
  out = out.replaceAll("from '../utils/", "from '@shared/utils/");
  out = out.replaceAll("from '../../utils/", "from '@shared/utils/");
  out = out.replaceAll("from '../constants/", "from '@shared/constants/");
  out = out.replaceAll("from '../../constants/", "from '@shared/constants/");
  out = out.replaceAll("from '../data/", "from '@book/data/");
  out = out.replaceAll("from '../../data/", "from '@book/data/");
  out = out.replaceAll("from '../types/", "from '@book/types/");
  out = out.replaceAll("from '../../types/", "from '@book/types/");
  out = out.replaceAll("from '../hooks/", "from '@book/hooks/");
  out = out.replaceAll("from '../../hooks/", "from '@book/hooks/");
  out = out.replaceAll("from '../ODAS/", "from '@book/oda/");
  out = out.replaceAll("from '../../ODAS/", "from '@book/oda/");

  out = out.replaceAll("from './pilotParticipants'", "from '@app/pilotParticipants'");
  out = out.replaceAll("from './projectHubContent'", "from '@app/projectHubContent'");
  out = out.replaceAll("from '../components/pilotParticipants'", "from '@app/pilotParticipants'");
  out = out.replaceAll("from '../components/projectHubContent'", "from '@app/projectHubContent'");

  // Book internal relative imports after move to book/components
  out = out.replaceAll("from '../ODAS/", "from '@book/oda/");
  out = out.replaceAll("from '../data/", "from '@book/data/");
  out = out.replaceAll("from '../hooks/", "from '@book/hooks/");
  out = out.replaceAll("from '../types/", "from '@book/types/");
  out = out.replaceAll("from '../constants/", "from '@shared/constants/");
  out = out.replaceAll("from '../lib/", "from '@shared/lib/");
  out = out.replaceAll("from '../utils/", "from '@shared/utils/");

  // Fix paths in comments/docs inside source
  out = out.replaceAll('src/ld/', 'src/analytics/');
  out = out.replaceAll('src/ld/chapterPageConfig.ts', 'src/book/chapter/chapterPageConfig.ts');
  out = out.replaceAll('src/ld/chapterManifest.ts', 'src/book/chapter/chapterManifest.ts');

  return out;
}

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else if (/\.(ts|tsx)$/.test(entry.name)) callback(full);
  }
}

function rewriteAllFiles() {
  walk(src, (file) => {
    const original = fs.readFileSync(file, 'utf8');
    const updated = rewriteImports(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      console.log('rewrote:', path.relative(root, file));
    }
  });

  // dashboard stays in place but needs ld -> analytics
  walk(path.join(src, 'dashboard'), (file) => {
    let content = fs.readFileSync(file, 'utf8');
    const updated = rewriteImports(content);
    if (updated !== content) fs.writeFileSync(file, updated);
  });
}

function moveAppTsx() {
  const from = path.join(src, 'App.tsx');
  const to = path.join(src, 'app', 'App.tsx');
  if (fs.existsSync(from)) moveFile(from, to);
}

console.log('Moving files...');
moveFiles();
moveAppTsx();
console.log('Rewriting imports...');
rewriteAllFiles();
console.log('Done.');
