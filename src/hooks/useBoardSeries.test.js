import { renderHook, act } from '@testing-library/react';
import { get, set, remove } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useBoardSeries } from './useBoardSeries';

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db, path) => path),
  get: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

// Pass-through retry so we can assert on the underlying set/remove calls.
vi.mock('../utils/firebaseRetry', () => ({
  withRetry: vi.fn((operation) => operation())
}));

let idCounter = 0;
vi.mock('../utils/ids', () => ({
  generateId: vi.fn(() => `gen-${++idCounter}`)
}));

const snapshot = (value) => ({
  val: () => value,
  exists: () => value !== null && value !== undefined
});

const createProps = (overrides = {}) => ({
  boardId: 'board-current',
  user: { uid: 'user-1' },
  ...overrides
});

describe('useBoardSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idCounter = 0;
  });

  describe('startNextBoard', () => {
    it('returns null and writes nothing when boardId is missing', async () => {
      const { result } = renderHook(() => useBoardSeries(createProps({ boardId: null })));
      let returned;
      await act(async () => {
        returned = await result.current.startNextBoard();
      });
      expect(returned).toBeNull();
      expect(set).not.toHaveBeenCalled();
    });

    it('returns null and writes nothing when user is missing', async () => {
      const { result } = renderHook(() => useBoardSeries(createProps({ user: null })));
      let returned;
      await act(async () => {
        returned = await result.current.startNextBoard();
      });
      expect(returned).toBeNull();
      expect(set).not.toHaveBeenCalled();
    });

    it('clones columns + settings, links pointers, and returns the new board id', async () => {
      get.mockResolvedValueOnce(
        snapshot({
          title: 'Sprint Retro',
          settings: {
            retrospectiveMode: true,
            votingEnabled: true,
            workflowPhase: 'RESULTS',
            resultsViewIndex: 3
          },
          columns: {
            b_two: { title: 'Stop', cards: { c1: {} }, defaultTimerSeconds: 60 },
            a_one: { title: 'Start', cards: { c2: {} } }
          },
          nextBoardId: 'should-be-overwritten'
        })
      );

      const { result } = renderHook(() => useBoardSeries(createProps()));
      let newId;
      await act(async () => {
        newId = await result.current.startNextBoard();
      });

      // First set() creates the new board.
      const [newBoardPath, newBoardData] = set.mock.calls[0];
      expect(newBoardPath).toBe(`boards/${newId}`);
      expect(newBoardData.title).toBe('Sprint Retro');
      expect(newBoardData.owner).toBe('user-1');
      expect(newBoardData.previousBoardId).toBe('board-current');
      // Settings cloned but workflow position reset.
      expect(newBoardData.settings.retrospectiveMode).toBe(true);
      expect(newBoardData.settings.workflowPhase).toBe('CREATION');
      expect(newBoardData.settings.resultsViewIndex).toBe(0);

      // Columns cloned: order preserved (a_ before b_), empty cards, no stray next pointer.
      const columnTitles = Object.values(newBoardData.columns).map(c => c.title);
      expect(columnTitles).toEqual(['Start', 'Stop']);
      Object.values(newBoardData.columns).forEach(c => {
        expect(c.cards).toEqual({});
      });
      expect(newBoardData.nextBoardId).toBeUndefined();

      // Second set() links the current board forward to the new one.
      const [currentNextPath, nextValue] = set.mock.calls[1];
      expect(currentNextPath).toBe('boards/board-current/nextBoardId');
      expect(nextValue).toBe(newId);
    });
  });

  describe('linkToPreviousBoard', () => {
    it('returns false for empty input', async () => {
      const { result } = renderHook(() => useBoardSeries(createProps()));
      let ok;
      await act(async () => {
        ok = await result.current.linkToPreviousBoard('   ');
      });
      expect(ok).toBe(false);
      expect(set).not.toHaveBeenCalled();
    });

    it('returns false when trying to link a board to itself', async () => {
      const { result } = renderHook(() => useBoardSeries(createProps()));
      let ok;
      await act(async () => {
        ok = await result.current.linkToPreviousBoard('board-current');
      });
      expect(ok).toBe(false);
      expect(set).not.toHaveBeenCalled();
    });

    it('returns false when the target board does not exist', async () => {
      get.mockResolvedValueOnce(snapshot(null));
      const { result } = renderHook(() => useBoardSeries(createProps()));
      let ok;
      await act(async () => {
        ok = await result.current.linkToPreviousBoard('board-missing');
      });
      expect(ok).toBe(false);
      expect(set).not.toHaveBeenCalled();
    });

    it('sets both reciprocal pointers when the target exists', async () => {
      get.mockResolvedValueOnce(snapshot({ title: 'Older board' }));
      const { result } = renderHook(() => useBoardSeries(createProps()));
      let ok;
      await act(async () => {
        ok = await result.current.linkToPreviousBoard('board-older');
      });
      expect(ok).toBe(true);
      expect(set).toHaveBeenCalledWith('boards/board-current/previousBoardId', 'board-older');
      expect(set).toHaveBeenCalledWith('boards/board-older/nextBoardId', 'board-current');
    });
  });

  describe('unlinkFromSeries', () => {
    it('removes reciprocal neighbour pointers and own pointers', async () => {
      get.mockResolvedValueOnce(
        snapshot({ previousBoardId: 'board-prev', nextBoardId: 'board-next' })
      );
      const { result } = renderHook(() => useBoardSeries(createProps()));
      await act(async () => {
        await result.current.unlinkFromSeries();
      });
      expect(remove).toHaveBeenCalledWith('boards/board-prev/nextBoardId');
      expect(remove).toHaveBeenCalledWith('boards/board-next/previousBoardId');
      expect(remove).toHaveBeenCalledWith('boards/board-current/previousBoardId');
      expect(remove).toHaveBeenCalledWith('boards/board-current/nextBoardId');
    });

    it('only removes existing links', async () => {
      get.mockResolvedValueOnce(snapshot({ previousBoardId: 'board-prev' }));
      const { result } = renderHook(() => useBoardSeries(createProps()));
      await act(async () => {
        await result.current.unlinkFromSeries();
      });
      expect(remove).toHaveBeenCalledWith('boards/board-prev/nextBoardId');
      expect(remove).not.toHaveBeenCalledWith('boards/undefined/previousBoardId');
    });
  });
});
