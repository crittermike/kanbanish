import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ref, set, remove } from 'firebase/database';
import { useDrag } from 'react-dnd';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import { COMMON_EMOJIS } from '../utils/helpers';
import Card from './Card';

// Mock firebase and react-dnd
vi.mock('firebase/database', () => {
  const mockDatabase = {};
  return {
    ref: vi.fn(),
    set: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    getDatabase: vi.fn().mockReturnValue(mockDatabase)
  };
});

vi.mock('react-dnd', () => ({
  useDrag: vi.fn().mockReturnValue([{ isDragging: false }, vi.fn()]),
  useDrop: vi.fn().mockReturnValue([{ isOver: false }, vi.fn()])
}));

// Mock ReactDOM.createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: element => element,
  default: {
    createPortal: element => element
  }
}));

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('Card Component', () => {
  const mockCardData = {
    content: 'Test card content',
    votes: 5,
    reactions: {
      '👍': {
        count: 2,
        users: {
          'user123': true
        }
      }
    },
    comments: {
      'comment1': {
        content: 'Test comment',
        timestamp: 1618812345678
      }
    }
  };

  const mockProps = {
    cardId: 'card123',
    cardData: mockCardData,
    columnId: 'column1',
    showNotification: vi.fn()
  };

  const mockBoardContext = {
    boardId: 'board123',
    user: { uid: 'user123' },
    votingEnabled: true,
    downvotingEnabled: true,
    multipleVotesAllowed: false,
    workflowPhase: 'INTERACTIONS', // Allow interactions for testing
    retrospectiveMode: false // Allow editing for testing
  };

  beforeEach(() => {
    useBoardContext.mockReturnValue(mockBoardContext);
    window.confirm = vi.fn().mockImplementation(() => true); // Auto confirm any confirms
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders card content correctly', () => {
    render(<Card {...mockProps} />);

    expect(screen.getByText('Test card content')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Votes count
  });

  test('renders emoji reactions', () => {
    render(<Card {...mockProps} />);

    const emojiReaction = screen.getByText('👍');
    expect(emojiReaction).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Emoji reaction count
  });

  test('allows editing card content', async () => {
    render(<Card {...mockProps} />);

    // Click the card to enter edit mode
    fireEvent.click(screen.getByText('Test card content'));

    // Check if textarea appears
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Test card content');

    // Edit the text
    fireEvent.change(textarea, { target: { value: 'Updated card content' } });
    expect(textarea).toHaveValue('Updated card content');

    // Save changes
    fireEvent.click(screen.getByText('Save'));

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card saved');
    });
  });

  test('shows comments when comments button is clicked', () => {
    render(<Card {...mockProps} />);

    // Find and click the comments button
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Check if comments section appears
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });

  test('comments button has special styling when comments exist', () => {
    render(<Card {...mockProps} />);

    // Find the comments button
    const commentsButton = screen.getByTitle('Toggle comments');
    
    // Check that it has the 'has-comments' class when there are comments
    expect(commentsButton).toHaveClass('has-comments');
  });

  test('comments button does not have special styling when no comments exist', () => {
    const mockPropsNoComments = {
      ...mockProps,
      cardData: {
        ...mockProps.cardData,
        comments: {}
      }
    };
    
    render(<Card {...mockPropsNoComments} />);

    // Find the comments button
    const commentsButton = screen.getByTitle('Toggle comments');
    
    // Check that it does not have the 'has-comments' class when there are no comments
    expect(commentsButton).not.toHaveClass('has-comments');
  });

  test('allows adding upvotes', async () => {
    render(<Card {...mockProps} />);

    // Find and click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('votes'));
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Upvoted card');
    });
  });

  test('hides downvote button when downvotingEnabled is false', () => {
    // Override the mock for this specific test
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      downvotingEnabled: false
    });

    render(<Card {...mockProps} />);

    // Upvote button should be visible
    expect(screen.getByTitle('Upvote')).toBeInTheDocument();

    // Downvote button should not be visible
    expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
  });

  test('shows downvote button when the user has upvoted even if downvotingEnabled is false', () => {
    // Override the mock for this specific test
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      downvotingEnabled: false
    });

    // Set up card data with the user having upvoted
    const cardWithUserVotes = {
      ...mockCardData,
      voters: {
        'user123': 2 // User has 2 upvotes
      }
    };

    render(<Card {...mockProps} cardData={cardWithUserVotes} />);

    // Upvote button should be visible
    expect(screen.getByTitle('Upvote')).toBeInTheDocument();

    // Downvote button should be visible since user has upvoted
    expect(screen.getByTitle('Downvote')).toBeInTheDocument();
  });

  test('allows removing downvotes', async () => {
    // Use a modified card with user votes
    const cardWithUserVotes = {
      ...mockCardData,
      voters: {
        'user123': 2 // User has 2 upvotes
      }
    };

    render(<Card {...mockProps} cardData={cardWithUserVotes} />);

    // Find and click the downvote button
    const downvoteButton = screen.getByTitle('Downvote');
    fireEvent.click(downvoteButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('votes'));
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Vote removed');
    });
  });

  test('allows deleting the card', async () => {
    render(<Card {...mockProps} />);

    // Enter edit mode
    fireEvent.click(screen.getByText('Test card content'));

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card deleted');
    });
  });

  test('applies drag attributes to card element', () => {
    // Override the mock to simulate dragging
    useDrag.mockReturnValueOnce([{ isDragging: true }, vi.fn()]);

    render(<Card {...mockProps} />);

    // Check if the card div has the dragging class
    const cardElement = screen.getByText('Test card content').closest('.card');
    expect(cardElement).toHaveClass('dragging');
  });

  test('shows emoji picker when clicking the + icon', () => {
    render(<Card {...mockProps} />);

    // Find and click the add reaction button
    const addReactionButton = screen.getByTitle('Add reaction');
    fireEvent.click(addReactionButton);

    // Check if the emoji picker appears with emoji options
    const emojiPicker = screen.getByTestId('emoji-picker');
    expect(emojiPicker).toBeInTheDocument();

    // Check if emoji options are present
    const emojiOptions = screen.getAllByTestId('emoji-option');
    expect(emojiOptions.length).toBeGreaterThan(0);
  });

  test('allows adding and removing emoji reactions', async () => {
    // Start with a card that has no reactions
    const cardWithoutReactions = {
      ...mockCardData,
      reactions: {}
    };

    // Mock the set function to update the cardData
    set.mockImplementationOnce(() => {
      cardWithoutReactions.reactions = {
        [COMMON_EMOJIS[0]]: {
          count: 1,
          users: {
            [mockBoardContext.user.uid]: true
          }
        }
      };
      return Promise.resolve();
    });

    render(<Card {...mockProps} cardData={cardWithoutReactions} />);

    // Open emoji picker
    const addReactionButton = screen.getByTitle('Add reaction');
    fireEvent.click(addReactionButton);

    // Add a reaction
    const emojiOptions = screen.getAllByTestId('emoji-option');
    const firstEmoji = emojiOptions[0];
    const emojiText = firstEmoji.textContent;
    fireEvent.click(firstEmoji);

    // Verify reaction was added and wait for it to appear in the DOM
    await waitFor(() => {
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Reaction added');
      const addedReaction = screen.getByTestId('emoji-reaction');
      expect(addedReaction).toHaveTextContent(emojiText);
    });

    // Mock the remove function
    remove.mockImplementationOnce(() => {
      cardWithoutReactions.reactions = {};
      return Promise.resolve();
    });

    // Remove the reaction
    const addedReaction = screen.getByTestId('emoji-reaction');
    fireEvent.click(addedReaction);

    // Verify reaction was removed
    await waitFor(() => {
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Your reaction removed');
    });
  });

  test('allows adding comments', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Add a comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'New test comment' } });
    fireEvent.keyPress(commentInput, { key: 'Enter', code: 13, charCode: 13 });

    // Verify comment was added
    await waitFor(() => {
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment added');
    });
  });

  test('handles keyboard shortcuts for editing', async () => {
    // Mock the set function to update the cardData
    set.mockImplementationOnce(() => {
      mockCardData.content = 'Updated content';
      return Promise.resolve();
    });

    render(<Card {...mockProps} />);

    // Enter edit mode
    const cardContent = screen.getByTestId('card-content');
    fireEvent.click(cardContent);

    // Edit content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated content' } });

    // Save with Enter key
    fireEvent.keyDown(textarea, { key: 'Enter', code: 13, charCode: 13 });

    // Verify changes were saved
    await waitFor(() => {
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card saved');
    });

    // Wait for the updated content to appear and verify it's in the document
    await waitFor(() => {
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveTextContent('Updated content');
    });

    // Enter edit mode again
    const updatedCardContent = screen.getByTestId('card-content');
    fireEvent.click(updatedCardContent);

    // Cancel with Escape key
    const textareaAfterClick = screen.getByRole('textbox');
    fireEvent.keyDown(textareaAfterClick, { key: 'Escape', code: 27, charCode: 27 });

    // Verify edit mode was cancelled
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  test('prevents negative vote count', async () => {
    // Set initial votes to 0
    const cardWithZeroVotes = {
      ...mockCardData,
      votes: 0
    };

    render(<Card {...mockProps} cardData={cardWithZeroVotes} />);

    // Try to downvote
    const downvoteButton = screen.getByTitle('Downvote');
    fireEvent.click(downvoteButton);

    // Verify vote count didn't change and notification was shown
    await waitFor(() => {
      expect(set).not.toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith("Can't have negative votes");
    });
  });

  test('requires confirmation for card deletion', async () => {
    window.confirm.mockReturnValueOnce(false);
    render(<Card {...mockProps} />);

    // Enter edit mode by clicking the card content
    const cardContent = screen.getByTestId('card-content');
    fireEvent.click(cardContent);

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    // Verify card wasn't deleted
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });
  });

  test('removes reaction when clicking an existing reaction', async () => {
    // Start with a card that has a reaction
    const cardWithReaction = {
      ...mockCardData,
      reactions: {
        [COMMON_EMOJIS[0]]: {
          count: 1,
          users: {
            [mockBoardContext.user.uid]: true
          }
        }
      }
    };

    // Mock the remove function
    remove.mockImplementationOnce(() => {
      cardWithReaction.reactions = {};
      return Promise.resolve();
    });

    render(<Card {...mockProps} cardData={cardWithReaction} />);

    // Click the existing reaction
    const existingReaction = screen.getByTestId('emoji-reaction');
    fireEvent.click(existingReaction);

    // Verify reaction was removed
    await waitFor(() => {
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Your reaction removed');
    });
  });

  test('prevents adding empty comments', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Try to add an empty comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.keyPress(commentInput, { key: 'Enter', code: 13, charCode: 13 });

    // Verify no comment was added
    await waitFor(() => {
      expect(set).not.toHaveBeenCalled();
      expect(mockProps.showNotification).not.toHaveBeenCalled();
    });
  });

  test('deletes card when saving empty content', async () => {
    render(<Card {...mockProps} />);

    // Enter edit mode
    const cardContent = screen.getByTestId('card-content');
    fireEvent.click(cardContent);

    // Clear the content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '' } });

    // Save with Enter key
    fireEvent.keyDown(textarea, { key: 'Enter', code: 13, charCode: 13 });

    // Verify card was deleted
    await waitFor(() => {
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card deleted');
    });
  });

  test('allows editing comments', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Check if the comment content is displayed
    expect(screen.getByText('Test comment')).toBeInTheDocument();

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Check if the edit input appears with the correct value
    const commentEditInput = screen.getAllByRole('textbox').find(input => input.classList.contains('comment-edit-input'));
    expect(commentEditInput).toBeInTheDocument();
    expect(commentEditInput).toHaveValue('Test comment');

    // Edit the comment
    fireEvent.change(commentEditInput, { target: { value: 'Updated comment' } });
    expect(commentEditInput).toHaveValue('Updated comment');

    // Save the edited comment
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Verify comment was updated
    await waitFor(() => {
      expect(ref).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('comments/comment1'));
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment updated');
    });
  });

  test('allows deleting comments', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify comment was deleted
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment deleted');
    });
  });

  test('can cancel comment editing', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Edit the comment
    const commentEditInput = screen.getAllByRole('textbox').find(input => input.classList.contains('comment-edit-input'));
    fireEvent.change(commentEditInput, { target: { value: 'Changed but not saved' } });

    // Cancel the edit
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Verify the original comment is still there
    expect(screen.getByText('Test comment')).toBeInTheDocument();

    // Verify no database calls were made
    expect(set).not.toHaveBeenCalled();
  });

  test('allows saving comment with Enter key', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Edit the comment
    const commentEditInput = screen.getAllByRole('textbox').find(input => input.classList.contains('comment-edit-input'));
    fireEvent.change(commentEditInput, { target: { value: 'Updated with Enter key' } });

    // Save with Enter key
    fireEvent.keyPress(commentEditInput, { key: 'Enter', code: 13, charCode: 13 });

    // Verify comment was updated
    await waitFor(() => {
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment updated');
    });
  });

  test('prevents adding empty comments when editing', async () => {
    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Clear the comment
    const commentEditInput = screen.getAllByRole('textbox').find(input => input.classList.contains('comment-edit-input'));
    fireEvent.change(commentEditInput, { target: { value: '   ' } });

    // Try to save
    fireEvent.click(screen.getByText('Save'));

    // Verify no update was made
    await waitFor(() => {
      expect(set).not.toHaveBeenCalled();
    });
  });

  test('requires confirmation for comment deletion', async () => {
    // Mock confirm to return false for this test
    window.confirm.mockReturnValueOnce(false);

    render(<Card {...mockProps} />);

    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify comment wasn't deleted
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });
  });

  test('hides voting controls when voting is disabled', () => {
    // Mock the context with voting disabled
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      votingEnabled: false
    });

    render(<Card {...mockProps} />);

    // Voting controls should not be rendered
    expect(screen.queryByTitle('Upvote')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument(); // Votes count should not be visible

    // Card content should have full-width class
    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toHaveClass('full-width');
  });

  test('respects multiple votes allowed setting', async () => {
    // Mock the context with multiple votes allowed
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      multipleVotesAllowed: true
    });

    // Reset mocks to track calls more easily
    set.mockClear();
    mockProps.showNotification.mockClear();

    render(<Card {...mockProps} />);

    // Upvote the card
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Wait for first vote to be processed
    await waitFor(() => {
      expect(mockProps.showNotification).toHaveBeenCalledWith('Upvoted card');
    });

    // Reset the mocks after first vote
    set.mockClear();
    mockProps.showNotification.mockClear();

    // Upvote again
    fireEvent.click(upvoteButton);

    // Verify second vote was processed
    await waitFor(() => {
      expect(mockProps.showNotification).toHaveBeenCalledWith('Upvoted card');
    });
  });

  test('enforces vote limit even when not in retrospective mode', async () => {
    // Mock the context with retrospective mode disabled and a low vote limit
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      retrospectiveMode: false, // Not in retrospective mode
      votesPerUser: 1, // Low limit to test
      getUserVoteCount: vi.fn(() => 1) // User already at limit
    });

    // Reset mocks to track calls
    set.mockClear();
    mockProps.showNotification.mockClear();

    render(<Card {...mockProps} />);

    // Try to upvote when user is at limit
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Verify vote was blocked by limit (vote limits now apply regardless of retrospective mode)
    await waitFor(() => {
      expect(mockProps.showNotification).toHaveBeenCalledWith("You've reached your vote limit (1 votes)");
    });

    // Verify the vote was NOT recorded (set was not called)
    expect(set).not.toHaveBeenCalled();
  });

  test('enforces vote limit when in retrospective mode', async () => {
    // Mock the context with retrospective mode enabled and a low vote limit
    useBoardContext.mockReturnValue({
      ...mockBoardContext,
      retrospectiveMode: true, // Key: in retrospective mode
      votesPerUser: 1, // Low limit to test
      getUserVoteCount: vi.fn(() => 1) // User already at limit
    });

    // Reset mocks to track calls
    set.mockClear();
    mockProps.showNotification.mockClear();

    render(<Card {...mockProps} />);

    // Try to upvote when user is at limit
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Verify vote was blocked by limit
    await waitFor(() => {
      expect(mockProps.showNotification).toHaveBeenCalledWith("You've reached your vote limit (1 votes)");
    });

    // Verify the vote was NOT recorded (set was not called)
    expect(set).not.toHaveBeenCalled();
  });
});
