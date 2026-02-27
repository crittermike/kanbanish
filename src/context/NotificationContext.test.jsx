import { render, screen, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationProvider, useNotification } from './NotificationContext';

// Test component that exposes notification state and actions
function TestConsumer() {
  const { notification, showNotification } = useNotification();
  return (
    <div>
      <span data-testid="message">{notification.message}</span>
      <span data-testid="show">{notification.show ? 'visible' : 'hidden'}</span>
      <button onClick={() => showNotification('Test notification')}>Show</button>
      <button onClick={() => showNotification('Another notification')}>ShowAnother</button>
    </div>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('provides default notification state', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    expect(screen.getByTestId('message')).toHaveTextContent('');
    expect(screen.getByTestId('show')).toHaveTextContent('hidden');
  });

  test('showNotification updates state with message', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    expect(screen.getByTestId('message')).toHaveTextContent('Test notification');
    expect(screen.getByTestId('show')).toHaveTextContent('visible');
  });

  test('notification auto-hides after 3 seconds', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    expect(screen.getByTestId('show')).toHaveTextContent('visible');

    // Advance time by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('show')).toHaveTextContent('hidden');
    expect(screen.getByTestId('message')).toHaveTextContent('');
  });

  test('notification does not hide before 3 seconds', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    // Advance time by 2.9 seconds - should still be visible
    act(() => {
      vi.advanceTimersByTime(2900);
    });

    expect(screen.getByTestId('show')).toHaveTextContent('visible');
  });

  test('showing a new notification resets the timer', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    // Show first notification
    act(() => {
      screen.getByText('Show').click();
    });

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Show another notification — this should reset the 3s timer
    act(() => {
      screen.getByText('ShowAnother').click();
    });

    expect(screen.getByTestId('message')).toHaveTextContent('Another notification');

    // Advance 2 more seconds (4s total from first, 2s from second)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be visible because the second notification's timer hasn't expired
    expect(screen.getByTestId('show')).toHaveTextContent('visible');

    // Advance 1 more second (3s from second notification)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now it should be hidden
    expect(screen.getByTestId('show')).toHaveTextContent('hidden');
  });

  test('throws error when useNotification is used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useNotification must be used within a NotificationProvider');

    consoleSpy.mockRestore();
  });

  test('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    // Show a notification to create a timeout
    act(() => {
      screen.getByText('Show').click();
    });

    // Unmount should clean up the timeout
    unmount();

    // clearTimeout should have been called during cleanup
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(0);

    clearTimeoutSpy.mockRestore();
  });
});
