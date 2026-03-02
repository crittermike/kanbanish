import { ref, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for per-column timer functionality (countdown timer synced via Firebase).
 *
 * Provides start, pause, resume, reset, and restart operations scoped to a column.
 * Timer state is stored in Firebase at boards/{boardId}/columns/{columnId}/timer
 * and read by the main onValue listener in BoardContext (automatically available
 * in columns[columnId].timer).
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {string|null} params.workflowPhase - Current workflow phase (tags timer)
 * @returns {Object} Column timer operations (each takes columnId + optional data)
 */
export const useColumnTimer = ({ boardId, user, workflowPhase, columns }) => {
  const clearOtherTimers = useCallback((activeColumnId) => {
    if (!boardId || !columns) return;
    Object.keys(columns).forEach((colId) => {
      if (colId !== activeColumnId && columns[colId]?.timer) {
        const timerRef = ref(database, `boards/${boardId}/columns/${colId}/timer`);
        remove(timerRef).catch(() => {});
      }
    });
  }, [boardId, columns]);

  const startColumnTimer = useCallback((columnId, duration) => {
    if (!boardId || !user || !columnId) return;
    clearOtherTimers(columnId);
    const timerRef = ref(database, `boards/${boardId}/columns/${columnId}/timer`);
    const timerObj = {
      duration, // total seconds
      originalDuration: duration, // preserved for restart
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .catch(error => {
        console.error('Error starting column timer:', error);
      });
  }, [boardId, user, workflowPhase, clearOtherTimers]);

  const pauseColumnTimer = useCallback((columnId, timerData) => {
    if (!boardId || !user || !columnId || !timerData) return;
    const timerRef = ref(database, `boards/${boardId}/columns/${columnId}/timer`);
    const elapsed = (Date.now() - timerData.startedAt) / 1000;
    const remaining = Math.max(0, timerData.duration - elapsed);
    const updatedTimer = {
      ...timerData,
      isRunning: false,
      pausedRemaining: remaining,
      startedAt: null
    };
    set(timerRef, updatedTimer)
      .catch(error => {
        console.error('Error pausing column timer:', error);
      });
  }, [boardId, user]);

  const resumeColumnTimer = useCallback((columnId, timerData) => {
    if (!boardId || !user || !columnId || !timerData || !timerData.pausedRemaining) return;
    clearOtherTimers(columnId);
    const timerRef = ref(database, `boards/${boardId}/columns/${columnId}/timer`);
    const updatedTimer = {
      ...timerData,
      duration: timerData.pausedRemaining,
      originalDuration: timerData.originalDuration || timerData.duration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null
    };
    set(timerRef, updatedTimer)
      .catch(error => {
        console.error('Error resuming column timer:', error);
      });
  }, [boardId, user, clearOtherTimers]);

  const resetColumnTimer = useCallback((columnId) => {
    if (!boardId || !user || !columnId) return;
    const timerRef = ref(database, `boards/${boardId}/columns/${columnId}/timer`);
    remove(timerRef)
      .catch(error => {
        console.error('Error resetting column timer:', error);
      });
  }, [boardId, user]);

  const restartColumnTimer = useCallback((columnId, timerData) => {
    if (!boardId || !user || !columnId || !timerData) return;
    clearOtherTimers(columnId);
    const timerRef = ref(database, `boards/${boardId}/columns/${columnId}/timer`);
    const originalDuration = timerData.originalDuration || timerData.duration;
    const timerObj = {
      duration: originalDuration,
      originalDuration,
      startedAt: Date.now(),
      isRunning: true,
      pausedRemaining: null,
      phase: workflowPhase
    };
    set(timerRef, timerObj)
      .catch(error => {
        console.error('Error restarting column timer:', error);
      });
  }, [boardId, user, workflowPhase, clearOtherTimers]);

  return {
    startColumnTimer,
    pauseColumnTimer,
    resumeColumnTimer,
    resetColumnTimer,
    restartColumnTimer
  };
};
