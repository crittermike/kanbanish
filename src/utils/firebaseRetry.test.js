import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, isTransientError } from './firebaseRetry';

describe('isTransientError', () => {
  it('returns false for null/undefined', () => {
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
  });

  it('returns true for known transient error codes', () => {
    expect(isTransientError({ code: 'NETWORK_ERROR' })).toBe(true);
    expect(isTransientError({ code: 'TIMEOUT' })).toBe(true);
    expect(isTransientError({ code: 'UNAVAILABLE' })).toBe(true);
    expect(isTransientError({ code: 'network-request-failed' })).toBe(true);
  });

  it('returns true for transient error messages', () => {
    expect(isTransientError({ message: 'Network error occurred' })).toBe(true);
    expect(isTransientError({ message: 'Request timeout' })).toBe(true);
    expect(isTransientError({ message: 'Service unavailable' })).toBe(true);
    expect(isTransientError({ message: 'Failed to fetch' })).toBe(true);
    expect(isTransientError({ message: 'Client is offline' })).toBe(true);
  });

  it('returns false for non-transient errors', () => {
    expect(isTransientError({ code: 'PERMISSION_DENIED' })).toBe(false);
    expect(isTransientError({ message: 'Permission denied' })).toBe(false);
    expect(isTransientError({ code: 'INVALID_ARGUMENT' })).toBe(false);
    expect(isTransientError(new Error('Something else'))).toBe(false);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Helper to advance through retries (setTimeout + jitter)
  async function flushRetries() {
    // Each retry uses setTimeout; advance generously to cover backoff + jitter
    await vi.advanceTimersByTimeAsync(10000);
  }

  it('resolves on first attempt when operation succeeds', async () => {
    const op = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(op);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error and resolves when subsequent attempt succeeds', async () => {
    const transientError = new Error('Network error');
    const op = vi.fn()
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(op, { baseDelay: 100 });

    // First attempt fails immediately, wait for retry delay
    await flushRetries();

    const result = await promise;
    expect(result).toBe('recovered');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-transient error without retrying', async () => {
    const permError = { code: 'PERMISSION_DENIED', message: 'Denied' };
    const op = vi.fn().mockRejectedValue(permError);

    await expect(withRetry(op)).rejects.toEqual(permError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('exhausts all retries and throws after maxRetries transient failures', async () => {
    const transientError = new Error('Client is offline');
    const op = vi.fn().mockRejectedValue(transientError);

    const promise = withRetry(op, { maxRetries: 2, baseDelay: 50 }).catch(e => e);

    // Flush through all retry delays
    await flushRetries();

    const result = await promise;
    expect(result).toBe(transientError);
    // 1 initial + 2 retries = 3
    expect(op).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalled();
  });

  it('respects custom maxRetries option', async () => {
    const transientError = new Error('Network error');
    const op = vi.fn().mockRejectedValue(transientError);

    const promise = withRetry(op, { maxRetries: 1, baseDelay: 50 }).catch(e => e);
    await flushRetries();

    const result = await promise;
    expect(result).toBe(transientError);
    expect(op).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('logs operationName on final failure', async () => {
    const transientError = new Error('Unavailable');
    const op = vi.fn().mockRejectedValue(transientError);

    const promise = withRetry(op, { maxRetries: 0, operationName: 'Test op' }).catch(e => e);
    await flushRetries();

    const result = await promise;
    expect(result).toBe(transientError);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Test op'),
      transientError
    );
  });
});
