import { renderHook, act } from '@testing-library/react';
import { ref, onValue } from 'firebase/database';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useConnectionStatus } from './useConnectionStatus';

// Mock Firebase modules
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn()
}));

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with isOnline = true (default state)', () => {
    const unsubscribeMock = vi.fn();
    onValue.mockImplementation(() => unsubscribeMock);

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.isOnline).toBe(true);
  });

  it('subscribes to .info/connected ref on mount', () => {
    const unsubscribeMock = vi.fn();
    onValue.mockImplementation(() => unsubscribeMock);

    renderHook(() => useConnectionStatus());

    // Verify ref was called with '.info/connected'
    expect(ref).toHaveBeenCalledWith(expect.any(Object), '.info/connected');

    // Verify onValue was called with the ref result
    expect(onValue).toHaveBeenCalledWith(
      ref.mock.results[0].value,
      expect.any(Function)
    );
  });

  it('sets isOnline to true when snapshot.val() returns true', () => {
    const unsubscribeMock = vi.fn();
    let capturedCallback;

    onValue.mockImplementation((refArg, callback) => {
      capturedCallback = callback;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useConnectionStatus());

    // Simulate Firebase snapshot with true value
    act(() => {
      capturedCallback({ val: () => true });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('ignores initial false from Firebase handshake (prevents flash)', () => {
    const unsubscribeMock = vi.fn();
    let capturedCallback;

    onValue.mockImplementation((refArg, callback) => {
      capturedCallback = callback;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useConnectionStatus());

    // Firebase fires false before connection is established
    act(() => {
      capturedCallback({ val: () => false });
    });

    // Should still be true — initial false is ignored to prevent flash
    expect(result.current.isOnline).toBe(true);
  });

  it('sets isOnline to false after a prior connection was established', () => {
    const unsubscribeMock = vi.fn();
    let capturedCallback;

    onValue.mockImplementation((refArg, callback) => {
      capturedCallback = callback;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useConnectionStatus());

    // First connect
    act(() => {
      capturedCallback({ val: () => true });
    });
    expect(result.current.isOnline).toBe(true);

    // Then disconnect
    act(() => {
      capturedCallback({ val: () => false });
    });
    expect(result.current.isOnline).toBe(false);
  });

  it('transitions from online to offline and back', () => {
    const unsubscribeMock = vi.fn();
    let capturedCallback;

    onValue.mockImplementation((refArg, callback) => {
      capturedCallback = callback;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useConnectionStatus());

    // Start online (default)
    expect(result.current.isOnline).toBe(true);

    // Establish real connection
    act(() => {
      capturedCallback({ val: () => true });
    });
    expect(result.current.isOnline).toBe(true);

    // Go offline
    act(() => {
      capturedCallback({ val: () => false });
    });
    expect(result.current.isOnline).toBe(false);

    // Go back online
    act(() => {
      capturedCallback({ val: () => true });
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('cleans up the onValue listener on unmount', () => {
    const unsubscribeMock = vi.fn();

    onValue.mockImplementation(() => unsubscribeMock);

    const { unmount } = renderHook(() => useConnectionStatus());

    // Verify unsubscribe was not called yet
    expect(unsubscribeMock).not.toHaveBeenCalled();

    // Unmount the hook
    unmount();

    // Verify unsubscribe was called during cleanup
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('does not re-subscribe on re-render (empty dependency array)', () => {
    const unsubscribeMock = vi.fn();

    onValue.mockImplementation(() => unsubscribeMock);

    const { rerender } = renderHook(() => useConnectionStatus());

    // Clear mocks after initial render
    vi.clearAllMocks();

    // Re-render the hook
    rerender();

    // Verify onValue was not called again (no re-subscription)
    expect(onValue).not.toHaveBeenCalled();
  });

  it('handles multiple rapid connection state changes', () => {
    const unsubscribeMock = vi.fn();
    let capturedCallback;

    onValue.mockImplementation((refArg, callback) => {
      capturedCallback = callback;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useConnectionStatus());

    // Initial false is ignored
    act(() => {
      capturedCallback({ val: () => false });
    });
    expect(result.current.isOnline).toBe(true);

    // First true establishes connection
    act(() => {
      capturedCallback({ val: () => true });
    });
    expect(result.current.isOnline).toBe(true);

    // Now false is honored
    act(() => {
      capturedCallback({ val: () => false });
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      capturedCallback({ val: () => true });
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('returns an object with isOnline property', () => {
    const unsubscribeMock = vi.fn();
    onValue.mockImplementation(() => unsubscribeMock);

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current).toHaveProperty('isOnline');
    expect(typeof result.current.isOnline).toBe('boolean');
  });
});
