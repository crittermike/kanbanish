import { useEffect } from 'react';

/**
 * Hook that triggers a callback when a click occurs outside the referenced element.
 * Uses 'mousedown' event to catch clicks before they propagate.
 *
 * @param {React.RefObject} ref - Ref to the element to detect outside clicks for
 * @param {Function} handler - Callback to invoke when an outside click is detected
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const handleClickOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
}
