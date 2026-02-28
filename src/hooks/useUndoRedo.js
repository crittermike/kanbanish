import { ref, set, remove } from 'firebase/database';
import { useState, useCallback, useEffect, useRef } from 'react';
import { database } from '../utils/firebase';

const MAX_HISTORY = 50;

/**
 * Action types for the undo/redo system.
 *
 * Each recorded action stores the information needed to reverse it.
 * The `undo` array contains Firebase write operations to run when undoing,
 * and the `redo` array stores the operations to replay when redoing.
 *
 * Operation shape: { type: 'set' | 'remove', path: string, value?: any }
 */

/**
 * Hook that manages an undo/redo history stack for Firebase operations.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID (clears history on change)
 * @param {Function} params.showNotification - Notification function from NotificationContext
 * @returns {Object} Undo/redo state and operations
 */
export const useUndoRedo = ({ boardId, showNotification }) => {
  // Past actions (undo stack) and future actions (redo stack)
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Track whether an undo/redo is currently executing to avoid recording it
  const isUndoRedoRef = useRef(false);

  // Clear history when board changes
  useEffect(() => {
    setPast([]);
    setFuture([]);
  }, [boardId]);

  /**
   * Execute an array of Firebase operations.
   * @param {Array<{type: 'set'|'remove', path: string, value?: any}>} operations
   */
  const executeOperations = useCallback(async (operations) => {
    const promises = operations.map(op => {
      const dbRef = ref(database, op.path);
      if (op.type === 'set') {
        return set(dbRef, op.value);
      }
      return remove(dbRef);
    });
    await Promise.all(promises);
  }, []);

  /**
   * Record an undoable action. Call this AFTER the action has been performed.
   *
   * @param {Object} action
   * @param {string} action.description - Human-readable description (e.g. "Card deleted")
   * @param {Array} action.undo - Operations to run to undo this action
   * @param {Array} action.redo - Operations to run to redo this action
   */
  const recordAction = useCallback((action) => {
    // Don't record actions triggered by undo/redo itself
    if (isUndoRedoRef.current) {
      return;
    }

    setPast(prev => {
      const newPast = [...prev, action];
      // Trim to max history size
      if (newPast.length > MAX_HISTORY) {
        return newPast.slice(newPast.length - MAX_HISTORY);
      }
      return newPast;
    });
    // Any new action clears the redo stack
    setFuture([]);
  }, []);

  /**
   * Undo the last action.
   */
  const undo = useCallback(async () => {
    if (past.length === 0) {
      return;
    }

    const action = past[past.length - 1];
    isUndoRedoRef.current = true;

    try {
      await executeOperations(action.undo);
      setPast(prev => prev.slice(0, -1));
      setFuture(prev => [action, ...prev]);

      if (showNotification) {
        showNotification(`Undid: ${action.description}`);
      }
    } catch (error) {
      console.error('Error undoing action:', error);
      if (showNotification) {
        showNotification('Undo failed');
      }
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [past, executeOperations, showNotification]);

  /**
   * Redo the last undone action.
   */
  const redo = useCallback(async () => {
    if (future.length === 0) {
      return;
    }

    const action = future[0];
    isUndoRedoRef.current = true;

    try {
      await executeOperations(action.redo);
      setFuture(prev => prev.slice(1));
      setPast(prev => [...prev, action]);

      if (showNotification) {
        showNotification(`Redid: ${action.description}`);
      }
    } catch (error) {
      console.error('Error redoing action:', error);
      if (showNotification) {
        showNotification('Redo failed');
      }
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [future, executeOperations, showNotification]);

  /**
   * Keyboard shortcut handler for Ctrl+Z / Cmd+Z (undo)
   * and Ctrl+Shift+Z / Cmd+Shift+Z (redo).
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in an input/textarea
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'z') {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    recordAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pastCount: past.length,
    futureCount: future.length
  };
};
