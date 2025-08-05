import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import VoteCounter from './VoteCounter';

// Mock the BoardContext
vi.mock('../context/BoardContext');

describe('VoteCounter', () => {
  const mockUser = { uid: 'user123' };
  const mockGetUserVoteCount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue({
      user: mockUser,
      votesPerUser: 5,
      getUserVoteCount: mockGetUserVoteCount,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });
  });

  it('displays remaining votes correctly', () => {
    mockGetUserVoteCount.mockReturnValue(2);

    render(<VoteCounter />);

    expect(screen.getByText('Your votes remaining:')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('shows depleted state when no votes remaining', () => {
    mockGetUserVoteCount.mockReturnValue(5);

    render(<VoteCounter />);

    const voteValue = screen.getByText('0/5');
    expect(voteValue).toHaveClass('vote-counter-depleted');
  });

  it('does not render when voting is disabled', () => {
    useBoardContext.mockReturnValue({
      user: mockUser,
      votesPerUser: 5,
      getUserVoteCount: mockGetUserVoteCount,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: false
    });

    render(<VoteCounter />);

    expect(screen.queryByText('Your votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when user is not logged in', () => {
    useBoardContext.mockReturnValue({
      user: null,
      votesPerUser: 5,
      getUserVoteCount: mockGetUserVoteCount,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<VoteCounter />);

    expect(screen.queryByText('Your votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when interactions are not visible', () => {
    useBoardContext.mockReturnValue({
      user: mockUser,
      votesPerUser: 5,
      getUserVoteCount: mockGetUserVoteCount,
      workflowPhase: 'CREATION',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<VoteCounter />);

    expect(screen.queryByText('Your votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when retrospective mode is disabled', () => {
    useBoardContext.mockReturnValue({
      user: mockUser,
      votesPerUser: 5,
      getUserVoteCount: mockGetUserVoteCount,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: false,
      votingEnabled: true
    });

    render(<VoteCounter />);

    expect(screen.queryByText('Your votes remaining:')).not.toBeInTheDocument();
  });

  it('handles zero used votes correctly', () => {
    mockGetUserVoteCount.mockReturnValue(0);

    render(<VoteCounter />);

    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('prevents negative remaining votes', () => {
    // Edge case where user somehow has more votes than allowed
    mockGetUserVoteCount.mockReturnValue(7);

    render(<VoteCounter />);

    expect(screen.getByText('0/5')).toBeInTheDocument();
  });
});
