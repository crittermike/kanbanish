import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { areInteractionsVisible } from '../utils/workflowUtils';
import { useVoteCounterVisibility } from './useVoteCounterVisibility';

// Mock dependencies
vi.mock('../context/BoardContext');
vi.mock('../utils/workflowUtils');

describe('useVoteCounterVisibility', () => {
  const mockUser = { uid: 'user123' };

  beforeEach(() => {
    vi.clearAllMocks();
    areInteractionsVisible.mockReturnValue(true);
  });

  it('returns correct visibility when all conditions are met', () => {
    useBoardContext.mockReturnValue({
      votingEnabled: true,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS',
      user: mockUser,
      activeUsers: 3
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(true);
    expect(result.current.isTotalVoteCounterVisible).toBe(true);
    expect(result.current.isBaseVisible).toBe(true);
  });

  it('returns false when voting is disabled', () => {
    useBoardContext.mockReturnValue({
      votingEnabled: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS',
      user: mockUser,
      activeUsers: 3
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(false);
    expect(result.current.isTotalVoteCounterVisible).toBe(false);
    expect(result.current.isBaseVisible).toBe(false);
  });

  it('returns false when retrospective mode is disabled', () => {
    useBoardContext.mockReturnValue({
      votingEnabled: true,
      retrospectiveMode: false,
      workflowPhase: 'INTERACTIONS',
      user: mockUser,
      activeUsers: 3
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(false);
    expect(result.current.isTotalVoteCounterVisible).toBe(false);
    expect(result.current.isBaseVisible).toBe(false);
  });

  it('returns false when interactions are not visible', () => {
    areInteractionsVisible.mockReturnValue(false);
    
    useBoardContext.mockReturnValue({
      votingEnabled: true,
      retrospectiveMode: true,
      workflowPhase: 'CREATION',
      user: mockUser,
      activeUsers: 3
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(false);
    expect(result.current.isTotalVoteCounterVisible).toBe(false);
    expect(result.current.isBaseVisible).toBe(false);
  });

  it('returns false for user counter when no user is logged in', () => {
    useBoardContext.mockReturnValue({
      votingEnabled: true,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS',
      user: null,
      activeUsers: 3
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(false);
    expect(result.current.isTotalVoteCounterVisible).toBe(true);
    expect(result.current.isBaseVisible).toBe(true);
  });

  it('returns false for total counter when no active users', () => {
    useBoardContext.mockReturnValue({
      votingEnabled: true,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS',
      user: mockUser,
      activeUsers: 0
    });

    const { result } = renderHook(() => useVoteCounterVisibility());

    expect(result.current.isUserVoteCounterVisible).toBe(true);
    expect(result.current.isTotalVoteCounterVisible).toBe(false);
    expect(result.current.isBaseVisible).toBe(true);
  });
});
