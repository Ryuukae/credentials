/**
 * Utility function to trap keyboard focus within a specific DOM element.
 * Crucial for modal accessibility to prevent users from tabbing to background elements.
 * @param {HTMLElement} element - The DOM element to trap focus within.
 * @returns {() => void} - A teardown function to remove the event listeners.
 */
export function trapFocus(element) {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const focusableElements = Array.from(element.querySelectorAll(selector));

  if (focusableElements.length === 0) {
    return () => {}; // No-op if no focusable elements
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab: if on the first element, wrap to the last
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: if on the last element, wrap to the first
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Auto-focus the first element upon initialization
  firstFocusable.focus();

  // Return the teardown/cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}
