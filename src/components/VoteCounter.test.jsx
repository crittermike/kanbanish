import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import VoteCounter from './VoteCounter';

vi.mock('../context/BoardContext');

describe('VoteCounter', () => {
  const mockUser = { uid: 'user123' };
  const mockGetUserVoteCount = vi.fn();
  const baseContext = {
    user: mockUser,
    votesPerUser: 5,
    getUserVoteCount: mockGetUserVoteCount,
    workflowPhase: 'INTERACTIONS',
    retrospectiveMode: true,
    votingEnabled: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(baseContext);
  });

  it("shows the current user's remaining votes", () => {
    mockGetUserVoteCount.mockReturnValue(3);
    render(<VoteCounter />);
    expect(screen.getByTestId('vote-counter')).toHaveTextContent('2 votes left');
    expect(mockGetUserVoteCount).toHaveBeenCalledWith('user123');
  });

  it('uses singular wording for one vote', () => {
    mockGetUserVoteCount.mockReturnValue(4);
    render(<VoteCounter />);
    expect(screen.getByTestId('vote-counter')).toHaveTextContent('1 vote left');
  });

  it('shows depleted state when no votes remaining', () => {
    mockGetUserVoteCount.mockReturnValue(5);
    render(<VoteCounter />);
    expect(screen.getByText('0')).toHaveClass('vote-counter-depleted');
  });

  it('prevents negative remaining votes', () => {
    mockGetUserVoteCount.mockReturnValue(7);
    render(<VoteCounter />);
    expect(screen.getByTestId('vote-counter')).toHaveTextContent('0 votes left');
  });

  it.each([
    ['voting is disabled', { votingEnabled: false }],
    ['user is not logged in', { user: null }],
    ['retrospective mode is disabled', { retrospectiveMode: false }],
    ['phase is not voting', { workflowPhase: 'RESULTS' }],
    ['phase is creation', { workflowPhase: 'CREATION' }],
    ['votes are unlimited', { votesPerUser: 0 }]
  ])('does not render when %s', (_label, overrides) => {
    mockGetUserVoteCount.mockReturnValue(0);
    useBoardContext.mockReturnValue({ ...baseContext, ...overrides });
    render(<VoteCounter />);
    expect(screen.queryByTestId('vote-counter')).not.toBeInTheDocument();
  });
});
