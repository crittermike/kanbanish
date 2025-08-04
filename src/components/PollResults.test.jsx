import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import PollResults from './PollResults';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('PollResults Component', () => {
  const mockGetPollStats = vi.fn();

  const defaultMockContext = {
    getPollStats: mockGetPollStats
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  test('renders poll results header', () => {
    mockGetPollStats.mockReturnValue({
      average: 4.2,
      distribution: [0, 1, 2, 3, 1],
      totalVotes: 7
    });

    render(<PollResults />);

    expect(screen.getByText('Retrospective Effectiveness Results')).toBeInTheDocument();
    expect(screen.getByText('7 participants')).toBeInTheDocument();
  });

  test('displays overall score and effectiveness level', () => {
    mockGetPollStats.mockReturnValue({
      average: 4.2,
      distribution: [0, 1, 2, 3, 1],
      totalVotes: 7
    });

    render(<PollResults />);

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('Very Effective')).toBeInTheDocument();
  });

  test('shows vote distribution chart', () => {
    mockGetPollStats.mockReturnValue({
      average: 3.5,
      distribution: [1, 1, 2, 2, 1],
      totalVotes: 7
    });

    render(<PollResults />);

    expect(screen.getByText('Vote Distribution')).toBeInTheDocument();

    // Check that different chart elements exist using getAllByText for duplicate percentages
    expect(screen.getAllByText('(14.3%)')).toHaveLength(3); // 3 ratings have 14.3%
    expect(screen.getAllByText('(28.6%)')).toHaveLength(2); // 2 ratings have 28.6%
  });

  test('displays no votes message when no data', () => {
    mockGetPollStats.mockReturnValue({
      average: 0,
      distribution: [0, 0, 0, 0, 0],
      totalVotes: 0
    });

    render(<PollResults />);

    expect(screen.getByText('No votes have been submitted yet.')).toBeInTheDocument();
    expect(screen.getByText('Participants need to complete the poll phase first.')).toBeInTheDocument();
  });
});
