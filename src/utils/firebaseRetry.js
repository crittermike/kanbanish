/**
 * Retry utility for transient Firebase write failures.
 *
 * Wraps a Firebase operation (set/remove) with exponential backoff retry logic.
 * Only retries on transient errors (network, unavailable); permission and
 * validation errors fail immediately.
 */

const TRANSIENT_ERROR_CODES = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'UNAVAILABLE',
  'network-request-failed',
]);

/**
 * Returns true when the error looks transient (worth retrying).
 * @param {Error} error
 * @returns {boolean}
 */
function isTransientError(error) {
  if (!error) return false;

  const code = error.code || '';
  if (TRANSIENT_ERROR_CODES.has(code)) return true;

  const message = (error.message || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('unavailable') ||
    message.includes('failed to fetch') ||
    message.includes('client is offline')
  );
}

/**
 * Execute a Firebase operation with automatic retry on transient failures.
 *
 * @param {() => Promise} operation - The Firebase write to perform (e.g., () => set(ref, data))
 * @param {Object} [options]
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.baseDelay=500] - Base delay in ms (doubled each retry)
 * @param {string} [options.operationName='Firebase operation'] - For logging
 * @returns {Promise} Resolves when the operation succeeds, rejects after all retries exhausted
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 500,
    operationName = 'Firebase operation',
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry non-transient errors (permission denied, invalid data, etc.)
      if (!isTransientError(error)) {
        throw error;
      }

      // If we've exhausted retries, throw
      if (attempt >= maxRetries) {
        console.error(
          `${operationName} failed after ${maxRetries + 1} attempts:`,
          error
        );
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export { isTransientError };
