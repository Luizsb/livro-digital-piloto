import { useSessionFinishOnUnload } from '@analytics/useSessionFinishOnUnload';
import { useLinkClickTracking } from '@analytics/useLinkClickTracking';
import { useRuntimeErrorTracking } from '@analytics/useRuntimeErrorTracking';
import { useIdleTracking } from '@analytics/useIdleTracking';

/** Hooks de ciclo de vida da sessão e interações com conteúdo (sem UI). */
function SessionLifecycle() {
  useSessionFinishOnUnload();
  useLinkClickTracking();
  useRuntimeErrorTracking();
  useIdleTracking();
  return null;
}

export default SessionLifecycle;
