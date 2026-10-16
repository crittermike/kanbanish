import { renderHook, act } from '@testing-library/react';
import { ref, set } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePoll } from './usePoll';

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  user: { uid: 'user1' },
  pollVotes: {},
  setUserPollVote: vi.fn(),
  ...overrides
});

describe('usePoll', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('submitPollVote', () => {
    it('should submit a valid rating via Firebase set()', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(4);
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/board-123/poll/votes/user1');
      expect(set).toHaveBeenCalledWith('mock-ref', 4);
    });

    it('should call setUserPollVote after successful submit', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(3);
      });

      expect(mockProps.setUserPollVote).toHaveBeenCalledWith(3);
    });

    it('should accept rating of 1 (minimum valid)', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(1);
      });

      expect(set).toHaveBeenCalledWith('mock-ref', 1);
    });

    it('should accept rating of 5 (maximum valid)', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(5);
      });

      expect(set).toHaveBeenCalledWith('mock-ref', 5);
    });

    it('should reject rating of 0 (below minimum)', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(0);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should reject rating of 6 (above maximum)', async () => {
      const { result } = renderHook(() => usePoll(mockProps));

      await act(async () => {
        result.current.submitPollVote(6);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not submit when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => usePoll(props));

      await act(async () => {
        result.current.submitPollVote(3);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not submit when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => usePoll(props));

      await act(async () => {
        result.current.submitPollVote(3);
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('getPollStats', () => {
    it('should return zeros for empty votes', () => {
      const { result } = renderHook(() => usePoll(mockProps));

      const stats = result.current.getPollStats();

      expect(stats).toEqual({
        average: 0,
        distribution: [0, 0, 0, 0, 0],
        totalVotes: 0
      });
    });

    it('should calculate stats for a single vote', () => {
      const props = createMockProps({ pollVotes: { user1: 4 } });
      const { result } = renderHook(() => usePoll(props));

      const stats = result.current.getPollStats();

      expect(stats.average).toBe(4);
      expect(stats.totalVotes).toBe(1);
      expect(stats.distribution).toEqual([0, 0, 0, 1, 0]);
    });

    it('should calculate stats for multiple votes', () => {
      const props = createMockProps({
        pollVotes: { user1: 3, user2: 5, user3: 3 }
      });
      const { result } = renderHook(() => usePoll(props));

      const stats = result.current.getPollStats();

      expect(stats.average).toBeCloseTo(3.667, 2);
      expect(stats.totalVotes).toBe(3);
      expect(stats.distribution).toEqual([0, 0, 2, 0, 1]);
    });

    it('should calculate correct distribution for all rating levels', () => {
      const props = createMockProps({
        pollVotes: { u1: 1, u2: 2, u3: 3, u4: 4, u5: 5 }
      });
      const { result } = renderHook(() => usePoll(props));

      const stats = result.current.getPollStats();

      expect(stats.distribution).toEqual([1, 1, 1, 1, 1]);
      expect(stats.average).toBe(3);
      expect(stats.totalVotes).toBe(5);
    });

    it('should calculate correct average', () => {
      const props = createMockProps({
        pollVotes: { u1: 5, u2: 5, u3: 5, u4: 5 }
      });
      const { result } = renderHook(() => usePoll(props));

      const stats = result.current.getPollStats();

      expect(stats.average).toBe(5);
    });

    it('should handle votes with duplicate ratings', () => {
      const props = createMockProps({
        pollVotes: { u1: 2, u2: 2, u3: 2 }
      });
      const { result } = renderHook(() => usePoll(props));

      const stats = result.current.getPollStats();

      expect(stats.average).toBe(2);
      expect(stats.distribution).toEqual([0, 3, 0, 0, 0]);
      expect(stats.totalVotes).toBe(3);
    });
  });
});
