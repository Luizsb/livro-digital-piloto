import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { ANALYTICS_EVENT_NAMES } from '@analytics/sessionTypes';
import { capturePageLoadTiming } from '@analytics/captureLoadTiming';
import { useAnalytics } from '@analytics/SessionProvider';
import {
  markSessionEventTracked,
  wasSessionEventTracked,
} from '@analytics/sessionDedup';
import { subscribeToEventsUpdates } from '@analytics/recordEvent';
import TestFinishedScreen from '@app/TestFinishedScreen';
import ProjectHubPage from '@app/ProjectHubPage';
import TestPilotGate from '@app/TestPilotGate';
import { isPilotParticipantId } from '@app/pilotParticipants';
import { flushPendingModalResourceOpened } from '@analytics/modalResourceTracking';
import { getSessionStatus } from '@analytics/sessionStatus';
import { reloadForNewSession } from '@analytics/resetLdStorage';

function resolveInitialReady(
  mode: 'default' | 'pilot',
  participantId: string | null,
): boolean {
  if (!participantId) return false;
  if (mode === 'pilot') {
    return getSessionStatus() === 'active';
  }
  return true;
}

interface ParticipantGateProps {
  children: ReactNode;
  showFinishScreen: boolean;
  mode?: 'default' | 'pilot';
}

function extractParticipantNumber(participantId: string | null): string {
  if (!participantId) return '';
  const match = participantId.match(/^P(\d{2})$/i);
  return match ? match[1] : '';
}

/**
 * Solicita código anônimo (P01, P02…) antes de exibir o livro.
 * Garante ordem: session_started → book_opened → (conteúdo + page_viewed).
 */
function ParticipantGate({ children, showFinishScreen, mode = 'default' }: ParticipantGateProps) {
  const { participantId, setParticipantId, track, sessionId, sessionStatus, refreshSessionStatus } =
    useAnalytics();
  const [participantNumber, setParticipantNumber] = useState(() =>
    extractParticipantNumber(participantId),
  );
  const [selectedPilotId, setSelectedPilotId] = useState(() =>
    participantId && isPilotParticipantId(participantId) ? participantId : '',
  );
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(() => resolveInitialReady(mode, participantId));
  const [bookAnalyticsReady, setBookAnalyticsReady] = useState(false);
  const bookOpenedRef = useRef(false);

  useEffect(() => {
    refreshSessionStatus();
  }, [refreshSessionStatus, sessionStatus]);

  useEffect(() => {
    if (!isReady || !participantId) {
      setBookAnalyticsReady(false);
      return;
    }

    const ensureBookOpened = () => {
      if (!wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.sessionStarted)) {
        setBookAnalyticsReady(false);
        return;
      }

      if (!bookOpenedRef.current) {
        if (wasSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.bookOpened)) {
          bookOpenedRef.current = true;
        } else {
          bookOpenedRef.current = true;
          markSessionEventTracked(sessionId, ANALYTICS_EVENT_NAMES.bookOpened);
          track(ANALYTICS_EVENT_NAMES.bookOpened, {
            ...(capturePageLoadTiming() ?? {}),
            load_trigger: 'book_opened',
          });
        }
      }

      setBookAnalyticsReady(true);
      flushPendingModalResourceOpened(sessionId);
    };

    ensureBookOpened();
    return subscribeToEventsUpdates(ensureBookOpened);
  }, [isReady, participantId, sessionId, track]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'pilot') {
      if (!selectedPilotId) {
        setError('Selecione seu nome na lista.');
        return;
      }
      const ok = setParticipantId(selectedPilotId);
      if (!ok) {
        setError('Não foi possível iniciar a sessão. Tente novamente.');
        return;
      }
      setError('');
      setIsReady(true);
      return;
    }

    if (!participantNumber) {
      setError('Informe o número do participante (ex.: 01, 02, 03…)');
      return;
    }
    const code = `P${participantNumber.padStart(2, '0')}`;
    const ok = setParticipantId(code);
    if (!ok) {
      setError('Use um número de 01 a 99.');
      return;
    }
    setError('');
    setIsReady(true);
  };

  const handlePilotSelect = (id: string) => {
    setSelectedPilotId(id);
    setError('');
  };

  const handleNumberChange = (raw: string) => {
    setParticipantNumber(raw.replace(/\D/g, '').slice(0, 2));
    setError('');
  };

  const handleClearPilotData = () => {
    reloadForNewSession();
  };

  if (!participantId || !isReady) {
    if (mode === 'pilot') {
      return (
        <TestPilotGate
          selectedParticipantId={selectedPilotId}
          onParticipantSelect={handlePilotSelect}
          onSubmit={handleSubmit}
          onClearData={handleClearPilotData}
          error={error}
        />
      );
    }

    return (
      <ProjectHubPage
        participantNumber={participantNumber}
        onParticipantNumberChange={handleNumberChange}
        onSubmit={handleSubmit}
        error={error}
        participantId={participantId}
      />
    );
  }

  if (sessionStatus === 'finished' && showFinishScreen) {
    return <TestFinishedScreen mode={mode} />;
  }

  if (isReady && bookAnalyticsReady) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-200 flex items-center justify-center p-6">
      <p className="text-sm text-slate-600">Preparando o capítulo…</p>
    </div>
  );
}

export default ParticipantGate;
