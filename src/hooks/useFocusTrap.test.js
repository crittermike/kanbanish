import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container;
  let button1;
  let button2;
  let button3;

  beforeEach(() => {
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
    document.body.removeChild(container);
  });

  it('focuses the first focusable element when opened', async () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    // setTimeout(0) in the hook — flush it
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    expect(document.activeElement).toBe(button1);
  });

  it('does not focus anything when not open', async () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, false));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    expect(document.activeElement).toBe(outsideButton);
    document.body.removeChild(outsideButton);
  });

  it('wraps focus from last to first on Tab', async () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
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

  it('wraps focus from first to last on Shift+Tab', async () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
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

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true, { onClose }));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
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

  it('does not call onClose on Escape when onClose is not provided', async () => {
    const ref = { current: container };

    // Should not throw
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });

    expect(() => {
      act(() => {
        document.dispatchEvent(escapeEvent);
      });
    }).not.toThrow();
  });

  it('restores focus to previously focused element on close', async () => {
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

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Focus should have moved into the trap
    expect(document.activeElement).toBe(button1);

    // Close the trap
    rerender({ isOpen: false });

    // Focus should be restored to the outside button
    expect(document.activeElement).toBe(outsideButton);

    document.body.removeChild(outsideButton);
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const ref = { current: container };
    const { unmount } = renderHook(() => useFocusTrap(ref, true));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('handles container with no focusable elements', async () => {
    const emptyContainer = document.createElement('div');
    emptyContainer.textContent = 'No buttons here';
    document.body.appendChild(emptyContainer);

    const ref = { current: emptyContainer };

    // Should not throw
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Tab should be prevented (no elements to cycle through)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true
    });

    expect(() => {
      act(() => {
        document.dispatchEvent(tabEvent);
      });
    }).not.toThrow();

    document.body.removeChild(emptyContainer);
  });

  it('handles null container ref gracefully', async () => {
    const ref = { current: null };

    // Should not throw
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });
  });

  it('skips disabled buttons when trapping focus', async () => {
    const disabledBtn = document.createElement('button');
    disabledBtn.disabled = true;
    disabledBtn.textContent = 'Disabled';
    container.insertBefore(disabledBtn, button1);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // First focusable should be button1 (not the disabled one)
    expect(document.activeElement).toBe(button1);
  });
});
