// @testing-library/jest-dom adds custom DOM element matchers for assertions
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// These utilities work with Vitest just as they did with Jest
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom in this environment does not provide Web Storage, so provide a
// functional in-memory polyfill for code that reads/writes localStorage.
if (typeof window !== 'undefined' && !window.localStorage) {
  const createStorage = () => {
    const store = new Map();
    return {
      getItem: key => (store.has(String(key)) ? store.get(String(key)) : null),
      setItem: (key, value) => { store.set(String(key), String(value)); },
      removeItem: key => { store.delete(String(key)); },
      clear: () => { store.clear(); },
      key: index => Array.from(store.keys())[index] ?? null,
      get length() { return store.size; }
    };
  };
  Object.defineProperty(window, 'localStorage', { value: createStorage(), configurable: true, writable: true });
  Object.defineProperty(window, 'sessionStorage', { value: createStorage(), configurable: true, writable: true });
}

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
