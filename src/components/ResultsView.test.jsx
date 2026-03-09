import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import ResultsView from './ResultsView';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

vi.mock('./modals/CardDetailModal', () => ({
  default: ({ cardId, inline, contextLabel }) => (
    <div data-testid="card-detail-inline" data-card-id={cardId} data-inline={inline} data-context={contextLabel}>
      Inline card detail for {cardId}
    </div>
  )
}));

describe('ResultsView', () => {
  const baseContext = {
    boardId: 'board-1',
    user: { uid: 'user-1' },
    workflowPhase: 'RESULTS',
    resultsViewIndex: 0,
    navigateResults: vi.fn(),
    getSortedItemsForResults: () => ([
      {
        type: 'card',
        id: 'card-1',
        columnId: 'col-1',
        votes: 5,
        data: { content: 'Highest vote card' }
      },
      {
        type: 'group',
        id: 'group-1',
        columnId: 'col-2',
        votes: 4,
        data: { name: 'Cluster', cardIds: ['card-2', 'card-3'] }
      }
    ]),
    columns: {
      'col-1': {
        title: 'Went well',
        cards: {
          'card-1': { content: 'Highest vote card' }
        }
      },
      'col-2': {
        title: 'Ideas',
        cards: {
          'card-2': { content: 'First grouped card' },
          'card-3': { content: 'Second grouped card' }
        }
      }
    },
    getTotalVotes: () => 9
  };

  it('renders inline card detail for the current result item', () => {
    useBoardContext.mockReturnValue(baseContext);
    render(<ResultsView />);

    const detail = screen.getByTestId('card-detail-inline');
    expect(detail).toHaveAttribute('data-card-id', 'card-1');
    expect(detail).toHaveAttribute('data-inline', 'true');
    expect(detail).toHaveAttribute('data-context', 'Retro review');
  });

  it('shows vote metadata for the current item', () => {
    useBoardContext.mockReturnValue(baseContext);
    render(<ResultsView />);

    expect(screen.getByText('5 out of 9 total votes')).toBeInTheDocument();
    expect(screen.getByText('from Went well')).toBeInTheDocument();
  });

  it('uses first card in group for inline detail', () => {
    useBoardContext.mockReturnValue({
      ...baseContext,
      resultsViewIndex: 1
    });
    render(<ResultsView />);

    const detail = screen.getByTestId('card-detail-inline');
    expect(detail).toHaveAttribute('data-card-id', 'card-2');
  });

  it('shows navigation controls', () => {
    useBoardContext.mockReturnValue(baseContext);
    render(<ResultsView />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
