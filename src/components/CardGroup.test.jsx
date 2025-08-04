import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import CardGroup from './CardGroup';

// Mock react-dnd
vi.mock('react-dnd', () => ({
  useDrop: vi.fn().mockReturnValue([{ isOver: false }, vi.fn()])
}));

// Mock Card component
vi.mock('./Card', () => ({
  default: ({ cardData }) => (
    <div data-testid="card-content">{cardData.content}</div>
  )
}));

// Mock VotingControls component
vi.mock('./VotingControls', () => ({
  default: ({ votes, onUpvote, onDownvote, showDownvoteButton }) => (
    <div className="votes">
      <button title="Upvote" onClick={onUpvote}>+</button>
      <span>{votes}</span>
      {showDownvoteButton && <button title="Downvote" onClick={onDownvote}>-</button>}
    </div>
  )
}));

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('CardGroup Component', () => {
  const mockGroupData = {
    name: 'Test Group',
    expanded: true,
    created: Date.now(),
    cardIds: ['card1', 'card2'] // New structure: just store card IDs
  };

  const mockColumnData = {
    cards: {
      'card1': {
        content: 'First card',
        votes: 3,
        created: Date.now() - 1000,
        groupId: 'group123'
      },
      'card2': {
        content: 'Second card',
        votes: 1,
        created: Date.now(),
        groupId: 'group123'
      }
    }
  };

  const mockProps = {
    groupId: 'group123',
    groupData: mockGroupData,
    columnId: 'column1',
    columnData: mockColumnData, // Add columnData
    showNotification: vi.fn(),
    sortByVotes: false
  };

  const mockBoardContext = {
    user: { uid: 'user1', displayName: 'Test User' },
    boardId: 'test-board-123',
    retrospectiveMode: true,
    workflowPhase: 'GROUPING',
    updateGroupName: vi.fn(),
    deleteGroup: vi.fn(),
    ungroupCards: vi.fn(),
    upvoteGroup: vi.fn(),
    downvoteGroup: vi.fn(),
    moveCard: vi.fn(),
    addCardToGroup: vi.fn(),
    removeCardFromGroup: vi.fn(),
    moveCardWithinGroup: vi.fn(),
    moveCardBetweenGroups: vi.fn(),
    votingEnabled: true,
    downvotingEnabled: true
  };  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(mockBoardContext);
  });

  test('renders group with correct name and card count', () => {
    render(<CardGroup {...mockProps} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('2 cards')).toBeInTheDocument();
  });

  test('shows cards when expanded', () => {
    render(<CardGroup {...mockProps} />);

    expect(screen.getByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Second card')).toBeInTheDocument();
  });

  test('shows card previews when collapsed', () => {
    const collapsedGroupData = { ...mockGroupData, expanded: false };
    render(<CardGroup {...mockProps} groupData={collapsedGroupData} />);

    // Only the first card should show in preview mode (single card with stacking effect)
    expect(screen.getByText(/First card/)).toBeInTheDocument();
    
    // The second card should NOT be visible in preview mode
    expect(screen.queryByText(/Second card/)).not.toBeInTheDocument();

    // But the full card components (with testid) should not be present
    expect(screen.queryByTestId('card-content')).not.toBeInTheDocument();
  });

  test('toggles expanded state when header is clicked', () => {
    render(<CardGroup {...mockProps} />);

    const header = screen.getByRole('heading', { name: 'Test Group' }).closest('.card-group-header');

    // Initially expanded, cards should be visible
    expect(screen.getByText('First card')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(header);

    // Cards should be hidden (test the preview mode instead)
    expect(screen.queryByTestId('card-content')).not.toBeInTheDocument();
  });

  test('handles group name editing', async () => {
    render(<CardGroup {...mockProps} />);

    const groupName = screen.getByText('Test Group');

    // Click to edit
    fireEvent.click(groupName);

    const input = screen.getByDisplayValue('Test Group');
    expect(input).toBeInTheDocument();

    // Change the name
    fireEvent.change(input, { target: { value: 'Updated Group Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockBoardContext.updateGroupName).toHaveBeenCalledWith(
        'column1',
        'group123',
        'Updated Group Name'
      );
    });
  });

  test('handles ungrouping', async () => {
    // Mock window.confirm to return true
    window.confirm = vi.fn().mockReturnValue(true);

    // Override context for interactions phase
    const interactionsContext = { ...mockBoardContext, workflowPhase: 'INTERACTIONS' };
    useBoardContext.mockReturnValue(interactionsContext);

    render(<CardGroup {...mockProps} />);

    const ungroupButton = screen.getByTitle('Ungroup cards');
    fireEvent.click(ungroupButton);

    await waitFor(() => {
      expect(mockBoardContext.ungroupCards).toHaveBeenCalledWith('column1', 'group123');
    });
  });

  test('shows empty state when no cards in group', () => {
    const emptyGroupData = { ...mockGroupData, cardIds: [] };
    render(<CardGroup {...mockProps} groupData={emptyGroupData} />);

    expect(screen.getByText('No cards in this group')).toBeInTheDocument();
    expect(screen.getByText('Drag cards here to add them')).toBeInTheDocument();
  });

  test('sorts cards by votes when sortByVotes is true', () => {
    render(<CardGroup {...mockProps} sortByVotes={true} />);

    const cards = screen.getAllByTestId('card-content');
    // First card should have higher votes (3) and appear first
    expect(cards[0]).toHaveTextContent('First card');
    expect(cards[1]).toHaveTextContent('Second card');
  });

  test('shows voting controls for groups when voting is enabled', () => {
    // Override context for interactions phase
    const interactionsContext = { ...mockBoardContext, workflowPhase: 'INTERACTIONS' };
    useBoardContext.mockReturnValue(interactionsContext);

    const groupDataWithVotes = {
      ...mockGroupData,
      votes: 5,
      voters: { 'user1': 5 } // Add voter data for the test user
    };
    render(<CardGroup {...mockProps} groupData={groupDataWithVotes} />);

    // Should show vote count
    expect(screen.getByText('5')).toBeInTheDocument();

    // Should show upvote and downvote buttons
    const voteButtons = screen.getAllByRole('button');
    const upvoteButton = voteButtons.find(button => button.title === 'Upvote');
    const downvoteButton = voteButtons.find(button => button.title === 'Downvote');

    expect(upvoteButton).toBeInTheDocument();
    expect(downvoteButton).toBeInTheDocument();
  });

  test('calls upvoteGroup when upvote button is clicked', () => {
    // Override context for interactions phase
    const interactionsContext = { ...mockBoardContext, workflowPhase: 'INTERACTIONS' };
    useBoardContext.mockReturnValue(interactionsContext);

    const groupDataWithVotes = { ...mockGroupData, votes: 3 };
    render(<CardGroup {...mockProps} groupData={groupDataWithVotes} />);

    const voteButtons = screen.getAllByRole('button');
    const upvoteButton = voteButtons.find(button => button.title === 'Upvote');

    fireEvent.click(upvoteButton);

    expect(mockBoardContext.upvoteGroup).toHaveBeenCalledWith(
      'column1',
      'group123',
      3,
      mockProps.showNotification
    );
  });

  test('hides voting controls when voting is disabled', () => {
    const contextWithoutVoting = { ...mockBoardContext, votingEnabled: false };
    useBoardContext.mockReturnValue(contextWithoutVoting);

    const groupDataWithVotes = { ...mockGroupData, votes: 5 };
    render(<CardGroup {...mockProps} groupData={groupDataWithVotes} />);

    // Should not show vote count in voting controls
    const voteButtons = screen.getAllByRole('button');
    const upvoteButton = voteButtons.find(button => button.title === 'Upvote');

    expect(upvoteButton).toBeUndefined();
  });

  test('handles moving card from one group to another without duplication', async () => {
    const { useDrop } = await import('react-dnd');

    // Mock a card being dragged from another group
    const draggedCard = {
      cardId: 'card3',
      columnId: 'column1',
      groupId: 'other-group',
      cardData: { content: 'Dragged card', groupId: 'other-group' }
    };

    // Mock useDrop to simulate dropping a card from another group
    useDrop.mockReturnValueOnce([
      { isOver: false },
      vi.fn().mockImplementation(ref => {
        // Simulate the drop event
        const dropHandlers = useDrop.mock.calls[useDrop.mock.calls.length - 1][0];
        dropHandlers().drop(draggedCard);
        return ref;
      })
    ]);

    render(<CardGroup {...mockProps} />);

    // Verify that moveCard was called correctly to move from other-group to this group
    await waitFor(() => {
      expect(mockBoardContext.moveCard).toHaveBeenCalledWith(
        'card3', // cardId
        'column1', // sourceColumnId (same column)
        'column1', // targetColumnId (same column)
        'group123' // targetGroupId (this group)
      );
    });

    // Verify success notification
    expect(mockProps.showNotification).toHaveBeenCalledWith('Card added to group');
  });

  test('handles moving card from different column to group', async () => {
    const { useDrop } = await import('react-dnd');

    // Mock a card being dragged from a different column
    const draggedCard = {
      cardId: 'card4',
      columnId: 'column2', // Different column
      groupId: null,
      cardData: { content: 'Card from another column' }
    };

    // Mock useDrop to simulate dropping a card from another column
    useDrop.mockReturnValueOnce([
      { isOver: false },
      vi.fn().mockImplementation(ref => {
        // Simulate the drop event
        const dropHandlers = useDrop.mock.calls[useDrop.mock.calls.length - 1][0];
        dropHandlers().drop(draggedCard);
        return ref;
      })
    ]);

    render(<CardGroup {...mockProps} />);

    // Verify that moveCard was called correctly to move from column2 to this group in column1
    await waitFor(() => {
      expect(mockBoardContext.moveCard).toHaveBeenCalledWith(
        'card4', // cardId
        'column2', // sourceColumnId (different column)
        'column1', // targetColumnId (this group's column)
        'group123' // targetGroupId (this group)
      );
    });

    // Verify success notification
    expect(mockProps.showNotification).toHaveBeenCalledWith('Card added to group');
  });
});
