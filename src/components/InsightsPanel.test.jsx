import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { useBoardInsights } from '../hooks/useBoardInsights';
import InsightsPanel from './InsightsPanel';

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

// Mock useBoardInsights
vi.mock('../hooks/useBoardInsights', () => ({
  useBoardInsights: vi.fn()
}));

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn()
}));

const defaultMockContext = {
  columns: {},
  actionItems: {},
  activeUsers: 0
};

const emptyInsights = {
  stats: { totalCards: 0, totalVotes: 0, totalComments: 0, totalReactions: 0, uniqueAuthors: 0, totalGroups: 0 },
  columnDistribution: [],
  themes: [],
  sentiment: { overall: 'neutral', score: 0 },
  topVotedCards: [],
  mostDiscussed: [],
  mostReacted: [],
  actionItemsSummary: { total: 0, open: 0, done: 0, overdue: 0, completionRate: 0 },
  engagementScore: 0,
  engagementFactors: {},
  summary: '',
  isEmpty: true
};

const populatedInsights = {
  stats: { totalCards: 10, totalVotes: 25, totalComments: 8, totalReactions: 15, uniqueAuthors: 4, totalGroups: 2 },
  columnDistribution: [
    { id: 'a_col1', title: 'Went Well', cardCount: 6, percentage: 60 },
    { id: 'b_col2', title: 'To Improve', cardCount: 4, percentage: 40 }
  ],
  themes: [
    { word: 'deployment', count: 4, type: 'word' },
    { word: 'code review', count: 3, type: 'phrase' }
  ],
  sentiment: { overall: 'positive', score: 0.7 },
  topVotedCards: [
    { id: 'c1', columnTitle: 'Went Well', content: 'Great teamwork this sprint on the deployment pipeline', votes: 8, commentCount: 3, reactionCount: 5 },
    { id: 'c2', columnTitle: 'To Improve', content: 'Need faster code reviews', votes: 6, commentCount: 2, reactionCount: 1 }
  ],
  mostDiscussed: [
    { id: 'c1', columnTitle: 'Went Well', content: 'Great teamwork this sprint on the deployment pipeline', commentCount: 3, votes: 8, reactionCount: 5 }
  ],
  mostReacted: [
    { id: 'c1', columnTitle: 'Went Well', content: 'Great teamwork this sprint on the deployment pipeline', reactionCount: 5, votes: 8, commentCount: 3 }
  ],
  actionItemsSummary: { total: 5, open: 3, done: 2, overdue: 1, completionRate: 40 },
  engagementScore: 72,
  engagementFactors: { votingActivity: 0.8, commentActivity: 0.5, reactionActivity: 0.6, groupingActivity: 0.3 },
  summary: 'This board has 10 cards across 2 columns with 25 total votes cast and 8 comments. Key themes include "deployment" and "code review". Overall sentiment is positive (70% positive).',
  isEmpty: false
};

describe('InsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  test('renders nothing when isOpen is false', () => {
    useBoardInsights.mockReturnValue(emptyInsights);
    const { container } = render(<InsightsPanel isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders the modal when isOpen is true', () => {
    useBoardInsights.mockReturnValue(emptyInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Board Insights')).toBeInTheDocument();
  });

  test('renders empty state when board has no data', () => {
    useBoardInsights.mockReturnValue(emptyInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Add some cards, votes, and comments to see insights.')).toBeInTheDocument();
  });

  test('renders overview stats when data exists', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalCards
    expect(screen.getByText('25')).toBeInTheDocument(); // totalVotes
    expect(screen.getByText('Total Cards')).toBeInTheDocument();
    expect(screen.getByText('Total Votes')).toBeInTheDocument();
  });

  test('renders summary text', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/This board has 10 cards/)).toBeInTheDocument();
  });

  test('renders engagement score', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  test('renders sentiment section', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.getByText('positive')).toBeInTheDocument();
  });

  test('renders column distribution', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Card Distribution')).toBeInTheDocument();
    expect(screen.getAllByText('Went Well').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('To Improve').length).toBeGreaterThanOrEqual(1);
  });

  test('renders themes cloud', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('deployment')).toBeInTheDocument();
    expect(screen.getByText('code review')).toBeInTheDocument();
  });

  test('renders most voted cards', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Most Voted')).toBeInTheDocument();
    expect(screen.getAllByText(/Great teamwork/).length).toBeGreaterThanOrEqual(1);
  });

  test('renders most discussed cards', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Most Discussed')).toBeInTheDocument();
  });

  test('renders most reacted cards', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Most Reacted')).toBeInTheDocument();
  });

  test('renders action items summary when present', () => {
    useBoardInsights.mockReturnValue(populatedInsights);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Action Items')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // open
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // done (also totalGroups, but that's in a different section)
  });

  test('does not render action items when total is 0', () => {
    const insightsNoActions = {
      ...populatedInsights,
      actionItemsSummary: { total: 0, open: 0, done: 0, overdue: 0, completionRate: 0 }
    };
    useBoardInsights.mockReturnValue(insightsNoActions);
    render(<InsightsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Action Items')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
    const { fireEvent } = await import('@testing-library/react');
    useBoardInsights.mockReturnValue(emptyInsights);
    const onClose = vi.fn();
    render(<InsightsPanel isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close insights panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
