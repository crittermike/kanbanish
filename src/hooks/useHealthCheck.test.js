import { renderHook, act } from '@testing-library/react';
import { ref, set } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HEALTH_CHECK_QUESTIONS, useHealthCheck } from './useHealthCheck';

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
  healthCheckVotes: {},
  setUserHealthCheckVotes: vi.fn(),
  ...overrides
});

describe('useHealthCheck', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('HEALTH_CHECK_QUESTIONS', () => {
    it('should export HEALTH_CHECK_QUESTIONS as a named export', () => {
      expect(HEALTH_CHECK_QUESTIONS).toBeDefined();
      expect(Array.isArray(HEALTH_CHECK_QUESTIONS)).toBe(true);
    });

    it('should have exactly 8 questions', () => {
      expect(HEALTH_CHECK_QUESTIONS).toHaveLength(8);
    });

    it('should have id, label, and description for each question', () => {
      HEALTH_CHECK_QUESTIONS.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('label');
        expect(question).toHaveProperty('description');
        expect(typeof question.id).toBe('string');
        expect(typeof question.label).toBe('string');
        expect(typeof question.description).toBe('string');
      });
    });

    it('should return HEALTH_CHECK_QUESTIONS from the hook', () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      expect(result.current.HEALTH_CHECK_QUESTIONS).toBe(HEALTH_CHECK_QUESTIONS);
    });
  });

  describe('submitHealthCheckVote', () => {
    it('should submit a valid rating via Firebase set()', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('teamwork', 4);
      });

      expect(ref).toHaveBeenCalledWith({}, 'boards/board-123/healthCheck/votes/teamwork/user1');
      expect(set).toHaveBeenCalledWith('mock-ref', 4);
    });

    it('should call setUserHealthCheckVotes after successful submit', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('process', 5);
      });

      expect(mockProps.setUserHealthCheckVotes).toHaveBeenCalled();
      // Verify the updater function works correctly
      const updaterFn = mockProps.setUserHealthCheckVotes.mock.calls[0][0];
      const newState = updaterFn({ teamwork: 3 });
      expect(newState).toEqual({ teamwork: 3, process: 5 });
    });

    it('should accept rating of 1 (minimum valid)', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('fun', 1);
      });

      expect(set).toHaveBeenCalledWith('mock-ref', 1);
    });

    it('should accept rating of 5 (maximum valid)', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('speed', 5);
      });

      expect(set).toHaveBeenCalledWith('mock-ref', 5);
    });

    it('should reject rating of 0 (below minimum)', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('teamwork', 0);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should reject rating of 6 (above maximum)', async () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      await act(async () => {
        result.current.submitHealthCheckVote('teamwork', 6);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not submit when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useHealthCheck(props));

      await act(async () => {
        result.current.submitHealthCheckVote('teamwork', 3);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not submit when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useHealthCheck(props));

      await act(async () => {
        result.current.submitHealthCheckVote('teamwork', 3);
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('getHealthCheckStats', () => {
    it('should return stats for all 8 questions with zeros when no votes', () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      const stats = result.current.getHealthCheckStats();

      expect(stats).toHaveLength(8);
      stats.forEach(stat => {
        expect(stat.average).toBe(0);
        expect(stat.distribution).toEqual([0, 0, 0, 0, 0]);
        expect(stat.totalVotes).toBe(0);
        expect(stat).toHaveProperty('id');
        expect(stat).toHaveProperty('label');
        expect(stat).toHaveProperty('description');
      });
    });

    it('should calculate stats for a single question with one vote', () => {
      const props = createMockProps({
        healthCheckVotes: { teamwork: { user1: 4 } }
      });
      const { result } = renderHook(() => useHealthCheck(props));

      const stats = result.current.getHealthCheckStats();
      const teamworkStats = stats.find(s => s.id === 'teamwork');

      expect(teamworkStats.average).toBe(4);
      expect(teamworkStats.totalVotes).toBe(1);
      expect(teamworkStats.distribution).toEqual([0, 0, 0, 1, 0]);
    });

    it('should calculate stats for a question with multiple votes', () => {
      const props = createMockProps({
        healthCheckVotes: {
          teamwork: { user1: 3, user2: 5, user3: 3 }
        }
      });
      const { result } = renderHook(() => useHealthCheck(props));

      const stats = result.current.getHealthCheckStats();
      const teamworkStats = stats.find(s => s.id === 'teamwork');

      expect(teamworkStats.average).toBeCloseTo(3.667, 2);
      expect(teamworkStats.totalVotes).toBe(3);
      expect(teamworkStats.distribution).toEqual([0, 0, 2, 0, 1]);
    });

    it('should calculate stats independently per question', () => {
      const props = createMockProps({
        healthCheckVotes: {
          teamwork: { user1: 5, user2: 5 },
          process: { user1: 1 }
        }
      });
      const { result } = renderHook(() => useHealthCheck(props));

      const stats = result.current.getHealthCheckStats();
      const teamworkStats = stats.find(s => s.id === 'teamwork');
      const processStats = stats.find(s => s.id === 'process');
      const funStats = stats.find(s => s.id === 'fun');

      expect(teamworkStats.average).toBe(5);
      expect(teamworkStats.totalVotes).toBe(2);
      expect(processStats.average).toBe(1);
      expect(processStats.totalVotes).toBe(1);
      expect(funStats.average).toBe(0);
      expect(funStats.totalVotes).toBe(0);
    });

    it('should include question metadata in stats output', () => {
      const { result } = renderHook(() => useHealthCheck(mockProps));

      const stats = result.current.getHealthCheckStats();
      const teamworkStats = stats.find(s => s.id === 'teamwork');

      expect(teamworkStats.label).toBe('Teamwork');
      expect(teamworkStats.description).toBe('How well is the team collaborating?');
    });

    it('should calculate correct distribution for all rating levels', () => {
      const props = createMockProps({
        healthCheckVotes: {
          teamwork: { u1: 1, u2: 2, u3: 3, u4: 4, u5: 5 }
        }
      });
      const { result } = renderHook(() => useHealthCheck(props));

      const stats = result.current.getHealthCheckStats();
      const teamworkStats = stats.find(s => s.id === 'teamwork');

      expect(teamworkStats.distribution).toEqual([1, 1, 1, 1, 1]);
      expect(teamworkStats.average).toBe(3);
      expect(teamworkStats.totalVotes).toBe(5);
    });
  });
});
