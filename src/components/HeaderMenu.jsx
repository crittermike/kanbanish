import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ITEM_SELECTOR = '[role^="menuitem"]:not([disabled])';
const VIEWPORT_MARGIN = 8;

/**
 * Header dropdown menu. Closes on Escape, outside click, or item selection.
 * `children` is a render function that receives `close`.
 */
const HeaderMenu = ({ className = '', buttonClassName = '', label, title, buttonContent, align = 'end', children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus && buttonRef.current) buttonRef.current.focus();
  }, []);

  // Keep the popover inside the viewport when the header wraps on small screens.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!isOpen || !menu) return;
    const rect = menu.getBoundingClientRect();
    let shift = 0;
    if (rect.left < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - rect.left;
    else if (rect.right > window.innerWidth - VIEWPORT_MARGIN) shift = window.innerWidth - VIEWPORT_MARGIN - rect.right;
    if (shift) menu.style.transform = `translateX(${shift}px)`;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const firstItem = menuRef.current?.querySelector(ITEM_SELECTOR);
    if (firstItem) firstItem.focus();

    const handlePointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const handleMenuKeyDown = (e) => {
    const items = Array.from(menuRef.current?.querySelectorAll(ITEM_SELECTOR) || []);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement);
    let next;
    if (e.key === 'ArrowDown') next = items[(index + 1) % items.length];
    else if (e.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length];
    else if (e.key === 'Home') next = items[0];
    else if (e.key === 'End') next = items[items.length - 1];
    else if (e.key === 'Tab') {
      setIsOpen(false);
      return;
    } else return;
    e.preventDefault();
    next.focus();
  };

  return (
    <div className={`header-menu ${className}`.trim()} ref={wrapperRef}>
      <button
        ref={buttonRef}
        className={buttonClassName}
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        title={title || label}
      >
        {buttonContent}
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className={`header-menu-popover header-menu-popover-${align}`}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
