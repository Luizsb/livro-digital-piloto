import { useEffect, useState } from 'react';
import Book from './components/Book';
import ParticipantGate from './components/ParticipantGate';
import ExportEventsButton from './components/ExportEventsButton';
import EventsPanelButton from './components/EventsPanelButton';
import FinishTestButton from './components/FinishTestButton';
import SessionLifecycle from './components/SessionLifecycle';
import DashboardPage from './dashboard/DashboardPage';
import { AnalyticsProvider } from './analytics/AnalyticsProvider';

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

/**
 * Piloto do relatório de uso — livro + dashboard LD Insights.
 */
function App() {
  const view = useHashView();

  if (view === 'dashboard') {
    return <DashboardPage />;
  }

  return (
    <AnalyticsProvider>
      <ParticipantGate>
        <SessionLifecycle />
        <Book />
        <div className="fixed bottom-16 left-4 z-50 flex flex-col items-start gap-2">
          <EventsPanelButton />
          <FinishTestButton />
          <ExportEventsButton />
          <a
            href="#/dashboard"
            className="rounded-lg border border-[#80298F]/30 bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow-lg transition hover:bg-[#F9DDFF]"
          >
            LD Insights
          </a>
        </div>
      </ParticipantGate>
    </AnalyticsProvider>
  );
}

export default App;
