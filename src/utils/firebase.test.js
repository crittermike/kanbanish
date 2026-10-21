import { initializeApp } from 'firebase/app';
import { connectAuthEmulator } from 'firebase/auth';
import { connectDatabaseEmulator } from 'firebase/database';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.unmock('./firebase');
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ type: 'auth' })),
  signInAnonymously: vi.fn(),
  connectAuthEmulator: vi.fn()
}));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({ type: 'database' })),
  get: vi.fn(),
  ref: vi.fn(),
  connectDatabaseEmulator: vi.fn()
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('MODE', 'production');
  vi.stubEnv('VITE_FIREBASE_EMULATORS', '');
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'demo-kanbanish.firebaseapp.com');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'demo-kanbanish');
  vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app');
  vi.stubEnv('VITE_FIREBASE_DATABASE_URL', 'http://127.0.0.1:9000?ns=demo-kanbanish-default-rtdb');
});

afterEach(() => vi.unstubAllEnvs());

test('normal builds never connect to emulators', async () => {
  await import('./firebase');
  expect(initializeApp).toHaveBeenCalledOnce();
  expect(connectDatabaseEmulator).not.toHaveBeenCalled();
  expect(connectAuthEmulator).not.toHaveBeenCalled();
});

test('e2e connects both services before consumers can use them', async () => {
  vi.stubEnv('MODE', 'e2e');
  vi.stubEnv('VITE_FIREBASE_EMULATORS', 'true');
  const { database, auth } = await import('./firebase');
  expect(connectDatabaseEmulator).toHaveBeenCalledExactlyOnceWith(database, '127.0.0.1', 9000);
  expect(connectAuthEmulator).toHaveBeenCalledExactlyOnceWith(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
});

test.each([
  ['MODE', 'production'],
  ['VITE_FIREBASE_PROJECT_ID', 'live-project'],
  ['VITE_FIREBASE_DATABASE_URL', 'https://live-project.firebaseio.com']
])('rejects unsafe emulator config: %s', async (key, value) => {
  vi.stubEnv('MODE', 'e2e');
  vi.stubEnv('VITE_FIREBASE_EMULATORS', 'true');
  vi.stubEnv(key, value);
  await expect(import('./firebase')).rejects.toThrow('Firebase emulators require e2e mode');
  expect(initializeApp).not.toHaveBeenCalled();
});

test('missing config fails before connecting to Firebase', async () => {
  vi.stubEnv('VITE_FIREBASE_API_KEY', '');
  await expect(import('./firebase')).rejects.toThrow('Missing required Firebase environment variables');
  expect(initializeApp).not.toHaveBeenCalled();
});
