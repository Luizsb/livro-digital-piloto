import { useSessionFinishOnUnload } from '../ld/useSessionFinishOnUnload';
import { useLinkClickTracking } from '../ld/useLinkClickTracking';
import { useRuntimeErrorTracking } from '../ld/useRuntimeErrorTracking';
import { useIdleTracking } from '../ld/useIdleTracking';

/** Hooks de ciclo de vida da sessão e interações com conteúdo (sem UI). */
function SessionLifecycle() {
  useSessionFinishOnUnload();
  useLinkClickTracking();
  useRuntimeErrorTracking();
  useIdleTracking();
  return null;
}

export default SessionLifecycle;
