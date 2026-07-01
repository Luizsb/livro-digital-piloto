import { useSessionFinishOnUnload } from '../analytics/useSessionFinishOnUnload';
import { useLinkClickTracking } from '../analytics/useLinkClickTracking';
import { useRuntimeErrorTracking } from '../analytics/useRuntimeErrorTracking';

/** Hooks de ciclo de vida da sessão e interações com conteúdo (sem UI). */
function SessionLifecycle() {
  useSessionFinishOnUnload();
  useLinkClickTracking();
  useRuntimeErrorTracking();
  return null;
}

export default SessionLifecycle;
