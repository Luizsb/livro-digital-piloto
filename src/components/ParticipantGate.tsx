import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import { useAnalytics } from '../analytics/AnalyticsProvider';
import {
  markSessionEventTracked,
  wasSessionEventTracked,
} from '../analytics/sessionDedup';
import { reloadForNewSession } from '../analytics/resetAnalytics';
import { subscribeToEventsUpdates } from '../analytics/trackEvent';

interface ParticipantGateProps {
  children: ReactNode;
}

/**
 * Solicita código anônimo (P01, P02…) antes de exibir o livro.
 * Garante ordem: session_started → book_opened → (conteúdo + page_viewed).
 */
function ParticipantGate({ children }: ParticipantGateProps) {
  const { participantId, setParticipantId, track, sessionId } = useAnalytics();
  const [input, setInput] = useState(participantId ?? '');
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(Boolean(participantId));
  const [bookAnalyticsReady, setBookAnalyticsReady] = useState(false);
  const bookOpenedRef = useRef(false);

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
    const ok = setParticipantId(input);
    if (!ok) {
      setError('Use um código no formato P01, P02, P03…');
      return;
    }
    setError('');
    setIsReady(true);
  };

  if (isReady && bookAnalyticsReady) {
    return <>{children}</>;
  }

  if (isReady) {
    return (
      <div className="min-h-screen w-full bg-gray-200 flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Preparando o capítulo…</p>
      </div>
    );
  }

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
          Informe seu código de participante para continuar. Usamos apenas códigos
          anônimos (ex.: P01, P02) — sem nome, e-mail ou dados pessoais.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-800">
            Código do participante
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="P01"
              maxLength={4}
              autoComplete="off"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg tracking-wide focus:border-[#80298F] focus:outline-none focus:ring-2 focus:ring-[#80298F]/30"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#80298F] px-4 py-3 font-semibold text-white transition hover:bg-[#6b2278]"
          >
            Entrar no capítulo
          </button>
        </form>
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

export default ParticipantGate;
