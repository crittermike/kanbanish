import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook that traps focus within a container element when active.
 * When activated, focuses the first focusable element inside the container.
 * Tab/Shift+Tab cycle within the container. Escape closes via onClose callback.
 * When deactivated, returns focus to the element that was focused before activation.
 *
 * @param {React.RefObject} containerRef - Ref to the modal/dialog container element
 * @param {boolean} isOpen - Whether the trap is active
 * @param {Object} [options] - Optional configuration
 * @param {Function} [options.onClose] - Called when Escape is pressed
 */
export function useFocusTrap(containerRef, isOpen, options = {}) {
  const { onClose } = options;
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep onClose ref up to date without triggering the effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Save the currently focused element so we can restore it later
    previouslyFocusedRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Focus the first focusable element after a microtask to let the DOM settle
    const focusTimer = setTimeout(() => {
      const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') {
        return;
      }

      const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, containerRef]);
}
