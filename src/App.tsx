import { useCallback, useEffect, useState } from 'react';
import Book from './components/Book';
import ParticipantGate from './components/ParticipantGate';
import ExportEventsButton from './components/ExportEventsButton';
import EventsPanelButton from './components/EventsPanelButton';
import FinishTestButton from './components/FinishTestButton';
import SessionLifecycle from './components/SessionLifecycle';
import DashboardPage from './dashboard/DashboardPage';
import { AnalyticsProvider, useAnalytics } from './analytics/AnalyticsProvider';

function useHashView(): 'book' | 'dashboard' {
  const [view, setView] = useState<'book' | 'dashboard'>(() =>
    window.location.hash.startsWith('#/dashboard') ? 'dashboard' : 'book',
  );

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash.startsWith('#/dashboard') ? 'dashboard' : 'book');
    };
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

  return (
    <ParticipantGate showFinishScreen={showFinishScreen}>
      <SessionLifecycle />
      <Book />
      <BookSessionControls onFinished={handleFinished} />
    </ParticipantGate>
  );
}

/**
 * Piloto do relatório de uso — livro + dashboard LD Insights.
 */
function App() {
  return (
    <AnalyticsProvider>
      <BookAppContent />
    </AnalyticsProvider>
  );
}

export default App;
