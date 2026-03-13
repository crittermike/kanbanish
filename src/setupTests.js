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

// Global mock for firebase SDK — hooks import ref/set/remove directly from here
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ val: () => null, exists: () => false })),
  onValue: vi.fn(() => () => {}),
  off: vi.fn()
}));
