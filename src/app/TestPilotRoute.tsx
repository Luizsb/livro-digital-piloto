import { useCallback, useEffect, useRef, useState } from 'react';
import Book from '@book/components/Book';
import ParticipantGate from '@app/ParticipantGate';
import FinishTestButton from '@analytics-ui/FinishTestButton';
import SessionLifecycle from '@analytics-ui/SessionLifecycle';
import SessionErrorBoundary from '@analytics-ui/SessionErrorBoundary';
import { useAnalytics } from '@analytics/SessionProvider';
import { getSessionStatus } from '@analytics/sessionStatus';
import { wasSessionEventTracked } from '@analytics/sessionDedup';
import { ANALYTICS_EVENT_NAMES } from '@analytics/sessionTypes';
import { reloadForNewSession } from '@analytics/resetLdStorage';

function PilotSessionControls({ onFinished }: { onFinished: () => void }) {
  const { sessionStatus } = useAnalytics();

  if (sessionStatus === 'finished') {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 z-50">
      <FinishTestButton onFinished={onFinished} variant="prominent" autoExportReport />
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
      <SessionErrorBoundary boundary="book">
        <Book />
      </SessionErrorBoundary>
      <PilotSessionControls onFinished={handleFinished} />
    </ParticipantGate>
  );
}
