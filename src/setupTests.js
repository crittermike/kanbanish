// @testing-library/jest-dom adds custom DOM element matchers for assertions
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// These utilities work with Vitest just as they did with Jest
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mock for firebase utilities — individual tests can override with vi.mock
vi.mock('./utils/firebase', () => {
  return {
    database: {},
    auth: { onAuthStateChanged: vi.fn(() => () => {}) },
    signInAnonymously: vi.fn(),
    get: vi.fn(),
    ref: vi.fn(),
    default: null
  };
});
