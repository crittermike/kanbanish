import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Card from './Card';
import { useBoardContext } from '../context/BoardContext';
import { ref, set, remove, get } from 'firebase/database';
import { useDrag } from 'react-dnd';
import { COMMON_EMOJIS } from '../utils/helpers';

// Mock firebase and react-dnd
vi.mock('firebase/database', () => {
  const mockDatabase = {};
  return {
    ref: vi.fn(),
    set: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    getDatabase: vi.fn().mockReturnValue(mockDatabase),
    get: vi.fn().mockResolvedValue({
      exists: () => false,
      val: () => null
    })
  };
});

vi.mock('react-dnd', () => ({
  useDrag: vi.fn().mockReturnValue([{ isDragging: false }, vi.fn()])
}));

// Mock ReactDOM.createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (element) => element,
  default: {
    createPortal: (element) => element
  }
}));

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

// Mock useCardOperations and other hooks
vi.mock('../hooks/useCardOperations', () => ({
  useCardOperations: vi.fn().mockReturnValue({
    isEditing: false,
    editedContent: 'Test card content',
    showEmojiPicker: false,
    showComments: false,
    newComment: '',
    emojiPickerPosition: { top: 0, left: 0 },
    hasUserVotedOnCard: false,
    
    setIsEditing: vi.fn(),
    setEditedContent: vi.fn(),
    setShowEmojiPicker: vi.fn(),
    setShowComments: vi.fn(),
    setNewComment: vi.fn(),
    setEmojiPickerPosition: vi.fn(),
    
    toggleEditMode: vi.fn(),
    saveCardChanges: vi.fn(),
    deleteCard: vi.fn(),
    handleKeyPress: vi.fn(),
    
    upvoteCard: vi.fn(),
    downvoteCard: vi.fn(),
    
    formatContentWithEmojis: (content) => content,
    
    hasUserReactedWithEmoji: () => false,
    addReaction: vi.fn(),
    
    addComment: vi.fn(),
    editComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleComments: vi.fn()
  })
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
    maxVotesPerUser: null, // Unlimited votes by default
    getRemainingVotes: vi.fn().mockReturnValue(Infinity) // Mock remaining votes function
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
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Initial state
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      isEditing: false,
      toggleEditMode: vi.fn().mockImplementation(() => {
        // Update mock to simulate edit mode
        useCardOperations.mockReturnValue({
          ...useCardOperations(),
          isEditing: true,
          editedContent: 'Test card content',
          setEditedContent: vi.fn().mockImplementation((newValue) => {
            // Update mock with new content when edited
            useCardOperations.mockReturnValue({
              ...useCardOperations(),
              isEditing: true,
              editedContent: newValue,
              saveCardChanges: vi.fn().mockImplementation(async () => {
                await set();
                // Show notification after save
                mockProps.showNotification('Card saved');
              })
            });
          })
        });
      })
    });
    
    render(<Card {...mockProps} />);
    
    // Click the card to enter edit mode
    const cardContent = screen.getByText('Test card content');
    fireEvent.click(cardContent);
    
    // Re-render with updated state (edit mode active)
    const { rerender } = render(<Card {...mockProps} />);
    
    // Get the textarea and edit the content
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    
    fireEvent.change(textarea, { target: { value: 'Updated card content' } });
    
    // Re-render with edited content
    rerender(<Card {...mockProps} />);
    
    // Click the save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card saved');
    });
  });

  test.skip('shows comments when comments button is clicked', async () => {
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Set up toggle comments behavior
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: false,
      toggleComments: vi.fn().mockImplementation(() => {
        // Update mock to show comments
        useCardOperations.mockReturnValue({
          ...useCardOperations(),
          showComments: true
        });
      })
    });
    
    render(<Card {...mockProps} />);
    
    // Find and click the comments button
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Re-render with comments shown
    const { rerender } = render(<Card {...mockProps} />);
    
    // Check if comments section appears
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });

  test.skip('allows adding upvotes', async () => {
    // Import the mock hook
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Set the upvoteCard mock
    const upvoteCardMock = vi.fn();
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      upvoteCard: upvoteCardMock,
      hasUserVotedOnCard: false
    });
    
    render(<Card {...mockProps} />);
    
    // Find and click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);
    
    // Verify the mock was called
    expect(upvoteCardMock).toHaveBeenCalled();
  });

  test.skip('allows removing downvotes', async () => {
    // Import the mock hook
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Set the downvoteCard mock
    const downvoteCardMock = vi.fn();
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      downvoteCard: downvoteCardMock,
      hasUserVotedOnCard: true
    });
    
    render(<Card {...mockProps} />);
    
    // Find and click the downvote button
    const downvoteButton = screen.getByTitle('Remove your vote');
    fireEvent.click(downvoteButton);
    
    // Verify the mock was called
    expect(downvoteCardMock).toHaveBeenCalled();
  });

  test.skip('allows deleting the card', async () => {
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Setup for deletion test
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      isEditing: false,
      toggleEditMode: vi.fn().mockImplementation(() => {
        // Update mock to show edit mode
        useCardOperations.mockReturnValue({
          ...useCardOperations(),
          isEditing: true,
          deleteCard: vi.fn().mockImplementation(async () => {
            await remove();
            mockProps.showNotification('Card deleted');
          })
        });
      })
    });
    
    render(<Card {...mockProps} />);
    
    // Enter edit mode
    const cardContent = screen.getByText('Test card content');
    fireEvent.click(cardContent);
    
    // Re-render with edit mode
    const { rerender } = render(<Card {...mockProps} />);
    
    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Mock window.confirm to return true
    window.confirm.mockReturnValueOnce(true);
    
    // Verify deletion
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card deleted');
    });
  });

  test.skip('applies drag attributes to card element', () => {
    // Override the mock to simulate dragging
    useDrag.mockReturnValueOnce([{ isDragging: true }, vi.fn()]);
    
    render(<Card {...mockProps} />);
    
    // Check if the card div has the dragging class
    const cardElement = screen.getByText('Test card content').closest('.card');
    expect(cardElement).toHaveClass('dragging');
    expect(cardElement).toHaveStyle('opacity: 0.5');
  });

  test.skip('shows emoji picker when clicking the + icon', () => {
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

  test.skip('allows adding and removing emoji reactions', async () => {
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

  test.skip('allows adding comments', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      addComment: vi.fn(),
      newComment: 'New test comment'
    });
    
    render(<Card {...mockProps} />);
    
    // Add a comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.keyPress(commentInput, { key: 'Enter', code: 13, charCode: 13 });
    
    // Verify comment was added
    await waitFor(() => {
      expect(useCardOperations().addComment).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment added');
    });
  });

  test.skip('handles keyboard shortcuts for editing', async () => {
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

  test.skip('prevents negative vote count', async () => {
    // Set initial votes to 0
    const cardWithZeroVotes = {
      ...mockCardData,
      votes: 0
    };
    
    // Import the mock hook
    const { useCardOperations } = await import('../hooks/useCardOperations');
    
    // Mock the hook to return no user vote
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      hasUserVotedOnCard: false
    });
    
    render(<Card {...mockProps} cardData={cardWithZeroVotes} />);
    
    // The downvote button should be disabled when user hasn't voted
    const downvoteButton = screen.getByTitle('Remove vote');
    expect(downvoteButton).toBeDisabled();
  });

  test.skip('requires confirmation for card deletion', async () => {
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

  test.skip('removes reaction when clicking an existing reaction', async () => {
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

  test.skip('prevents adding empty comments', async () => {
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

  test.skip('deletes card when saving empty content', async () => {
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

  test.skip('allows editing comments', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      editComment: vi.fn()
    });
    
    render(<Card {...mockProps} />);
    
    // No need to click on comments button since we've set showComments: true
    
    // Check if the comment content is displayed
    expect(screen.getByText('Test comment')).toBeInTheDocument();
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Check if the edit input appears with the correct value
    const commentEditInput = screen.getByRole('textbox');
    expect(commentEditInput).toBeInTheDocument();
    expect(commentEditInput).toHaveClass('comment-edit-input');
    expect(commentEditInput).toHaveValue('Test comment');
    
    // Edit the comment
    fireEvent.change(commentEditInput, { target: { value: 'Updated comment' } });
    expect(commentEditInput).toHaveValue('Updated comment');
    
    // Save the edited comment
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Verify comment was updated
    await waitFor(() => {
      expect(useCardOperations().editComment).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment updated');
    });
  });

  test.skip('allows deleting comments', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      deleteComment: vi.fn()
    });
    
    render(<Card {...mockProps} />);
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Verify comment was deleted
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(useCardOperations().deleteComment).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment deleted');
    });
  });

  test.skip('can cancel comment editing', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true
    });
    
    render(<Card {...mockProps} />);
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Edit the comment
    const commentEditInput = screen.getByRole('textbox');
    fireEvent.change(commentEditInput, { target: { value: 'Changed but not saved' } });
    
    // Cancel the edit
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify the original comment is still there
    expect(screen.getByText('Test comment')).toBeInTheDocument();
    
    // Verify no database calls were made
    expect(set).not.toHaveBeenCalled();
  });

  test.skip('allows saving comment with Enter key', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      editComment: vi.fn()
    });
    
    render(<Card {...mockProps} />);
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Edit the comment
    const commentEditInput = screen.getByRole('textbox');
    fireEvent.change(commentEditInput, { target: { value: 'Updated with Enter key' } });
    
    // Save with Enter key
    fireEvent.keyPress(commentEditInput, { key: 'Enter', code: 13, charCode: 13 });
    
    // Verify comment was updated
    await waitFor(() => {
      expect(useCardOperations().editComment).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment updated');
    });
  });

  test.skip('prevents adding empty comments when editing', async () => {
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      editComment: vi.fn()
    });
    
    render(<Card {...mockProps} />);
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Clear the comment
    const commentEditInput = screen.getByRole('textbox');
    fireEvent.change(commentEditInput, { target: { value: '   ' } });
    
    // Try to save
    fireEvent.click(screen.getByText('Save'));
    
    // Verify no update was made
    await waitFor(() => {
      expect(useCardOperations().editComment).not.toHaveBeenCalled();
    });
  });

  test.skip('requires confirmation for comment deletion', async () => {
    // Mock confirm to return false for this test
    window.confirm.mockReturnValueOnce(false);
    
    // Mock the hook with showComments set to true
    const { useCardOperations } = await import('../hooks/useCardOperations');
    useCardOperations.mockReturnValue({
      ...useCardOperations(),
      showComments: true,
      deleteComment: vi.fn()
    });
    
    render(<Card {...mockProps} />);
    
    // Click on the comment to enter edit mode
    fireEvent.click(screen.getByText('Test comment'));
    
    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Verify comment wasn't deleted
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(useCardOperations().deleteComment).not.toHaveBeenCalled();
    });
  });
});
