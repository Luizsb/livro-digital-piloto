import { useMemo, useState, type FormEvent } from 'react';
import { ANALYTICS_EVENT_NAMES } from '../analytics/eventTypes';
import { trackFeedbackSubmitted, type WouldUseAgain } from '../analytics/feedbackTracking';
import { useOptionalAnalytics } from '../analytics/AnalyticsProvider';
import { useStoredEvents } from '../analytics/useStoredEvents';

function FeedbackIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 8h28c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H22l-10 8v-8h-2c-2.2 0-4-1.8-4-4V12c0-2.2 1.8-4 4-4Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 18h16M16 24h11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M34 10l1.2 2.4 2.6.4-1.9 1.8.4 2.6L34 15.8l-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L34 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14 24.5 21 31.5 34 17.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FeedbackHeaderProps {
  title: string;
  subtitle: string;
  variant?: 'default' | 'success';
  expanded?: boolean;
  interactive?: boolean;
}

function ChevronIcon({ expanded, className = 'h-6 w-6' }: { expanded: boolean; className?: string }) {
  return (
    <svg
      className={`${className} shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedbackHeader({
  title,
  subtitle,
  variant = 'default',
  expanded = true,
  interactive = false,
}: FeedbackHeaderProps) {
  const isSuccess = variant === 'success';

  return (
    <div
      className={`px-6 py-5 ${
        isSuccess
          ? 'bg-gradient-to-r from-[#5f1f6b] to-[#80298F]'
          : 'bg-gradient-to-r from-[#80298F] to-[#9B4DAB]'
      } ${interactive ? 'text-left' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-md ${
            isSuccess ? 'bg-white/20 text-white ring-2 ring-white/40' : 'bg-white text-[#80298F]'
          }`}
        >
          {isSuccess ? <CheckIcon /> : <FeedbackIcon className="h-9 w-9" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
            Piloto do livro digital
          </p>
          <h2
            id="chapter-feedback-title"
            className="mt-1 text-xl font-bold leading-tight text-white md:text-2xl"
            style={{ fontFamily: "'Filson Soft', sans-serif" }}
          >
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-snug text-white/90">{subtitle}</p>
          {interactive && !expanded ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Clique para abrir o formulário
            </p>
          ) : null}
        </div>
        {interactive ? (
          <ChevronIcon expanded={expanded} className="h-7 w-7 text-white/90" />
        ) : null}
      </div>
    </div>
  );
}

interface RatingFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  name: string;
}

function RatingField({ label, value, onChange, name }: RatingFieldProps) {
  return (
    <fieldset className="mb-5 rounded-xl border border-[#80298F]/15 bg-white/80 p-4 shadow-sm">
      <legend className="mb-3 px-1 text-sm font-semibold text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              value === score
                ? 'border-[#80298F] bg-[#80298F] text-white shadow-md'
                : 'border-slate-300 bg-white text-slate-700 hover:border-[#80298F]/60 hover:bg-[#F9DDFF]/50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
              className="sr-only"
            />
            {score}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const WOULD_USE_OPTIONS: { value: WouldUseAgain; label: string }[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'talvez', label: 'Talvez' },
  { value: 'nao', label: 'Não' },
];

function ChapterFeedback() {
  const analytics = useOptionalAnalytics();
  const events = useStoredEvents();
  const alreadySubmitted = useMemo(
    () => events.some((event) => event.event_name === ANALYTICS_EVENT_NAMES.feedbackSubmitted),
    [events],
  );

  const [rating, setRating] = useState(0);
  const [navigationClarity, setNavigationClarity] = useState(0);
  const [visualComfort, setVisualComfort] = useState(0);
  const [resourceUsefulness, setResourceUsefulness] = useState(0);
  const [wouldUseAgain, setWouldUseAgain] = useState<WouldUseAgain | ''>('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isFormValid =
    rating > 0 &&
    navigationClarity > 0 &&
    visualComfort > 0 &&
    resourceUsefulness > 0 &&
    wouldUseAgain !== '';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!analytics || !analytics.participantId || !isFormValid || wouldUseAgain === '') return;

    const tracked = trackFeedbackSubmitted(
      analytics.sessionId,
      analytics.participantId,
      {
        rating,
        navigation_clarity: navigationClarity,
        visual_comfort: visualComfort,
        resource_usefulness: resourceUsefulness,
        would_use_again: wouldUseAgain,
        comment,
      },
      analytics.track,
    );

    if (tracked) {
      setSubmitted(true);
      setError(null);
      return;
    }

    setError('O feedback já foi enviado nesta sessão.');
    setSubmitted(true);
  };

  if (!analytics) return null;

  if (submitted || alreadySubmitted) {
    return (
      <section
        className="my-12 overflow-hidden rounded-2xl border-2 border-[#80298F]/30 shadow-xl shadow-[#80298F]/10"
        aria-live="polite"
      >
        <FeedbackHeader
          variant="success"
          title="Obrigado pelo seu feedback!"
          subtitle="Suas respostas foram registradas e ajudam a melhorar o livro digital."
        />
        <div className="border-t border-[#80298F]/15 bg-gradient-to-b from-[#F9DDFF]/50 to-white px-6 py-10 text-center">
          <p className="mx-auto max-w-md text-sm text-slate-600">
            Você concluiu a etapa de avaliação deste piloto. Se quiser revisar o que foi
            coletado, use o botão <strong>Ver eventos</strong> no canto da tela.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`my-12 overflow-hidden rounded-2xl border-2 shadow-xl transition-shadow ${
        expanded
          ? 'border-[#80298F]/40 shadow-[#80298F]/10'
          : 'border-[#80298F]/35 shadow-[#80298F]/15 ring-2 ring-[#80298F]/10 ring-offset-2 ring-offset-white'
      }`}
      aria-labelledby="chapter-feedback-title"
    >
      <button
        type="button"
        className="w-full cursor-pointer text-left transition hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#80298F] focus-visible:ring-offset-2"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="chapter-feedback-panel"
      >
        <FeedbackHeader
          title="Conte como foi sua experiência"
          subtitle={
            expanded
              ? 'Sua opinião é essencial para melhorarmos a leitura digital. Respostas anônimas, vinculadas apenas ao código do participante.'
              : 'Ajude a melhorar o livro digital com uma avaliação rápida e anônima.'
          }
          expanded={expanded}
          interactive
        />
      </button>

      {expanded ? (
      <div
        id="chapter-feedback-panel"
        className="relative border-t border-[#80298F]/15 bg-gradient-to-b from-[#F9DDFF]/45 via-white to-[#FFF8EB]/60 px-6 py-8 md:px-8"
      >
        <div
          className="pointer-events-none absolute right-4 top-4 hidden text-[#80298F]/10 md:block"
          aria-hidden
        >
          <FeedbackIcon className="h-28 w-28" />
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <RatingField
            label="Avaliação geral do capítulo"
            name="rating"
            value={rating}
            onChange={setRating}
          />
          <RatingField
            label="Clareza da navegação"
            name="navigation_clarity"
            value={navigationClarity}
            onChange={setNavigationClarity}
          />
          <RatingField
            label="Conforto de leitura"
            name="visual_comfort"
            value={visualComfort}
            onChange={setVisualComfort}
          />
          <RatingField
            label="Utilidade dos recursos digitais (ODA, Escola Digital, imagens)"
            name="resource_usefulness"
            value={resourceUsefulness}
            onChange={setResourceUsefulness}
          />

          <fieldset className="mb-5 rounded-xl border border-[#80298F]/15 bg-white/80 p-4 shadow-sm">
            <legend className="mb-3 px-1 text-sm font-semibold text-slate-800">
              Você usaria este livro digital novamente?
            </legend>
            <div className="flex flex-wrap gap-2">
              {WOULD_USE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold transition ${
                    wouldUseAgain === option.value
                      ? 'border-[#80298F] bg-[#80298F] text-white shadow-md'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-[#80298F]/60 hover:bg-[#F9DDFF]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="would_use_again"
                    value={option.value}
                    checked={wouldUseAgain === option.value}
                    onChange={() => setWouldUseAgain(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-6 rounded-xl border border-[#80298F]/15 bg-white/80 p-4 shadow-sm">
            <label
              htmlFor="feedback-comment"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Comentário (opcional)
            </label>
            <textarea
              id="feedback-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#80298F] focus:outline-none focus:ring-2 focus:ring-[#80298F]/25"
              placeholder="O que funcionou bem? O que poderia melhorar?"
            />
          </div>

          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={!isFormValid}
            className="inline-flex items-center gap-2 rounded-full bg-[#80298F] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#80298F]/25 transition hover:bg-[#6b2278] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <FeedbackIcon className="h-5 w-5 text-white" />
            Enviar feedback
          </button>
        </form>
      </div>
      ) : null}
    </section>
  );
}

export default ChapterFeedback;
