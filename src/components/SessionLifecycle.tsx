import { useSessionFinishOnUnload } from '../analytics/useSessionFinishOnUnload';
import { useLinkClickTracking } from '../analytics/useLinkClickTracking';

/** Hooks de ciclo de vida da sessão e interações com conteúdo (sem UI). */
function SessionLifecycle() {
  useSessionFinishOnUnload();
  useLinkClickTracking();
  return null;
}

export default SessionLifecycle;
