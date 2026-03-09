import { ref, set, remove } from 'firebase/database';
import { useCallback, useEffect, useState } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for per-card timer functionality (countdown timer synced via Firebase).
 *
 * Provides start, pause, resume, reset operations scoped to a single card.
 * Timer state is stored in Firebase at
 *   boards/{boardId}/columns/{columnId}/cards/{cardId}/timer
 * and is read by the main onValue listener in BoardContext (automatically
 * available in columns[columnId].cards[cardId].timer).
 *
 * Unlike the global/column timers, card timers do NOT enforce mutual exclusion —
 * multiple card timers can run simultaneously.
 *
 * @param {Object} params
 * @param {string|null} params.boardId   - Current board ID
 * @param {string|null} params.columnId  - Column containing the card
 * @param {string|null} params.cardId    - Card ID
 * @param {Object|null} params.timerData - Current timer state from Firebase (cardData.timer)
 * @param {Object|null} params.user      - Current Firebase user
 * @returns {Object} Card timer operations and live remaining seconds
 */
export const useCardTimer = ({ boardId, columnId, cardId, timerData, user }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  // Derive the Firebase ref path for this card's timer
  const getTimerRef = useCallback(() => {
    if (!boardId || !columnId || !cardId) return null;
    return ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/timer`);
  }, [boardId, columnId, cardId]);

  // Live countdown tick
  useEffect(() => {
    if (!timerData) {
      setRemainingSeconds(null);
      return;
    }

    if (!timerData.isRunning) {
      // Paused — show paused remaining
      setRemainingSeconds(
        timerData.pausedRemaining != null
          ? Math.max(0, Math.round(timerData.pausedRemaining))
          : null
      );
      return;
    }

    // Running — tick every second
    const tick = () => {
      const elapsed = (Date.now() - timerData.startedAt) / 1000;
      const remaining = Math.max(0, timerData.duration - elapsed);
      setRemainingSeconds(Math.round(remaining));
    };

    tick(); // immediate
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerData]);

  const startCardTimer = useCallback((duration) => {
    if (!user) return;
    const timerRef = getTimerRef();
    if (!timerRef) return;

    const timerObj = {
      duration,
      originalDuration: duration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, timerObj).catch(error => {
      console.error('Error starting card timer:', error);
    });
  }, [user, getTimerRef]);

  const pauseCardTimer = useCallback(() => {
    if (!user || !timerData) return;
    const timerRef = getTimerRef();
    if (!timerRef) return;

    const elapsed = (Date.now() - timerData.startedAt) / 1000;
    const remaining = Math.max(0, timerData.duration - elapsed);
    const updatedTimer = {
      ...timerData,
      isRunning: false,
      pausedRemaining: remaining,
      startedAt: null
    };
    set(timerRef, updatedTimer).catch(error => {
      console.error('Error pausing card timer:', error);
    });
  }, [user, timerData, getTimerRef]);

  const resumeCardTimer = useCallback(() => {
    if (!user || !timerData || !timerData.pausedRemaining) return;
    const timerRef = getTimerRef();
    if (!timerRef) return;

    const updatedTimer = {
      ...timerData,
      duration: timerData.pausedRemaining,
      originalDuration: timerData.originalDuration || timerData.duration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, updatedTimer).catch(error => {
      console.error('Error resuming card timer:', error);
    });
  }, [user, timerData, getTimerRef]);

  const resetCardTimer = useCallback(() => {
    if (!user) return;
    const timerRef = getTimerRef();
    if (!timerRef) return;

    remove(timerRef).catch(error => {
      console.error('Error resetting card timer:', error);
    });
  }, [user, getTimerRef]);

  const restartCardTimer = useCallback(() => {
    if (!user || !timerData) return;
    const timerRef = getTimerRef();
    if (!timerRef) return;

    const originalDuration = timerData.originalDuration || timerData.duration;
    const timerObj = {
      duration: originalDuration,
      originalDuration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, timerObj).catch(error => {
      console.error('Error restarting card timer:', error);
    });
  }, [user, timerData, getTimerRef]);

  const isRunning = timerData?.isRunning ?? false;
  const isPaused = timerData != null && !timerData.isRunning && timerData.pausedRemaining != null;
  const hasTimer = timerData != null;

  return {
    startCardTimer,
    pauseCardTimer,
    resumeCardTimer,
    resetCardTimer,
    restartCardTimer,
    remainingSeconds,
    isRunning,
    isPaused,
    hasTimer
  };
};
