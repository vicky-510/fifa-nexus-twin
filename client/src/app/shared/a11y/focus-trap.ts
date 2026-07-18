/**
 * Shared keyboard focus-trap for overlay dialogs.
 *
 * Keeps Tab / Shift+Tab cycling within the given container while it is open,
 * wrapping from the last focusable element back to the first (and vice versa).
 * Used by every modal dialog in the app so the trapping behavior stays
 * identical everywhere instead of being copy-pasted per component.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Handles a Tab/Shift+Tab keydown inside `container`, preventing focus from
 * escaping it. No-op for any other key or when the container has no focusable
 * elements.
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') {
    return;
  }

  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (active === first || !active || !container.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else {
    if (active === last || !active || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }
}
