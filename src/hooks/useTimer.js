import { ref, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for timer functionality (countdown timer synced via Firebase).
 *
 * Provides start, pause, resume, reset, and restart operations.
 * Timer state is stored in Firebase at boards/{boardId}/timer and
 * read by the main onValue listener in BoardContext.
 *
 * When a global timer is started/resumed/restarted, all column timers
 * are cleared to enforce mutual exclusion across all timers.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object|null} params.timerData - Current timer state from Firebase
 * @param {Function} params.setTimerData - Setter for timer state
 * @param {string|null} params.workflowPhase - Current workflow phase (tags timer)
 * @param {Object} params.columns - Current columns data (for clearing column timers)
 * @returns {Object} Timer operations
 */
export const useTimer = ({ boardId, user, timerData, setTimerData, workflowPhase, columns }) => {
  // Clear all column timers (mutual exclusion)
  const clearAllColumnTimers = useCallback(() => {
    if (!boardId || !columns) return;
    Object.keys(columns).forEach((colId) => {
      if (columns[colId]?.timer) {
        const timerRef = ref(database, `boards/${boardId}/columns/${colId}/timer`);
        remove(timerRef).catch(() => {});
      }
    });
  }, [boardId, columns]);

  const startTimer = useCallback((duration) => {
    if (!boardId || !user) return;
    clearAllColumnTimers();
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const timerObj = {
      duration, // total seconds
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .then(() => {
        setTimerData(timerObj);
      })
      .catch(error => {
        console.error('Error starting timer:', error);
      });
  }, [boardId, user, setTimerData, workflowPhase, clearAllColumnTimers]);

  const pauseTimer = useCallback(() => {
    if (!boardId || !user || !timerData) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const elapsed = (Date.now() - timerData.startedAt) / 1000;
    const remaining = Math.max(0, timerData.duration - elapsed);
    const updatedTimer = {
      ...timerData,
      isRunning: false,
      pausedRemaining: remaining,
      startedAt: null
    };
    set(timerRef, updatedTimer)
      .then(() => {
        setTimerData(updatedTimer);
      })
      .catch(error => {
        console.error('Error pausing timer:', error);
      });
  }, [boardId, user, timerData, setTimerData]);

  const resumeTimer = useCallback(() => {
    if (!boardId || !user || !timerData || !timerData.pausedRemaining) return;
    clearAllColumnTimers();
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const updatedTimer = {
      ...timerData,
      duration: timerData.pausedRemaining,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, updatedTimer)
      .then(() => {
        setTimerData(updatedTimer);
      })
      .catch(error => {
        console.error('Error resuming timer:', error);
      });
  }, [boardId, user, timerData, setTimerData, clearAllColumnTimers]);

  const resetTimer = useCallback(() => {
    if (!boardId || !user) return;
    const timerRef = ref(database, `boards/${boardId}/timer`);
    remove(timerRef)
      .then(() => {
        setTimerData(null);
      })
      .catch(error => {
        console.error('Error resetting timer:', error);
      });
  }, [boardId, user, setTimerData]);

  const restartTimer = useCallback(() => {
    if (!boardId || !user || !timerData) return;
    clearAllColumnTimers();
    const timerRef = ref(database, `boards/${boardId}/timer`);
    const timerObj = {
      duration: timerData.duration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .then(() => {
        setTimerData(timerObj);
      })
      .catch(error => {
        console.error('Error restarting timer:', error);
      });
  }, [boardId, user, timerData, setTimerData, workflowPhase, clearAllColumnTimers]);

  return { startTimer, pauseTimer, resumeTimer, resetTimer, restartTimer };
};
