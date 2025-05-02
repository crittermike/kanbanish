// Firebase configuration for the Kanban app
import { initializeApp } from 'firebase/app';
import { getDatabase, get } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Using the same Firebase configuration from the original app
  apiKey: "AIzaSyBIAM_tIBqFUYQl5r-f7e78lNPzc0fIDcM",
  authDomain: "big-orca.firebaseapp.com",
  projectId: "big-orca",
  storageBucket: "big-orca.firebasestorage.app",
  messagingSenderId: "338206440353",
  appId: "1:338206440353:web:a6af4374836968379d29e0",
  databaseURL: "https://big-orca-default-rtdb.firebaseio.com" // Added databaseURL based on project
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Export for use in other files
export { database, auth, signInAnonymously, get };
export default app;
