import { useCallback, useEffect, useState } from 'react';
import Book from './components/Book';
import ParticipantGate from './components/ParticipantGate';
import ExportEventsButton from './components/ExportEventsButton';
import EventsPanelButton from './components/EventsPanelButton';
import FinishTestButton from './components/FinishTestButton';
import SessionLifecycle from './components/SessionLifecycle';
import DashboardPage from './dashboard/DashboardPage';
import ParticipantHubRoute from './components/ParticipantHubRoute';
import AnalyticsErrorBoundary from './components/AnalyticsErrorBoundary';
import { SessionProvider, useAnalytics } from './ld/SessionProvider';

function useHashView(): 'book' | 'dashboard' | 'projeto' {
  const resolveView = (): 'book' | 'dashboard' | 'projeto' => {
    if (window.location.hash.startsWith('#/dashboard')) return 'dashboard';
    if (window.location.hash.startsWith('#/projeto')) return 'projeto';
    return 'book';
  };

  const [view, setView] = useState<'book' | 'dashboard' | 'projeto'>(resolveView);

  useEffect(() => {
    const onHashChange = () => setView(resolveView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return view;
}

function BookSessionControls({ onFinished }: { onFinished: () => void }) {
  const { sessionStatus } = useAnalytics();

  if (sessionStatus === 'finished') {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 z-50 flex flex-col items-start gap-2">
      <EventsPanelButton />
      <FinishTestButton onFinished={onFinished} />
      <ExportEventsButton />
      <a
        href="#/projeto"
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50"
      >
        Sobre o projeto
      </a>
      <a
        href="#/dashboard"
        className="rounded-lg border border-[#80298F]/30 bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow-lg transition hover:bg-[#F9DDFF]"
      >
        LD Insights
      </a>
    </div>
  );
}

function BookAppContent() {
  const view = useHashView();
  const { sessionStatus } = useAnalytics();
  const [showFinishScreen, setShowFinishScreen] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'finished') {
      setShowFinishScreen(true);
    }
  }, [sessionStatus]);

  const handleFinished = useCallback(() => {
    setShowFinishScreen(true);
  }, []);

  if (view === 'dashboard') {
    return <DashboardPage />;
  }

  if (view === 'projeto') {
    return <ParticipantHubRoute />;
  }

  return (
    <ParticipantGate showFinishScreen={showFinishScreen}>
      <SessionLifecycle />
      <AnalyticsErrorBoundary boundary="book">
        <Book />
      </AnalyticsErrorBoundary>
      <BookSessionControls onFinished={handleFinished} />
    </ParticipantGate>
  );
}

/**
 * Piloto do relatório de uso — livro + dashboard LD Insights.
 */
function App() {
  return (
    <SessionProvider>
      <AnalyticsErrorBoundary boundary="app">
        <BookAppContent />
      </AnalyticsErrorBoundary>
    </SessionProvider>
  );
}

export default App;
