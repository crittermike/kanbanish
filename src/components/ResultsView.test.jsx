import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import ResultsView from './ResultsView';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

vi.mock('./Card', () => ({
  default: ({ cardData }) => <div>{cardData.content}</div>
}));

vi.mock('./CardGroup', () => ({
  default: ({ groupData }) => <div>{groupData.name}</div>
}));

vi.mock('./CardTimerControls', () => ({
  default: ({ cardId }) => <div data-testid="result-timer-controls">Timer for {cardId}</div>
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

  it('opens the current card in detail view using results-order navigation', () => {
    const onExpandCard = vi.fn();

    useBoardContext.mockReturnValue(baseContext);

    render(<ResultsView onExpandCard={onExpandCard} />);

    fireEvent.click(screen.getByRole('button', { name: /open detail view/i }));

    expect(onExpandCard).toHaveBeenCalledWith('card-1', 'col-1', {
      cardList: [
        { cardId: 'card-1', columnId: 'col-1' },
        { cardId: 'card-2', columnId: 'col-2' },
        { cardId: 'card-3', columnId: 'col-2' }
      ],
      contextLabel: 'Retro review'
    });
  });

  it('opens the first card in the current group for detailed review', () => {
    const onExpandCard = vi.fn();

    useBoardContext.mockReturnValue({
      ...baseContext,
      getSortedItemsForResults: () => ([
        {
          type: 'group',
          id: 'group-1',
          columnId: 'col-2',
          votes: 4,
          data: { name: 'Cluster', cardIds: ['card-2', 'card-3'] }
        }
      ]),
      columns: {
        'col-2': {
          title: 'Ideas',
          cards: {
            'card-2': { content: 'First grouped card' },
            'card-3': { content: 'Second grouped card' }
          }
        }
      },
      getTotalVotes: () => 4
    });

    render(<ResultsView onExpandCard={onExpandCard} />);

    fireEvent.click(screen.getByRole('button', { name: /review cards in detail/i }));

    expect(onExpandCard).toHaveBeenCalledWith('card-2', 'col-2', {
      cardList: [
        { cardId: 'card-2', columnId: 'col-2' },
        { cardId: 'card-3', columnId: 'col-2' }
      ],
      contextLabel: 'Retro review'
    });
  });

  it('shows a regular timer button and removes the old helper copy', () => {
    useBoardContext.mockReturnValue(baseContext);

    render(<ResultsView onExpandCard={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Timer' })).toBeInTheDocument();
    expect(screen.queryByText(/use the detail view timer while you walk through each item/i)).not.toBeInTheDocument();
  });

  it('toggles inline timer controls for the current result card', () => {
    useBoardContext.mockReturnValue(baseContext);

    render(<ResultsView onExpandCard={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Timer' }));

    expect(screen.getByTestId('result-timer-controls')).toHaveTextContent('Timer for card-1');
    expect(screen.getByRole('button', { name: 'Hide timer' })).toBeInTheDocument();
  });
});
