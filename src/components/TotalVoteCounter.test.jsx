import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import TotalVoteCounter from './TotalVoteCounter';

// Mock the BoardContext
vi.mock('../context/BoardContext');

describe('TotalVoteCounter', () => {
  const mockGetTotalVotesRemaining = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue({
      votesPerUser: 5,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 3,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });
  });

  it('displays total remaining votes correctly', () => {
    mockGetTotalVotesRemaining.mockReturnValue(10);

    render(<TotalVoteCounter />);

    expect(screen.getByText('Total votes remaining:')).toBeInTheDocument();
    expect(screen.getByText('10/15')).toBeInTheDocument(); // 10 remaining out of 15 total (3 users × 5 votes)
  });

  it('shows depleted state when no votes remaining', () => {
    mockGetTotalVotesRemaining.mockReturnValue(0);

    render(<TotalVoteCounter />);

    const voteValue = screen.getByText('0/15');
    expect(voteValue).toHaveClass('total-vote-counter-depleted');
  });

  it('does not render when voting is disabled', () => {
    useBoardContext.mockReturnValue({
      votesPerUser: 5,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 3,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: false
    });

    render(<TotalVoteCounter />);

    expect(screen.queryByText('Total votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when no active users', () => {
    useBoardContext.mockReturnValue({
      votesPerUser: 5,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 0,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<TotalVoteCounter />);

    expect(screen.queryByText('Total votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when interactions are not visible', () => {
    useBoardContext.mockReturnValue({
      votesPerUser: 5,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 3,
      workflowPhase: 'CREATION',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<TotalVoteCounter />);

    expect(screen.queryByText('Total votes remaining:')).not.toBeInTheDocument();
  });

  it('does not render when retrospective mode is disabled', () => {
    useBoardContext.mockReturnValue({
      votesPerUser: 5,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 3,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: false,
      votingEnabled: true
    });

    render(<TotalVoteCounter />);

    expect(screen.queryByText('Total votes remaining:')).not.toBeInTheDocument();
  });

  it('calculates total possible votes correctly', () => {
    mockGetTotalVotesRemaining.mockReturnValue(8);
    
    useBoardContext.mockReturnValue({
      votesPerUser: 4,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 2,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<TotalVoteCounter />);

    expect(screen.getByText('8/8')).toBeInTheDocument(); // 2 users × 4 votes = 8 total
  });

  it('handles edge case with single user', () => {
    mockGetTotalVotesRemaining.mockReturnValue(3);
    
    useBoardContext.mockReturnValue({
      votesPerUser: 3,
      getTotalVotesRemaining: mockGetTotalVotesRemaining,
      activeUsers: 1,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true,
      votingEnabled: true
    });

    render(<TotalVoteCounter />);

    expect(screen.getByText('3/3')).toBeInTheDocument(); // 1 user × 3 votes = 3 total
  });
});
