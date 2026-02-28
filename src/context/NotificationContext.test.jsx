import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { NotificationProvider, useNotification } from './NotificationContext';

const wrapper = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initial state: notification.message is empty, show is false, actionLabel and onAction are null', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    expect(result.current.notification.message).toBe('');
    expect(result.current.notification.show).toBe(false);
    expect(result.current.notification.actionLabel).toBe(null);
    expect(result.current.notification.onAction).toBe(null);
  });

  test('showNotification(message) sets message and show=true', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('Hello World');
    });

    expect(result.current.notification.message).toBe('Hello World');
    expect(result.current.notification.show).toBe(true);
  });

  test('showNotification auto-dismisses after default 3000ms timeout', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('Temporary notification');
    });

    expect(result.current.notification.show).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notification.show).toBe(false);
    expect(result.current.notification.message).toBe('');
  });

  test('showNotification with custom timeoutMs uses that timeout instead', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('Custom timeout', { timeoutMs: 5000 });
    });

    expect(result.current.notification.show).toBe(true);

    // Advance 3 seconds — should still be visible
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notification.show).toBe(true);

    // Advance 2 more seconds (total 5s)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.notification.show).toBe(false);
  });

  test('showNotification with actionLabel sets notification.actionLabel', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('Action required', { actionLabel: 'Undo' });
    });

    expect(result.current.notification.actionLabel).toBe('Undo');
  });

  test('showNotification with onAction sets notification.onAction', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    const callback = vi.fn();

    act(() => {
      result.current.showNotification('Action message', { onAction: callback });
    });

    expect(result.current.notification.onAction).toBe(callback);
  });

  test('handleAction calls the onAction callback and dismisses the notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    const callback = vi.fn();

    act(() => {
      result.current.showNotification('Call action', { onAction: callback });
    });

    expect(result.current.notification.show).toBe(true);

    act(() => {
      result.current.handleAction();
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(result.current.notification.show).toBe(false);
    expect(result.current.notification.message).toBe('');
  });

  test('handleAction dismisses even when onAction is null', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('No action callback');
    });

    expect(result.current.notification.show).toBe(true);

    act(() => {
      result.current.handleAction();
    });

    expect(result.current.notification.show).toBe(false);
    expect(result.current.notification.message).toBe('');
  });

  test('dismissNotification clears the notification immediately', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('To be dismissed');
    });

    expect(result.current.notification.show).toBe(true);

    act(() => {
      result.current.dismissNotification();
    });

    expect(result.current.notification.show).toBe(false);
    expect(result.current.notification.message).toBe('');
    expect(result.current.notification.actionLabel).toBe(null);
    expect(result.current.notification.onAction).toBe(null);
  });

  test('calling showNotification twice replaces the first notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('First message');
    });

    expect(result.current.notification.message).toBe('First message');

    act(() => {
      result.current.showNotification('Second message');
    });

    expect(result.current.notification.message).toBe('Second message');
  });

  test('second showNotification resets the timeout (first timeout does not dismiss second notification early)', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showNotification('First notification');
    });

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Show second notification — should reset timer
    act(() => {
      result.current.showNotification('Second notification');
    });

    expect(result.current.notification.message).toBe('Second notification');

    // Advance 2 more seconds (4s from first, 2s from second)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be visible because second notification's timer (3s) hasn't fully elapsed
    expect(result.current.notification.show).toBe(true);

    // Advance 1 more second (total 3s from second)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now it should be dismissed
    expect(result.current.notification.show).toBe(false);
  });

  test('handleAction uses ref (not stale closure) — calling with latest onAction', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    // Show notification with first callback
    act(() => {
      result.current.showNotification('First', { onAction: firstCallback });
    });

    // Show another notification with different callback
    act(() => {
      result.current.showNotification('Second', { onAction: secondCallback });
    });

    // handleAction should call the SECOND callback (latest)
    act(() => {
      result.current.handleAction();
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
    expect(result.current.notification.show).toBe(false);
  });

  test('useNotification outside provider throws an error', () => {
    // Suppress console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useNotification());
    }).toThrow('useNotification must be used within a NotificationProvider');

    consoleSpy.mockRestore();
  });

  test('notification with both actionLabel and onAction provides full action button capability', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    const actionCallback = vi.fn();

    act(() => {
      result.current.showNotification('Action available', {
        actionLabel: 'Undo',
        onAction: actionCallback
      });
    });

    expect(result.current.notification.message).toBe('Action available');
    expect(result.current.notification.actionLabel).toBe('Undo');
    expect(result.current.notification.onAction).toBe(actionCallback);

    act(() => {
      result.current.handleAction();
    });

    expect(actionCallback).toHaveBeenCalledOnce();
    expect(result.current.notification.show).toBe(false);
  });

  test('dismissNotification clears timeout and resets ref', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    const callback = vi.fn();

    act(() => {
      result.current.showNotification('Message', { onAction: callback });
    });

    act(() => {
      result.current.dismissNotification();
    });

    // Advance time past the normal 3s timeout
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Callback should not be called (timeout was cleared)
    expect(callback).not.toHaveBeenCalled();

    // handleAction should also not call the callback (ref was reset)
    act(() => {
      result.current.handleAction();
    });

    expect(callback).not.toHaveBeenCalled();
  });

  test('cleanup on unmount clears the timeout', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { result, unmount } = renderHook(() => useNotification(), { wrapper });

    // Show a notification to set a timeout
    act(() => {
      result.current.showNotification('Timeout will be cleaned');
    });

    const callCountBefore = clearTimeoutSpy.mock.calls.length;

    // Unmount should trigger cleanup
    unmount();

    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callCountBefore);

    clearTimeoutSpy.mockRestore();
  });
});
