import { renderHook, act } from '@testing-library/react';
import { ref, set, remove, onValue, off } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePresence } from './usePresence';

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
  off: vi.fn()
}));

const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  user: { uid: 'user1' },
  ...overrides
});

describe('usePresence', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default onValue to not call back (no-op)
    onValue.mockImplementation(() => {});
  });

  describe('startCardCreation', () => {
    it('should call Firebase set with columnId and user data', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => usePresence(mockProps));

      act(() => {
        result.current.startCardCreation('column-456');
      });

      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        columnId: 'column-456',
        uid: 'user1'
      }));
    });

    it('should do nothing when boardId is null', () => {
      mockProps = createMockProps({ boardId: null });
      const { result } = renderHook(() => usePresence(mockProps));

      // Clear mocks from initial render
      set.mockClear();

      act(() => {
        result.current.startCardCreation('column-456');
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', () => {
      mockProps = createMockProps({ user: null });
      const { result } = renderHook(() => usePresence(mockProps));

      // Clear mocks from initial render
      set.mockClear();

      act(() => {
        result.current.startCardCreation('column-456');
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('stopCardCreation', () => {
    it('should call Firebase remove', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => usePresence(mockProps));

      // Clear mocks from initial render
      remove.mockClear();

      act(() => {
        result.current.stopCardCreation();
      });

      expect(remove).toHaveBeenCalledWith('mock-ref');
    });

    it('should do nothing when boardId is null', () => {
      mockProps = createMockProps({ boardId: null });
      const { result } = renderHook(() => usePresence(mockProps));

      // Clear mocks from initial render
      remove.mockClear();

      act(() => {
        result.current.stopCardCreation();
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', () => {
      mockProps = createMockProps({ user: null });
      const { result } = renderHook(() => usePresence(mockProps));

      // Clear mocks from initial render
      remove.mockClear();

      act(() => {
        result.current.stopCardCreation();
      });

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('getUsersAddingCardsInColumn', () => {
    it('should filter users by columnId', () => {
      mockProps = createMockProps();

      // Capture the onValue callback for cardCreationActivity and invoke it
      let cardCreationCallback;
      onValue.mockImplementation((refArg, callback) => {
        // The second onValue call is for cardCreationActivity
        cardCreationCallback = callback;
      });

      const { result } = renderHook(() => usePresence(mockProps));

      // Simulate Firebase callback with card creation data
      act(() => {
        cardCreationCallback({
          exists: () => true,
          val: () => ({
            user2: { columnId: 'col-a', uid: 'user2', lastUpdated: 123 },
            user3: { columnId: 'col-b', uid: 'user3', lastUpdated: 456 },
            user4: { columnId: 'col-a', uid: 'user4', lastUpdated: 789 }
          })
        });
      });

      const usersInColA = result.current.getUsersAddingCardsInColumn('col-a');
      expect(usersInColA).toHaveLength(2);
      expect(usersInColA.map(u => u.userId)).toEqual(['user2', 'user4']);
    });

    it('should return empty array when no users are adding cards', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => usePresence(mockProps));

      const users = result.current.getUsersAddingCardsInColumn('col-a');
      expect(users).toEqual([]);
    });
  });

  describe('getAllUsersAddingCards', () => {
    it('should return all users adding cards', () => {
      mockProps = createMockProps();

      let cardCreationCallback;
      onValue.mockImplementation((refArg, callback) => {
        cardCreationCallback = callback;
      });

      const { result } = renderHook(() => usePresence(mockProps));

      act(() => {
        cardCreationCallback({
          exists: () => true,
          val: () => ({
            user2: { columnId: 'col-a', uid: 'user2', lastUpdated: 123 },
            user3: { columnId: 'col-b', uid: 'user3', lastUpdated: 456 }
          })
        });
      });

      const allUsers = result.current.getAllUsersAddingCards();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.map(u => u.userId)).toEqual(['user2', 'user3']);
    });

    it('should return empty array when no users are adding cards', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => usePresence(mockProps));

      const allUsers = result.current.getAllUsersAddingCards();
      expect(allUsers).toEqual([]);
    });
  });

  describe('useEffect cleanup', () => {
    it('should remove presence and card creation activity on unmount', () => {
      mockProps = createMockProps();
      const { unmount } = renderHook(() => usePresence(mockProps));

      // Clear mocks from setup calls
      remove.mockClear();
      off.mockClear();

      unmount();

      // Should call remove for presence ref and card creation activity ref
      expect(remove).toHaveBeenCalled();
      // Should call off to unsubscribe from Firebase listeners
      expect(off).toHaveBeenCalled();
    });

    it('should not set up presence listeners when boardId is null', () => {
      mockProps = createMockProps({ boardId: null });

      // Clear any previous calls
      set.mockClear();
      onValue.mockClear();

      renderHook(() => usePresence(mockProps));

      // onValue should not have been called since boardId is null
      expect(onValue).not.toHaveBeenCalled();
      // set should not have been called for presence
      expect(set).not.toHaveBeenCalled();
    });

    it('should not set up presence listeners when user is null', () => {
      mockProps = createMockProps({ user: null });

      // Clear any previous calls
      set.mockClear();
      onValue.mockClear();

      renderHook(() => usePresence(mockProps));

      expect(onValue).not.toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('activeUsers', () => {
    it('should update activeUsers when presence data changes', () => {
      mockProps = createMockProps();

      let presenceCallback;
      onValue.mockImplementation((refArg, callback) => {
        // First onValue call is for presence
        if (!presenceCallback) {
          presenceCallback = callback;
        }
      });

      const { result } = renderHook(() => usePresence(mockProps));

      act(() => {
        presenceCallback({
          exists: () => true,
          val: () => ({
            user1: { lastSeen: Date.now(), uid: 'user1' },
            user2: { lastSeen: Date.now(), uid: 'user2' },
            user3: { lastSeen: Date.now(), uid: 'user3' }
          })
        });
      });

      expect(result.current.activeUsers).toBe(3);
    });

    it('should set activeUsers to 0 when no presence data exists', () => {
      mockProps = createMockProps();

      let presenceCallback;
      onValue.mockImplementation((refArg, callback) => {
        if (!presenceCallback) {
          presenceCallback = callback;
        }
      });

      const { result } = renderHook(() => usePresence(mockProps));

      act(() => {
        presenceCallback({
          exists: () => false,
          val: () => null
        });
      });

      expect(result.current.activeUsers).toBe(0);
    });

    it('should not count users with stale lastSeen timestamps', () => {
      mockProps = createMockProps();

      let presenceCallback;
      onValue.mockImplementation((refArg, callback) => {
        if (!presenceCallback) {
          presenceCallback = callback;
        }
      });

      const { result } = renderHook(() => usePresence(mockProps));

      const now = Date.now();
      act(() => {
        presenceCallback({
          exists: () => true,
          val: () => ({
            user1: { lastSeen: now, uid: 'user1' },
            user2: { lastSeen: now - 60000, uid: 'user2' } // 60 seconds ago, stale
          })
        });
      });

      expect(result.current.activeUsers).toBe(1);
    });
  });
});
