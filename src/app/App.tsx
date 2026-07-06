import { useCallback, useEffect, useState } from 'react';
import Book from '@book/components/Book';
import ParticipantGate from '@app/ParticipantGate';
import ExportEventsButton from '@analytics-ui/ExportEventsButton';
import EventsPanelButton from '@analytics-ui/EventsPanelButton';
import FinishTestButton from '@analytics-ui/FinishTestButton';
import SessionLifecycle from '@analytics-ui/SessionLifecycle';
import DashboardPage from '@dashboard/DashboardPage';
import ParticipantHubRoute from '@app/ParticipantHubRoute';
import TestPilotRoute from '@app/TestPilotRoute';
import AnalyticsErrorBoundary from '@analytics-ui/AnalyticsErrorBoundary';
import { SessionProvider, useAnalytics } from '@analytics/SessionProvider';

type AppView = 'book' | 'dashboard' | 'projeto' | 'teste';

function isTestePath(): boolean {
  const path = window.location.pathname.replace(/\/$/, '');
  return path === '/teste' || path.endsWith('/teste');
}

function resolveView(): AppView {
  if (isTestePath()) return 'teste';
  if (window.location.hash.startsWith('#/dashboard')) return 'dashboard';
  if (window.location.hash.startsWith('#/projeto')) return 'projeto';
  return 'book';
}

function useAppView(): AppView {
  const [view, setView] = useState<AppView>(resolveView);

  useEffect(() => {
    if (window.location.hash.startsWith('#/testepiloto') && !isTestePath()) {
      const base = window.location.pathname.replace(/\/$/, '');
      window.location.replace(`${base}/teste${window.location.search}`);
      return;
    }

    const sync = () => setView(resolveView());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
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
  const view = useAppView();
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

  if (view === 'teste') {
    return <TestPilotRoute />;
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
