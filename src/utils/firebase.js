// Firebase configuration for the Kanban app
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, get, ref, connectDatabaseEmulator } from 'firebase/database';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL'
];

const missing = requiredEnvVars.filter(key => !import.meta.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
    'Copy .env.example to .env and fill in your Firebase project values.'
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true';
if (useEmulators && (
  import.meta.env.MODE !== 'e2e' ||
  firebaseConfig.projectId !== 'demo-kanbanish' ||
  firebaseConfig.databaseURL !== 'http://127.0.0.1:9000?ns=demo-kanbanish-default-rtdb'
)) {
  throw new Error('Firebase emulators require e2e mode and the local demo-kanbanish project.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

if (useEmulators) {
  connectDatabaseEmulator(database, '127.0.0.1', 9000);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// Export for use in other files
export { database, auth, signInAnonymously, get, ref };
export default app;
