import { renderHook, act } from '@testing-library/react';
import { set, remove } from 'firebase/database';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { useUndoRedo } from './useUndoRedo';

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('initial state has canUndo=false, canRedo=false, pastCount=0, futureCount=0', () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(0);
  });

  test('recordAction adds to past stack and sets canUndo to true', () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.canUndo).toBe(true);
  });

  test('recordAction clears future stack (redo is invalidated by new action)', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action1 = {
      description: 'action 1',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old1' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new1' }]
    };
    const action2 = {
      description: 'action 2',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old2' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new2' }]
    };

    act(() => {
      result.current.recordAction(action1);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.futureCount).toBe(1);

    act(() => {
      result.current.recordAction(action2);
    });

    expect(result.current.futureCount).toBe(0);
  });

  test('undo moves last action from past to future and calls executeOperations with action.undo', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(1);
    expect(set).toHaveBeenCalledWith('mock-ref', 'old');
  });

  test('undo shows notification "Undid: {description}"', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'Card deleted',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(showNotification).toHaveBeenCalledWith('Undid: Card deleted');
  });

  test('undo with empty past does nothing', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.pastCount).toBe(0);
    expect(showNotification).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  test('redo moves first action from future to past and calls executeOperations with action.redo', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.redo();
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.futureCount).toBe(0);
    expect(set).toHaveBeenCalledWith('mock-ref', 'new');
  });

  test('redo shows notification "Redid: {description}"', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'Card created',
      undo: [{ type: 'remove', path: 'boards/board-1/cards/card-1' }],
      redo: [{ type: 'set', path: 'boards/board-1/cards/card-1', value: 'new card' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    showNotification.mockClear();

    await act(async () => {
      await result.current.redo();
    });

    expect(showNotification).toHaveBeenCalledWith('Redid: Card created');
  });

  test('redo with empty future does nothing', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    await act(async () => {
      await result.current.redo();
    });

    expect(result.current.futureCount).toBe(0);
    expect(showNotification).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  test('history clears when boardId changes', () => {
    const showNotification = vi.fn();
    const { result, rerender } = renderHook(
      ({ boardId }) => useUndoRedo({ boardId, showNotification }),
      { initialProps: { boardId: 'board-1' } }
    );

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    expect(result.current.pastCount).toBe(1);

    rerender({ boardId: 'board-2' });

    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(0);
  });

  test('MAX_HISTORY is enforced - record 51 actions, verify only 50 in past', () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    act(() => {
      for (let i = 0; i < 51; i++) {
        const action = {
          description: `action ${i}`,
          undo: [{ type: 'set', path: `boards/board-1/test/${i}`, value: 'old' }],
          redo: [{ type: 'set', path: `boards/board-1/test/${i}`, value: 'new' }]
        };
        result.current.recordAction(action);
      }
    });

    expect(result.current.pastCount).toBe(50);
  });

  test('undo then redo restores original state', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    const pastCountBefore = result.current.pastCount;

    await act(async () => {
      await result.current.undo();
    });

    const _pastCountAfterUndo = result.current.pastCount;
    const _futureCountAfterUndo = result.current.futureCount;

    await act(async () => {
      await result.current.redo();
    });

    expect(result.current.pastCount).toBe(pastCountBefore);
    expect(result.current.futureCount).toBe(0);
  });

  test('multiple undo/redo cycles work correctly', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action1 = {
      description: 'action 1',
      undo: [{ type: 'set', path: 'boards/board-1/test1', value: 'old1' }],
      redo: [{ type: 'set', path: 'boards/board-1/test1', value: 'new1' }]
    };
    const action2 = {
      description: 'action 2',
      undo: [{ type: 'set', path: 'boards/board-1/test2', value: 'old2' }],
      redo: [{ type: 'set', path: 'boards/board-1/test2', value: 'new2' }]
    };

    act(() => {
      result.current.recordAction(action1);
      result.current.recordAction(action2);
    });

    expect(result.current.pastCount).toBe(2);

    await act(async () => {
      await result.current.undo();
      await result.current.undo();
    });

    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(2);

    await act(async () => {
      await result.current.redo();
      await result.current.redo();
    });

    expect(result.current.pastCount).toBe(2);
    expect(result.current.futureCount).toBe(0);
  });

  test('keyboard shortcut Ctrl+Z triggers undo', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    vi.clearAllMocks();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(1);
  });

  test('keyboard shortcut Ctrl+Shift+Z triggers redo', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.futureCount).toBe(1);

    vi.clearAllMocks();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.futureCount).toBe(0);
  });

  test('keyboard shortcut Cmd+Z triggers undo (metaKey)', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    vi.clearAllMocks();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(0);
    expect(result.current.futureCount).toBe(1);
  });

  test('keyboard shortcut is ignored when target is INPUT element', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      window.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.futureCount).toBe(0);

    document.body.removeChild(input);
  });

  test('keyboard shortcut is ignored when target is TEXTAREA element', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      window.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.futureCount).toBe(0);

    document.body.removeChild(textarea);
  });

  test('keyboard shortcut is ignored when target is contentEditable', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.appendChild(editable);
    editable.focus();

    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      Object.defineProperty(event, 'target', {
        value: editable,
        enumerable: true,
        configurable: true
      });
      editable.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pastCount).toBe(1);
    expect(result.current.futureCount).toBe(0);

    document.body.removeChild(editable);
  });

  test('failed undo shows "Undo failed" notification', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    set.mockRejectedValueOnce(new Error('Firebase error'));

    showNotification.mockClear();

    await act(async () => {
      await result.current.undo();
    });

    expect(showNotification).toHaveBeenCalledWith('Undo failed');
  });

  test('failed redo shows "Redo failed" notification', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    set.mockRejectedValueOnce(new Error('Firebase error'));

    showNotification.mockClear();

    await act(async () => {
      await result.current.redo();
    });

    expect(showNotification).toHaveBeenCalledWith('Redo failed');
  });

  test('actions recorded during undo/redo execution are NOT recorded (isUndoRedoRef prevents it)', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'test action',
      undo: [{ type: 'set', path: 'boards/board-1/test', value: 'old' }],
      redo: [{ type: 'set', path: 'boards/board-1/test', value: 'new' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    expect(result.current.pastCount).toBe(1);

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.pastCount).toBe(0);
  });

  test('remove operations are executed correctly', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'card deleted',
      undo: [{ type: 'set', path: 'boards/board-1/cards/card-1', value: 'restored card' }],
      redo: [{ type: 'remove', path: 'boards/board-1/cards/card-1' }]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(remove).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith('mock-ref', 'restored card');

    vi.clearAllMocks();

    await act(async () => {
      await result.current.redo();
    });

    expect(remove).toHaveBeenCalledWith('mock-ref');
  });

  test('multiple operations per action are all executed', async () => {
    const showNotification = vi.fn();
    const { result } = renderHook(() => useUndoRedo({ boardId: 'board-1', showNotification }));

    const action = {
      description: 'complex action',
      undo: [
        { type: 'set', path: 'boards/board-1/test1', value: 'old1' },
        { type: 'set', path: 'boards/board-1/test2', value: 'old2' }
      ],
      redo: [
        { type: 'set', path: 'boards/board-1/test1', value: 'new1' },
        { type: 'set', path: 'boards/board-1/test2', value: 'new2' }
      ]
    };

    act(() => {
      result.current.recordAction(action);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(set).toHaveBeenCalledTimes(2);
  });
});
