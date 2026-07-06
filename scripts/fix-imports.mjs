/**
 * Rewrites legacy import paths after src/ reorganization.
 * Run: node scripts/fix-imports.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'src');

function rewrite(content) {
  let out = content;

  const pairs = [
    ["from '../ld/", "from '@analytics/"],
    ["from '../../ld/", "from '@analytics/"],
    ["from '../../../ld/", "from '@analytics/"],
    ["from '../../../../ld/", "from '@analytics/"],
    ["from './ld/", "from '@analytics/"],
    ["from '../components/Book'", "from '@book/components/Book'"],
    ["from './components/Book'", "from '@book/components/Book'"],
    ["from '../components/ParticipantGate'", "from '@app/ParticipantGate'"],
    ["from '../components/TestPilotRoute'", "from '@app/TestPilotRoute'"],
    ["from '../components/ParticipantHubRoute'", "from '@app/ParticipantHubRoute'"],
    ["from '../components/ExportEventsButton'", "from '@analytics-ui/ExportEventsButton'"],
    ["from '../components/EventsPanelButton'", "from '@analytics-ui/EventsPanelButton'"],
    ["from '../components/FinishTestButton'", "from '@analytics-ui/FinishTestButton'"],
    ["from '../components/SessionLifecycle'", "from '@analytics-ui/SessionLifecycle'"],
    ["from '../components/AnalyticsErrorBoundary'", "from '@analytics-ui/AnalyticsErrorBoundary'"],
    ["from '../components/TestPilotGate'", "from '@app/TestPilotGate'"],
    ["from '../components/TestFinishedScreen'", "from '@app/TestFinishedScreen'"],
    ["from '../components/ProjectHubPage'", "from '@app/ProjectHubPage'"],
    ["from './components/ParticipantGate'", "from '@app/ParticipantGate'"],
    ["from './components/TestPilotRoute'", "from '@app/TestPilotRoute'"],
    ["from './components/ParticipantHubRoute'", "from '@app/ParticipantHubRoute'"],
    ["from './components/ExportEventsButton'", "from '@analytics-ui/ExportEventsButton'"],
    ["from './components/EventsPanelButton'", "from '@analytics-ui/EventsPanelButton'"],
    ["from './components/FinishTestButton'", "from '@analytics-ui/FinishTestButton'"],
    ["from './components/SessionLifecycle'", "from '@analytics-ui/SessionLifecycle'"],
    ["from './components/AnalyticsErrorBoundary'", "from '@analytics-ui/AnalyticsErrorBoundary'"],
    ["from './ld/SessionProvider'", "from '@analytics/SessionProvider'"],
    ["from '../dashboard/DashboardPage'", "from '@dashboard/DashboardPage'"],
    ["from './dashboard/DashboardPage'", "from '@dashboard/DashboardPage'"],
    ["from './chapterPageConfig'", "from '@book/chapter/chapterPageConfig'"],
    ["from '../chapterPageConfig'", "from '@book/chapter/chapterPageConfig'"],
    ["from './chapterManifest'", "from '@book/chapter/chapterManifest'"],
    ["from '../chapterManifest'", "from '@book/chapter/chapterManifest'"],
    ["from '../lib/", "from '@shared/lib/"],
    ["from '../../lib/", "from '@shared/lib/"],
    ["from '../../../lib/", "from '@shared/lib/"],
    ["from '../utils/", "from '@shared/utils/"],
    ["from '../../utils/", "from '@shared/utils/"],
    ["from '../../../utils/", "from '@shared/utils/"],
    ["from '../constants/", "from '@shared/constants/"],
    ["from '../../constants/", "from '@shared/constants/"],
    ["from '../data/", "from '@book/data/"],
    ["from '../../data/", "from '@book/data/"],
    ["from '../types/", "from '@book/types/"],
    ["from '../../types/", "from '@book/types/"],
    ["from '../hooks/", "from '@book/hooks/"],
    ["from '../../hooks/", "from '@book/hooks/"],
    ["from '../ODAS/", "from '@book/oda/"],
    ["from '../../ODAS/", "from '@book/oda/"],
    ["from '../ODAS/", "from '@book/oda/"],
    ["from './pilotParticipants'", "from '@app/pilotParticipants'"],
    ["from './projectHubContent'", "from '@app/projectHubContent'"],
    ["from './TestPilotGate'", "from '@app/TestPilotGate'"],
    ["from './TestFinishedScreen'", "from '@app/TestFinishedScreen'"],
    ["from './ProjectHubPage'", "from '@app/ProjectHubPage'"],
    ["from './Book'", "from '@book/components/Book'"],
    ["from './FinishTestButton'", "from '@analytics-ui/FinishTestButton'"],
    ["from './SessionLifecycle'", "from '@analytics-ui/SessionLifecycle'"],
    ["from './AnalyticsErrorBoundary'", "from '@analytics-ui/AnalyticsErrorBoundary'"],
    ["from './ParticipantGate'", "from '@app/ParticipantGate'"],
    ["from './TrackedImage'", "from '@analytics-ui/TrackedImage'"],
    ["from './TrackedLink'", "from '@analytics-ui/TrackedLink'"],
    ["from './TrackedVideo'", "from '@analytics-ui/TrackedVideo'"],
    ["from './BookPageTracker'", "from '@analytics-ui/BookPageTracker'"],
    ["from './EventReportPanel'", "from '@analytics-ui/EventReportPanel'"],
    ["from './EventsPanelButton'", "from '@analytics-ui/EventsPanelButton'"],
    ["from './ExportEventsButton'", "from '@analytics-ui/ExportEventsButton'"],
    ["from './FinishTestButton'", "from '@analytics-ui/FinishTestButton'"],
    ["from './SessionLifecycle'", "from '@analytics-ui/SessionLifecycle'"],
    ["from './AnalyticsErrorBoundary'", "from '@analytics-ui/AnalyticsErrorBoundary'"],
    ["from './ChapterFeedback'", "from '@book/components/ChapterFeedback'"],
    ["from './GameModal'", "from '@book/components/GameModal'"],
    ["from './TeacherButton'", "from '@book/components/TeacherButton'"],
    ["from './TeacherAnswers'", "from '@book/components/TeacherAnswers'"],
    ["from './Chapter'", "from '@book/components/Chapter'"],
    ["from './Header'", "from '@book/components/Header'"],
    ["from './Footer'", "from '@book/components/Footer'"],
    ["from './Poster'", "from '@book/components/Poster'"],
    ["from './Pagination'", "from '@book/components/Pagination'"],
    ["from './ScrollPageIndicator'", "from '@book/components/ScrollPageIndicator'"],
    ["from './QuestionRenderer'", "from '@book/components/QuestionRenderer'"],
    ["from './EscolaDigital'", "from '@book/components/EscolaDigital'"],
    ["from './ConversaVai'", "from '@book/components/ConversaVai'"],
    ["from './ConversaVem'", "from '@book/components/ConversaVem'"],
    ["from './ParaSaberMais'", "from '@book/components/ParaSaberMais'"],
    ["from './OrganizandoConhecimentos'", "from '@book/components/OrganizandoConhecimentos'"],
    ["from './SaberesAcao'", "from '@book/components/SaberesAcao'"],
    ["from './TestandoIdeias'", "from '@book/components/TestandoIdeias'"],
    ["from './AgoraVoceJaSabe'", "from '@book/components/AgoraVoceJaSabe'"],
    ["from './CaixaTexto'", "from '@book/components/CaixaTexto'"],
    ["from './CriteriosAvaliacao'", "from '@book/components/CriteriosAvaliacao'"],
    ["from './ContinuaProximaPagina'", "from '@book/components/ContinuaProximaPagina'"],
    ["from './ClosePillButton'", "from '@book/components/ClosePillButton'"],
    ["from './shared/", "from '@book/components/shared/"],
    ["from '../shared/", "from '@book/components/shared/"],
    ["from './QuestionAlternative'", "from '@book/components/QuestionAlternative'"],
    ["from './QuestionFillBlanks'", "from '@book/components/QuestionFillBlanks'"],
    ["from './QuestionMultipleChoice'", "from '@book/components/QuestionMultipleChoice'"],
    ["from './QuestionOrdering'", "from '@book/components/QuestionOrdering'"],
    ["from './QuestionTableFill'", "from '@book/components/QuestionTableFill'"],
    ["from './QuestionTextInput'", "from '@book/components/QuestionTextInput'"],
    ["from './QuestionTextInputWithEmbedded'", "from '@book/components/QuestionTextInputWithEmbedded'"],
    ["from './QuestionTrueFalse'", "from '@book/components/QuestionTrueFalse'"],
    ["from '../components/pilotParticipants'", "from '@app/pilotParticipants'"],
    ["from '../components/projectHubContent'", "from '@app/projectHubContent'"],
    ['src/ld/', 'src/analytics/'],
    ['src/ld/chapterPageConfig.ts', 'src/book/chapter/chapterPageConfig.ts'],
    ['src/ld/chapterManifest.ts', 'src/book/chapter/chapterManifest.ts'],
  ];

  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }

  return out;
}

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else if (/\.(ts|tsx)$/.test(entry.name)) callback(full);
  }
}

let count = 0;
walk(src, (file) => {
  const original = fs.readFileSync(file, 'utf8');
  const updated = rewrite(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    count += 1;
    console.log(path.relative(root, file));
  }
});

console.log(`Updated ${count} files.`);
