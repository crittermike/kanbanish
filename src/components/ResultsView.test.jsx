import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import ResultsView from './ResultsView';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

vi.mock('./Card', () => ({
  default: ({ cardId, columnId, cardData, onExpandCard }) => (
    <button onClick={() => onExpandCard(cardId, columnId)}>{cardData.content}</button>
  )
}));

vi.mock('./CardGroup', () => ({
  default: ({ groupData, columnId, onExpandCard }) => (
    <button onClick={() => onExpandCard(groupData.cardIds[0], columnId)}>{groupData.name}</button>
  )
}));

describe('ResultsView', () => {
  const baseContext = {
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

    fireEvent.click(screen.getByRole('button', { name: 'Highest vote card' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Cluster' }));

    expect(onExpandCard).toHaveBeenCalledWith('card-2', 'col-2', {
      cardList: [
        { cardId: 'card-2', columnId: 'col-2' },
        { cardId: 'card-3', columnId: 'col-2' }
      ],
      contextLabel: 'Retro review'
    });
  });

  it('shows only navigation and the current item', () => {
    useBoardContext.mockReturnValue(baseContext);

    render(<ResultsView onExpandCard={vi.fn()} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /timer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /detail/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Highest vote card' })).toBeInTheDocument();
    expect(screen.queryByText('Cluster')).not.toBeInTheDocument();
  });

  it('navigates results with the arrow keys', () => {
    const navigateResults = vi.fn();
    useBoardContext.mockReturnValue({ ...baseContext, navigateResults });

    render(<ResultsView onExpandCard={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    expect(navigateResults).toHaveBeenNthCalledWith(1, 'next');
    expect(navigateResults).toHaveBeenNthCalledWith(2, 'prev');
  });

  it('ignores arrow keys while typing in an input', () => {
    const navigateResults = vi.fn();
    useBoardContext.mockReturnValue({ ...baseContext, navigateResults });

    render(
      <>
        <input aria-label="typing" />
        <ResultsView onExpandCard={vi.fn()} />
      </>
    );

    fireEvent.keyDown(screen.getByLabelText('typing'), { key: 'ArrowRight' });

    expect(navigateResults).not.toHaveBeenCalled();
  });
});
