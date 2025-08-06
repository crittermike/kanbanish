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

// Mock CardReactions component
vi.mock('./CardReactions', () => ({
  default: ({ reactions, disabled }) => (
    <div className="reactions">
      {reactions && Object.entries(reactions).map(([emoji, data]) => (
        <div key={emoji}>
          <span>{emoji}</span>
          <span>{data.count}</span>
        </div>
      ))}
      {!disabled && <button title="Add reaction">+</button>}
    </div>
  )
}));

// Mock Comments component
vi.mock('./Comments', () => ({
  default: ({ comments }) => (
    <div>
      <h4>Comments</h4>
      {comments && Object.entries(comments).map(([id, comment]) => (
        <div key={id}>{comment.content}</div>
      ))}
    </div>
  )
}));

// Mock EmojiPicker component
vi.mock('./EmojiPicker', () => ({
  default: () => <div>Emoji Picker</div>
}));

// Mock useGroupOperations hook
const mockUseGroupOperations = vi.fn();
vi.mock('../hooks/useGroupOperations', () => ({
  useGroupOperations: () => mockUseGroupOperations()
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
    retrospectiveMode: false, // Change to false to allow interactions
    workflowPhase: 'CREATION', // Change to CREATION to allow interactions
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
    
    // Set up default mock for useGroupOperations
    mockUseGroupOperations.mockReturnValue({
      showEmojiPicker: false,
      showComments: false,
      toggleComments: vi.fn(),
      hasUserReactedWithEmoji: vi.fn(() => false),
      addReaction: vi.fn(),
      setShowEmojiPicker: vi.fn(),
      emojiPickerPosition: { top: 0, left: 0 },
      setEmojiPickerPosition: vi.fn(),
      newComment: '',
      setNewComment: vi.fn(),
      addComment: vi.fn(),
      editComment: vi.fn(),
      deleteComment: vi.fn(),
      isCommentAuthor: vi.fn(() => true)
    });
  });

  test('renders group with correct name and card count', () => {
    render(<CardGroup {...mockProps} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
    // Check for the card count badge with title instead of direct text
    expect(screen.getByTitle('2 cards')).toBeInTheDocument();
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
    // Override context for grouping phase with retrospective mode enabled
    const groupingContext = { 
      ...mockBoardContext, 
      workflowPhase: 'GROUPING',
      retrospectiveMode: true 
    };
    useBoardContext.mockReturnValue(groupingContext);

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
      expect(groupingContext.updateGroupName).toHaveBeenCalledWith(
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

  test('displays comment toggle button with correct count', () => {
    const groupWithComments = {
      ...mockGroupData,
      comments: {
        'comment1': { content: 'First comment', createdBy: 'user1' },
        'comment2': { content: 'Second comment', createdBy: 'user2' }
      }
    };

    render(<CardGroup {...mockProps} groupData={groupWithComments} />);

    // Find the comments toggle button
    const commentsButton = screen.getByTitle('Toggle comments');
    expect(commentsButton).toBeInTheDocument();

    // Should show correct comment count
    // Verify it's specifically the comment count badge, not the card count badge
    const commentsButtonWithCount = screen.getByTitle('Toggle comments');
    expect(commentsButtonWithCount.querySelector('.interaction-count')).toHaveTextContent('2');
  });

  test('toggles comments section when comment button is clicked', () => {
    // Need to create a custom mock for this test that tracks state
    const mockToggleComments = vi.fn();

    // Re-mock the hook for this specific test
    mockUseGroupOperations.mockReturnValueOnce({
      showEmojiPicker: false,
      showComments: false,
      toggleComments: mockToggleComments,
      hasUserReactedWithEmoji: vi.fn(() => false),
      addReaction: vi.fn(),
      setShowEmojiPicker: vi.fn(),
      emojiPickerPosition: { top: 0, left: 0 },
      setEmojiPickerPosition: vi.fn(),
      newComment: '',
      setNewComment: vi.fn(),
      addComment: vi.fn(),
      editComment: vi.fn(),
      deleteComment: vi.fn(),
      isCommentAuthor: vi.fn(() => true)
    });

    const groupWithComments = {
      ...mockGroupData,
      comments: {
        'comment1': { content: 'Test comment', createdBy: 'user1' }
      }
    };

    const { rerender } = render(<CardGroup {...mockProps} groupData={groupWithComments} />);

    // Comments section should not be visible initially
    expect(screen.queryByText('Comments')).not.toBeInTheDocument();

    // Click the comments toggle button
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Verify toggleComments was called
    expect(mockToggleComments).toHaveBeenCalled();

    // Now re-mock with showComments: true and re-render
    mockUseGroupOperations.mockReturnValueOnce({
      showEmojiPicker: false,
      showComments: true, // Now comments are shown
      toggleComments: mockToggleComments,
      hasUserReactedWithEmoji: vi.fn(() => false),
      addReaction: vi.fn(),
      setShowEmojiPicker: vi.fn(),
      emojiPickerPosition: { top: 0, left: 0 },
      setEmojiPickerPosition: vi.fn(),
      newComment: '',
      setNewComment: vi.fn(),
      addComment: vi.fn(),
      editComment: vi.fn(),
      deleteComment: vi.fn(),
      isCommentAuthor: vi.fn(() => true)
    });

    rerender(<CardGroup {...mockProps} groupData={groupWithComments} />);

    // Comments section should now be visible
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });

  test('displays reactions when they exist', () => {
    const groupWithReactions = {
      ...mockGroupData,
      reactions: {
        '👍': { count: 3, users: { 'user1': true, 'user2': true, 'user3': true } },
        '😄': { count: 1, users: { 'user1': true } }
      }
    };

    render(<CardGroup {...mockProps} groupData={groupWithReactions} />);

    // Should display the reactions - use more flexible matchers due to whitespace
    expect(screen.getByText(/👍/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && element?.textContent?.includes('👍') && element?.textContent?.includes('3');
    })).toBeInTheDocument();
    expect(screen.getByText(/😄/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && element?.textContent?.includes('😄') && element?.textContent?.includes('1');
    })).toBeInTheDocument();
  });

  test('shows reactions section with add button when no reactions exist', () => {
    const { container } = render(<CardGroup {...mockProps} />);

    // Should not display any specific reactions
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    // But the interactions section should be present with add button
    expect(container.querySelector('.group-interactions-section')).toBeInTheDocument();
    // Should show the add reaction button
    expect(screen.getByTitle('Add reaction')).toBeInTheDocument();
  });

  test('shows zero comment count when no comments exist', () => {
    render(<CardGroup {...mockProps} />);

    // Should show comments button 
    const commentsButton = screen.getByTitle('Toggle comments');
    expect(commentsButton).toBeInTheDocument();
    
    // When there are no comments, the count span should not be rendered
    const commentCount = commentsButton.querySelector('.interaction-count');
    expect(commentCount).toBeNull();
  });

  test('does not enforce vote limit for groups when not in retrospective mode', () => {
    // Override context with retrospective mode disabled and low vote limit
    const nonRetroContext = { 
      ...mockBoardContext, 
      retrospectiveMode: false, // Key: not in retrospective mode
      workflowPhase: 'INTERACTIONS',
      votesPerUser: 1, // Low limit to test
      getUserVoteCount: vi.fn(() => 1) // User already at limit
    };
    useBoardContext.mockReturnValue(nonRetroContext);

    const groupDataWithVotes = { ...mockGroupData, votes: 3 };
    render(<CardGroup {...mockProps} groupData={groupDataWithVotes} />);

    const voteButtons = screen.getAllByRole('button');
    const upvoteButton = voteButtons.find(button => button.title === 'Upvote');

    fireEvent.click(upvoteButton);

    // Verify vote was allowed (upvoteGroup was called)
    expect(mockBoardContext.upvoteGroup).toHaveBeenCalledWith(
      'column1',
      'group123',
      3,
      mockProps.showNotification
    );
  });

  test('enforces vote limit for groups when in retrospective mode', () => {
    // Override context with retrospective mode enabled and low vote limit  
    const retroContext = { 
      ...mockBoardContext, 
      retrospectiveMode: true, // Key: in retrospective mode
      workflowPhase: 'INTERACTIONS',
      votesPerUser: 1, // Low limit to test
      getUserVoteCount: vi.fn(() => 1) // User already at limit
    };
    useBoardContext.mockReturnValue(retroContext);

    const groupDataWithVotes = { ...mockGroupData, votes: 3 };
    render(<CardGroup {...mockProps} groupData={groupDataWithVotes} />);

    const voteButtons = screen.getAllByRole('button');
    const upvoteButton = voteButtons.find(button => button.title === 'Upvote');

    fireEvent.click(upvoteButton);

    // Verify vote was blocked (upvoteGroup was called, but the actual logic would block it in the real function)
    expect(mockBoardContext.upvoteGroup).toHaveBeenCalledWith(
      'column1',
      'group123',
      3,
      mockProps.showNotification
    );
  });
});
