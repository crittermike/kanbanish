import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container;
  let button1;
  let button2;
  let button3;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    button1 = document.createElement('button');
    button1.textContent = 'First';
    button2 = document.createElement('button');
    button2.textContent = 'Second';
    button3 = document.createElement('button');
    button3.textContent = 'Third';
    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.removeChild(container);
  });

  it('focuses the first focusable element when opened', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.activeElement).toBe(button1);
  });

  it('does not focus anything when not open', () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, false));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.activeElement).toBe(outsideButton);
    document.body.removeChild(outsideButton);
  });

  it('wraps focus from last to first on Tab', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Focus the last button
    button3.focus();
    expect(document.activeElement).toBe(button3);

    // Press Tab on the last element
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true
    });
    act(() => {
      document.dispatchEvent(tabEvent);
    });

    expect(document.activeElement).toBe(button1);
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Focus should be on first button
    expect(document.activeElement).toBe(button1);

    // Press Shift+Tab on the first element
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    act(() => {
      document.dispatchEvent(shiftTabEvent);
    });

    expect(document.activeElement).toBe(button3);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true, { onClose }));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });
    act(() => {
      document.dispatchEvent(escapeEvent);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to previously focused element on close', () => {
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    const ref = { current: container };
    const { rerender } = renderHook(
      ({ isOpen }) => useFocusTrap(ref, isOpen),
      { initialProps: { isOpen: true } }
    );

    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Focus should have moved into the trap
    expect(document.activeElement).toBe(button1);

    // Close the trap
    rerender({ isOpen: false });

    // Focus should be restored to the outside button
    expect(document.activeElement).toBe(outsideButton);

    document.body.removeChild(outsideButton);
  });

  it('does not respond to Escape after unmount', () => {
    const onClose = vi.fn();
    const ref = { current: container };
    const { unmount } = renderHook(() => useFocusTrap(ref, true, { onClose }));

    unmount();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prevents Tab from leaving a container with no focusable elements', () => {
    const emptyContainer = document.createElement('div');
    emptyContainer.textContent = 'No buttons here';
    document.body.appendChild(emptyContainer);

    const ref = { current: emptyContainer };

    renderHook(() => useFocusTrap(ref, true));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Tab should be prevented (no elements to cycle through)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true
    });

    act(() => {
      document.dispatchEvent(tabEvent);
    });
    expect(tabEvent.defaultPrevented).toBe(true);

    document.body.removeChild(emptyContainer);
  });

  it('skips disabled buttons when trapping focus', () => {
    const disabledBtn = document.createElement('button');
    disabledBtn.disabled = true;
    disabledBtn.textContent = 'Disabled';
    container.insertBefore(disabledBtn, button1);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    act(() => {
      vi.runOnlyPendingTimers();
    });

    // First focusable should be button1 (not the disabled one)
    expect(document.activeElement).toBe(button1);
  });
});
