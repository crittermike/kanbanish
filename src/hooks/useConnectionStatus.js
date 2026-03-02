import { ref, onValue } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook that monitors Firebase Realtime Database connection state.
 *
 * Uses the special `.info/connected` path that Firebase provides.
 * Returns `true` when connected, `false` when disconnected.
 * Starts as `true` and ignores the initial `false` from Firebase's
 * `.info/connected` handshake to avoid flashing the offline banner on load.
 *
 * @returns {{ isOnline: boolean }}
 */
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const hasConnected = useRef(false);

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;

      if (connected) {
        hasConnected.current = true;
        setIsOnline(true);
      } else if (hasConnected.current) {
        // Only show offline after we've confirmed a real connection first,
        // so the initial false→true handshake doesn't flash the banner
        setIsOnline(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
};
