import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import InsightsContent from './InsightsContent';

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: () => ({
    columns: {},
    actionItems: {},
    activeUsers: []
  })
}));

// Mock useBoardInsights — overridden per-test as needed
const mockUseBoardInsights = vi.fn();
vi.mock('../hooks/useBoardInsights', () => ({
  useBoardInsights: (...args) => mockUseBoardInsights(...args)
}));

describe('InsightsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders empty state when isEmpty is true', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: {},
      columnDistribution: [],
      themes: [],
      sentiment: {},
      topVotedCards: [],
      topVotedGroups: [],
      mostDiscussed: [],
      mostReacted: [],
      actionItemsSummary: { total: 0 },
      engagementScore: 0,
      engagementFactors: {},
      summary: '',
      isEmpty: true
    });

    render(<InsightsContent />);

    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Add some cards, votes, and comments to see insights.')).toBeInTheDocument();
  });

  test('renders overview stats when data is available', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: { totalCards: 12, totalVotes: 34, totalComments: 8, totalReactions: 5, uniqueAuthors: 3, totalGroups: 2 },
      columnDistribution: [
        { id: 'a_1', title: 'To Do', cardCount: 5, percentage: 42 },
        { id: 'b_2', title: 'Done', cardCount: 7, percentage: 58 }
      ],
      themes: [{ word: 'performance', count: 4, type: 'word' }],
      sentiment: { overall: 'positive', score: 72 },
      topVotedCards: [{ id: 'c1', content: 'Improve API speed', votes: 10, columnTitle: 'To Do' }],
      topVotedGroups: [],
      mostDiscussed: [],
      mostReacted: [],
      actionItemsSummary: { total: 0 },
      engagementScore: 65,
      engagementFactors: { voteActivity: 0.8, commentActivity: 0.4 },
      summary: 'Board is focused on performance improvements.',
      isEmpty: false
    });

    render(<InsightsContent />);

    // Check stat values using specific selectors to avoid ambiguity
    const statValues = document.querySelectorAll('.insights-stat-value');
    const statTexts = Array.from(statValues).map(el => el.textContent);
    expect(statTexts).toEqual(['12', '34', '8', '5', '3', '2']);

    // Summary
    expect(screen.getByText('Board is focused on performance improvements.')).toBeInTheDocument();

    // Engagement
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument(); // engagement score

    // Sentiment
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.getByText('positive')).toBeInTheDocument();

    // Column distribution
    expect(screen.getByText('Card Distribution')).toBeInTheDocument();
    expect(screen.getAllByText('To Do').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);

    // Themes
    expect(screen.getByText('performance')).toBeInTheDocument();

    // Top voted
    expect(screen.getByText(/Improve API speed/)).toBeInTheDocument();
  });

  test('renders action items summary when present', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: { totalCards: 5 },
      columnDistribution: [],
      themes: [],
      sentiment: { overall: 'neutral', score: 50 },
      topVotedCards: [],
      topVotedGroups: [],
      mostDiscussed: [],
      mostReacted: [],
      actionItemsSummary: { total: 4, open: 2, done: 1, overdue: 1, completionRate: 25 },
      engagementScore: 40,
      engagementFactors: {},
      summary: '',
      isEmpty: false
    });

    render(<InsightsContent />);

    expect(screen.getByText('Action Items')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('does not render action items section when total is 0', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: { totalCards: 3 },
      columnDistribution: [],
      themes: [],
      sentiment: { overall: 'neutral', score: 50 },
      topVotedCards: [],
      topVotedGroups: [],
      mostDiscussed: [],
      mostReacted: [],
      actionItemsSummary: { total: 0 },
      engagementScore: 30,
      engagementFactors: {},
      summary: '',
      isEmpty: false
    });

    render(<InsightsContent />);

    expect(screen.queryByText('Action Items')).not.toBeInTheDocument();
  });

  test('renders most discussed and most reacted sections when data exists', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: { totalCards: 5, totalComments: 10, totalReactions: 8 },
      columnDistribution: [],
      themes: [],
      sentiment: { overall: 'positive', score: 70 },
      topVotedCards: [],
      topVotedGroups: [],
      mostDiscussed: [{ id: 'd1', content: 'Discuss deployment strategy', commentCount: 5, columnTitle: 'In Progress' }],
      mostReacted: [{ id: 'r1', content: 'Great team work', reactionCount: 6, columnTitle: 'Done' }],
      actionItemsSummary: { total: 0 },
      engagementScore: 50,
      engagementFactors: {},
      summary: '',
      isEmpty: false
    });

    render(<InsightsContent />);

    expect(screen.getByText('Most Discussed')).toBeInTheDocument();
    expect(screen.getByText(/Discuss deployment strategy/)).toBeInTheDocument();
    expect(screen.getByText('Most Reacted')).toBeInTheDocument();
    expect(screen.getByText(/Great team work/)).toBeInTheDocument();
  });

  test('renders engagement progressbar with correct aria attributes', () => {
    mockUseBoardInsights.mockReturnValue({
      stats: { totalCards: 5 },
      columnDistribution: [],
      themes: [],
      sentiment: { overall: 'neutral', score: 50 },
      topVotedCards: [],
      topVotedGroups: [],
      mostDiscussed: [],
      mostReacted: [],
      actionItemsSummary: { total: 0 },
      engagementScore: 78,
      engagementFactors: {},
      summary: '',
      isEmpty: false
    });

    render(<InsightsContent />);

    const progressbar = screen.getAllByRole('progressbar')[0];
    expect(progressbar).toHaveAttribute('aria-valuenow', '78');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });
});
