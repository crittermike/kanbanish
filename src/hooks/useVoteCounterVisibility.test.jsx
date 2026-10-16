import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { useVoteCounterVisibility } from './useVoteCounterVisibility';

vi.mock('../context/BoardContext');

describe('useVoteCounterVisibility', () => {
  const baseContext = {
    votingEnabled: true,
    retrospectiveMode: true,
    workflowPhase: 'INTERACTIONS',
    user: { uid: 'user123' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is visible during the vote step', () => {
    useBoardContext.mockReturnValue(baseContext);
    const { result } = renderHook(() => useVoteCounterVisibility());
    expect(result.current.isUserVoteCounterVisible).toBe(true);
  });

  it.each([
    ['voting is disabled', { votingEnabled: false }],
    ['retrospective mode is disabled', { retrospectiveMode: false }],
    ['phase is creation', { workflowPhase: 'CREATION' }],
    ['phase is results', { workflowPhase: 'RESULTS' }],
    ['phase is reveal', { workflowPhase: 'INTERACTION_REVEAL' }],
    ['no user is logged in', { user: null }]
  ])('is hidden when %s', (_label, overrides) => {
    useBoardContext.mockReturnValue({ ...baseContext, ...overrides });
    const { result } = renderHook(() => useVoteCounterVisibility());
    expect(result.current.isUserVoteCounterVisible).toBe(false);
  });
});
