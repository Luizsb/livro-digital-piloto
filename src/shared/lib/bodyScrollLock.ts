let lockCount = 0;
let savedScrollY = 0;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

function isInsideScrollableElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  let el: Element | null = target;
  while (el) {
    const { overflowY } = window.getComputedStyle(el);
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      el.scrollHeight > el.clientHeight
    ) {
      return true;
    }
    el = el.parentElement;
  }

  return false;
}

function preventScroll(event: Event): void {
  if (isInsideScrollableElement(event.target)) return;
  event.preventDefault();
}

function preventScrollKeys(event: KeyboardEvent): void {
  if (!SCROLL_KEYS.has(event.key)) return;
  if (isInsideScrollableElement(event.target)) return;
  event.preventDefault();
}

function keepScrollPosition(): void {
  if (window.scrollY !== savedScrollY) {
    window.scrollTo(0, savedScrollY);
  }
}

/**
 * Bloqueia rolagem da página mantendo a barra de rolagem visível.
 * Não altera overflow nem padding — evita o “pulo” lateral do layout.
 */
export function lockBodyScroll(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  savedScrollY = window.scrollY;

  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('keydown', preventScrollKeys);
  window.addEventListener('scroll', keepScrollPosition, { passive: true });
}

export function unlockBodyScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  window.removeEventListener('wheel', preventScroll);
  window.removeEventListener('touchmove', preventScroll);
  window.removeEventListener('keydown', preventScrollKeys);
  window.removeEventListener('scroll', keepScrollPosition);
}
