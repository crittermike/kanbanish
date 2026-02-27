import { ref, onValue, off, set, remove } from 'firebase/database';
import { useState, useEffect, useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for user presence tracking and card creation activity.
 *
 * Manages:
 * - Active user count via Firebase presence heartbeats
 * - Card creation activity indicators (who's typing where)
 * - Cleanup on unmount and page unload
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @returns {Object} Presence state and card creation tracking functions
 */
export const usePresence = ({ boardId, user }) => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [usersAddingCards, setUsersAddingCards] = useState({});

  // Track user presence on the board
  useEffect(() => {
    if (boardId && user) {
      const presenceRef = ref(database, `boards/${boardId}/presence/${user.uid}`);
      const presenceCountRef = ref(database, `boards/${boardId}/presence`);

      // Set this user as active
      set(presenceRef, {
        lastSeen: Date.now(),
        uid: user.uid
      });

      // Listen to all active users
      const handlePresenceChange = snapshot => {
        if (snapshot.exists()) {
          const presenceData = snapshot.val();
          const now = Date.now();
          const activeThreshold = 30000; // Consider users active if seen within last 30 seconds

          // Count users who were active recently
          const activeUserCount = Object.values(presenceData).filter(userData =>
            userData.lastSeen && (now - userData.lastSeen < activeThreshold)
          ).length;

          setActiveUsers(activeUserCount);
        } else {
          setActiveUsers(0);
        }
      };

      onValue(presenceCountRef, handlePresenceChange);

      // Update presence every 10 seconds while user is active
      const presenceInterval = setInterval(() => {
        set(presenceRef, {
          lastSeen: Date.now(),
          uid: user.uid
        });
      }, 10000);

      // Clean up when user leaves
      return () => {
        off(presenceCountRef, handlePresenceChange);
        clearInterval(presenceInterval);
        // Remove user from presence when they leave
        remove(presenceRef);
        // Also remove any card creation activity
        if (user?.uid) {
          const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
          remove(cardCreationRef);
        }
      };
    }
  }, [boardId, user]);

  // Track users adding cards
  useEffect(() => {
    if (boardId && user) {
      const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity`);

      // Listen for changes to card creation activity
      const handleCardCreationChange = snapshot => {
        if (snapshot.exists()) {
          const activityData = snapshot.val();
          // Show all active card creation activity without time-based filtering
          setUsersAddingCards(activityData);
        } else {
          setUsersAddingCards({});
        }
      };

      onValue(cardCreationRef, handleCardCreationChange);

      return () => {
        off(cardCreationRef, handleCardCreationChange);
      };
    }
  }, [boardId, user]);

  // Cleanup card creation activity on page unload
  useEffect(() => {
    if (boardId && user) {
      const handleBeforeUnload = () => {
        // Remove card creation activity when user leaves the page
        const cardCreationRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
        remove(cardCreationRef);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [boardId, user]);

  // Start tracking card creation activity for current user
  const startCardCreation = useCallback((columnId) => {
    if (!boardId || !user) {
      return;
    }

    const activityRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
    set(activityRef, {
      columnId,
      lastUpdated: Date.now(),
      uid: user.uid
    }).catch(error => {
      console.error('Error starting card creation tracking:', error);
    });
  }, [boardId, user]);

  // Stop tracking card creation activity for current user
  const stopCardCreation = useCallback(() => {
    if (!boardId || !user) {
      return;
    }

    const activityRef = ref(database, `boards/${boardId}/cardCreationActivity/${user.uid}`);
    remove(activityRef).catch(error => {
      console.error('Error stopping card creation tracking:', error);
    });
  }, [boardId, user]);

  // Get users currently adding cards for a specific column
  const getUsersAddingCardsInColumn = useCallback((columnId) => {
    return Object.entries(usersAddingCards)
      .filter(([_userId, activity]) => activity.columnId === columnId)
      .map(([userId, activity]) => ({ userId, ...activity }));
  }, [usersAddingCards]);

  // Get all users currently adding cards (across all columns)
  const getAllUsersAddingCards = useCallback(() => {
    return Object.entries(usersAddingCards)
      .map(([userId, activity]) => ({ userId, ...activity }));
  }, [usersAddingCards]);

  return {
    activeUsers,
    usersAddingCards,
    startCardCreation,
    stopCardCreation,
    getUsersAddingCardsInColumn,
    getAllUsersAddingCards
  };
};
