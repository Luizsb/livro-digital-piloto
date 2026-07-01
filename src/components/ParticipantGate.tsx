import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import { useAnalytics } from '../analytics/AnalyticsProvider';
import {
  markSessionEventTracked,
  wasSessionEventTracked,
} from '../analytics/sessionDedup';
import { reloadForNewSession } from '../analytics/resetAnalytics';
import { subscribeToEventsUpdates } from '../analytics/trackEvent';
import TestFinishedScreen from './TestFinishedScreen';

interface ParticipantGateProps {
  children: ReactNode;
  showFinishScreen: boolean;
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
function ParticipantGate({ children, showFinishScreen }: ParticipantGateProps) {
  const { participantId, setParticipantId, track, sessionId, sessionStatus, refreshSessionStatus } =
    useAnalytics();
  const [participantNumber, setParticipantNumber] = useState(() =>
    extractParticipantNumber(participantId),
  );
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(Boolean(participantId));
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
          track(ANALYTICS_EVENT_NAMES.bookOpened);
        }
      }

      setBookAnalyticsReady(true);
    };

    ensureBookOpened();
    return subscribeToEventsUpdates(ensureBookOpened);
  }, [isReady, participantId, sessionId, track]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
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

  const handleNumberChange = (raw: string) => {
    setParticipantNumber(raw.replace(/\D/g, '').slice(0, 2));
    setError('');
  };

  if (!participantId || !isReady) {
    return (
      <div className="min-h-screen w-full bg-gray-200 flex items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          role="dialog"
          aria-labelledby="participant-gate-title"
        >
          <h1
            id="participant-gate-title"
            className="mb-2 text-xl font-bold text-[#80298F]"
          >
            Acesso ao livro digital
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            Informe o número do seu participante para continuar.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              Código do participante
              <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-[#80298F] focus-within:ring-2 focus-within:ring-[#80298F]/30">
                <span className="flex items-center bg-slate-100 px-4 text-lg font-semibold tracking-wide text-[#80298F]">
                  P
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={participantNumber}
                  onChange={(e) => handleNumberChange(e.target.value)}
                  placeholder="01"
                  maxLength={2}
                  autoComplete="off"
                  className="w-full border-0 px-4 py-3 text-lg tracking-wide focus:outline-none focus:ring-0"
                />
              </div>
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#80298F] px-4 py-3 font-semibold text-white transition hover:bg-[#6b2278]"
            >
              Entrar no capítulo
            </button>
          </form>
          <a
            href="#/dashboard"
            className="mt-4 flex w-full items-center justify-center rounded-lg border border-[#80298F]/30 bg-white px-4 py-3 text-sm font-semibold text-[#80298F] transition hover:bg-[#F9DDFF]"
          >
            Abrir dashboard (LD Insights)
          </a>
          <p className="mt-4 text-center text-xs text-slate-500">
            Dados antigos na mesma aba?{' '}
            <button
              type="button"
              className="font-semibold text-[#80298F] underline hover:no-underline"
              onClick={() => reloadForNewSession()}
            >
              Limpar e começar de novo
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'finished' && showFinishScreen) {
    return <TestFinishedScreen />;
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
