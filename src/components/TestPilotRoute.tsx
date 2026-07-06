import { useCallback, useEffect, useRef, useState } from 'react';
import Book from './Book';
import ParticipantGate from './ParticipantGate';
import FinishTestButton from './FinishTestButton';
import SessionLifecycle from './SessionLifecycle';
import AnalyticsErrorBoundary from './AnalyticsErrorBoundary';
import { useAnalytics } from '../ld/SessionProvider';
import { getSessionStatus } from '../ld/sessionStatus';
import { wasSessionEventTracked } from '../ld/sessionDedup';
import { ANALYTICS_EVENT_NAMES } from '../ld/sessionTypes';
import { reloadForNewSession } from '../ld/resetLdStorage';

function PilotSessionControls({ onFinished }: { onFinished: () => void }) {
  const { sessionStatus } = useAnalytics();

  if (sessionStatus === 'finished') {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 z-50">
      <FinishTestButton onFinished={onFinished} variant="prominent" />
    </div>
  );
}

export default function TestPilotRoute() {
  const { sessionId, sessionStatus } = useAnalytics();
  const [showFinishScreen, setShowFinishScreen] = useState(false);
  const resetCheckedRef = useRef(false);

  useEffect(() => {
    document.title = 'Teste piloto — História cap. 07';
  }, []);

  useEffect(() => {
    if (resetCheckedRef.current) return;
    resetCheckedRef.current = true;

    const finished =
      getSessionStatus() === 'finished' ||
      wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionFinished);

    if (finished) {
      reloadForNewSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionStatus === 'finished') {
      setShowFinishScreen(true);
    }
  }, [sessionStatus]);

  const handleFinished = useCallback(() => {
    setShowFinishScreen(true);
  }, []);

  return (
    <ParticipantGate showFinishScreen={showFinishScreen} mode="pilot">
      <SessionLifecycle />
      <AnalyticsErrorBoundary boundary="book">
        <Book />
      </AnalyticsErrorBoundary>
      <PilotSessionControls onFinished={handleFinished} />
    </ParticipantGate>
  );
}
