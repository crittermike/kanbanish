// Firebase configuration for the Kanban app
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, get, ref } from 'firebase/database';

const isTest = import.meta.env.MODE === 'test' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

let app, database, auth;

if (isTest) {
  // In test mode, export stubs. Tests that need firebase should mock this module.
  app = null;
  database = {};
  auth = { onAuthStateChanged: () => () => {} };
} else {
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

  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
}

// Export for use in other files
export { database, auth, signInAnonymously, get, ref };
export default app;
