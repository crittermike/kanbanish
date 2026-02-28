import { ref, onValue } from 'firebase/database';
import { useEffect, useState } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook that monitors Firebase Realtime Database connection state.
 *
 * Uses the special `.info/connected` path that Firebase provides.
 * Returns `true` when connected, `false` when disconnected.
 * Starts as `true` to avoid a flash of the offline indicator on mount.
 *
 * @returns {{ isOnline: boolean }}
 */
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
};
