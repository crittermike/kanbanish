import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOnClickOutside } from './useOnClickOutside';

describe('useOnClickOutside', () => {
  let handler;
  let element;

  beforeEach(() => {
    handler = vi.fn();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('calls handler when clicking outside the referenced element', () => {
    const ref = { current: element };
    renderHook(() => useOnClickOutside(ref, handler));

    const outsideEvent = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(outsideEvent);
  });

  it('does not call handler when clicking inside the referenced element', () => {
    const ref = { current: element };
    renderHook(() => useOnClickOutside(ref, handler));

    const insideEvent = new MouseEvent('mousedown', { bubbles: true });
    element.dispatchEvent(insideEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handler when clicking on a child of the referenced element', () => {
    const child = document.createElement('span');
    element.appendChild(child);
    const ref = { current: element };
    renderHook(() => useOnClickOutside(ref, handler));

    const childEvent = new MouseEvent('mousedown', { bubbles: true });
    child.dispatchEvent(childEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handler when ref.current is null', () => {
    const ref = { current: null };
    renderHook(() => useOnClickOutside(ref, handler));

    const event = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const ref = { current: element };
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('updates handler when it changes', () => {
    const ref = { current: element };
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ h }) => useOnClickOutside(ref, h),
      { initialProps: { h: handler } }
    );

    // Click outside with first handler
    const event1 = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event1);
    expect(handler).toHaveBeenCalledTimes(1);

    // Switch handler
    rerender({ h: handler2 });

    // Click outside with second handler
    const event2 = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event2);
    expect(handler2).toHaveBeenCalledTimes(1);
    // Original handler should not be called again
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('works with a new ref element', () => {
    const element2 = document.createElement('div');
    document.body.appendChild(element2);

    const ref = { current: element };
    const { rerender } = renderHook(
      ({ r }) => useOnClickOutside(r, handler),
      { initialProps: { r: ref } }
    );

    // Click on element2 (outside ref element) — should trigger
    const event1 = new MouseEvent('mousedown', { bubbles: true });
    element2.dispatchEvent(event1);
    expect(handler).toHaveBeenCalledTimes(1);

    // Update ref to point to element2
    const ref2 = { current: element2 };
    rerender({ r: ref2 });

    handler.mockClear();

    // Click on element (now outside ref2) — should trigger
    const event2 = new MouseEvent('mousedown', { bubbles: true });
    element.dispatchEvent(event2);
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(element2);
  });

  it('registers mousedown listener on mount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    addSpy.mockRestore();
  });
});
