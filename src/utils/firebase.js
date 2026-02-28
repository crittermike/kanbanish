// Firebase configuration for the Kanban app
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, get, ref } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBIAM_tIBqFUYQl5r-f7e78lNPzc0fIDcM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'big-orca.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'big-orca',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'big-orca.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '338206440353',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:338206440353:web:a6af4374836968379d29e0',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://big-orca-default-rtdb.firebaseio.com'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Export for use in other files
export { database, auth, signInAnonymously, get, ref };
export default app;
