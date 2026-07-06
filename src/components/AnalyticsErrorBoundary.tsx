import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getActiveBookPage } from '../ld/bookPageScroll';
import { ANALYTICS_EVENT_NAMES } from '../ld/sessionTypes';
import { getLastActivePage } from '../ld/pageReadingState';
import { useOptionalAnalytics } from '../ld/SessionProvider';
import { isSessionCollecting } from '../ld/sessionStatus';
import { trackOncePerSession } from '../ld/sessionDedup';

const MAX_MESSAGE_LENGTH = 200;
const MAX_STACK_LENGTH = 300;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

interface AnalyticsErrorBoundaryProps {
  boundary: string;
  sessionId?: string;
  track?: (eventName: string, metadata?: Record<string, unknown>) => void;
  children: ReactNode;
  fallback?: ReactNode;
}

interface AnalyticsErrorBoundaryState {
  hasError: boolean;
}

class AnalyticsErrorBoundaryClass extends Component<
  AnalyticsErrorBoundaryProps,
  AnalyticsErrorBoundaryState
> {
  state: AnalyticsErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AnalyticsErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const { boundary, sessionId, track } = this.props;
    if (!track || !sessionId || !isSessionCollecting(sessionId)) return;

    const message = truncate(error.message || 'Erro de renderização', MAX_MESSAGE_LENGTH);
    const activePage = getLastActivePage() ?? getActiveBookPage();
    const dedupeKey = `${ANALYTICS_EVENT_NAMES.renderError}_${boundary}_${activePage}_${message}`;

    trackOncePerSession(sessionId, dedupeKey, () => {
      track(ANALYTICS_EVENT_NAMES.renderError, {
        boundary,
        page: activePage,
        error_message: message,
        component_stack: truncate(info.componentStack ?? '', MAX_STACK_LENGTH),
      });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
            <p className="font-semibold">Não foi possível exibir esta parte do livro.</p>
            <p className="mt-2 text-sm text-red-800">
              Recarregue a página ou inicie um novo teste.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function AnalyticsErrorBoundary({
  boundary,
  children,
  fallback,
}: {
  boundary: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const analytics = useOptionalAnalytics();

  return (
    <AnalyticsErrorBoundaryClass
      boundary={boundary}
      sessionId={analytics?.sessionId}
      track={analytics?.track}
      fallback={fallback}
    >
      {children}
    </AnalyticsErrorBoundaryClass>
  );
}

export default AnalyticsErrorBoundary;
