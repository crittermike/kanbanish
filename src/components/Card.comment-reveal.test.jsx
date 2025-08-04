import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Card from './Card';
import { useBoardContext } from '../context/BoardContext';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

// Mock the react-dnd hooks
vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()]
}));

// Mock the EmojiPicker
vi.mock('./EmojiPicker', () => {
  return {
    default: ({ onEmojiSelect, position }) => (
      <div data-testid="emoji-picker" style={{ top: position.top, left: position.left }}>
        <button onClick={() => onEmojiSelect('👍')}>👍</button>
      </div>
    )
  };
});

// Mock boardUtils
vi.mock('../utils/boardUtils', () => ({
  addCard: vi.fn()
}));

describe('Card Comment Revealing and Freezing', () => {
  const mockShowNotification = vi.fn();
  const mockUpdateCard = vi.fn();
  const mockDeleteCard = vi.fn();
  const mockAddComment = vi.fn();
  const mockUpdateComment = vi.fn();
  const mockDeleteComment = vi.fn();

  const baseProps = {
    columnId: 'col1',
    cardId: 'card1',
    cardData: {
      content: 'Test card content',
      reactions: {
        '👍': {
          count: 1,
          users: {
            'user123': true
          }
        }
      },
      comments: {
        comment1: {
          content: 'My comment',
          createdBy: 'user123',
          timestamp: Date.now()
        },
        comment2: {
          content: 'Other user comment',
          createdBy: 'other-user',
          timestamp: Date.now()
        }
      }
    },
    showNotification: mockShowNotification
  };

  it('reveals all comments when interactions are revealed', () => {
    const revealedContext = {
      boardId: 'test-board',
      user: { uid: 'user123' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTION_REVEAL' // All interactions revealed and frozen
    };
    
    useBoardContext.mockReturnValue(revealedContext);
    
    render(<Card {...baseProps} />);
    
    // Click comments button to show comments
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Both comments should be visible
    expect(screen.getByText('My comment')).toBeInTheDocument();
    expect(screen.getByText('Other user comment')).toBeInTheDocument();
  });

  it('disables comment editing when interactions are frozen', () => {
    const frozenContext = {
      boardId: 'test-board',
      user: { uid: 'user123' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTION_REVEAL' // Interactions revealed = frozen
    };
    
    useBoardContext.mockReturnValue(frozenContext);
    
    render(<Card {...baseProps} />);
    
    // Click comments button to show comments
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Try to click on the user's own comment to edit it
    const myComment = screen.getByText('My comment');
    fireEvent.click(myComment);
    
    // Should NOT show alert when frozen (silent behavior)
    // Comment form should be completely hidden when frozen
    expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
  });

  it('allows comment editing when interactions are not frozen', () => {
    const normalModeContext = {
      boardId: 'test-board',
      user: { uid: 'user123' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: false, // No reveal mode restrictions
      cardsRevealed: false,
      interactionsRevealed: false,
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(normalModeContext);
    
    render(<Card {...baseProps} />);
    
    // Click comments button to show comments
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Verify comments section appears (which means editing would be possible)
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('My comment')).toBeInTheDocument();
  });

  it('shows emoji reactions without disabled styling when interactions are frozen', () => {
    const frozenInteractionsContext = {
      boardId: 'test-board',
      user: { uid: 'user123' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTION_REVEAL', // Frozen state
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(frozenInteractionsContext);
    
    render(<Card {...baseProps} />);
    
    // Find the emoji reaction
    const emojiReaction = screen.getByTestId('emoji-reaction');
    
    // Should not have disabled class when frozen (should look normal but not be clickable)
    expect(emojiReaction).not.toHaveClass('disabled');
    
    // Should have a tooltip indicating it's frozen
    expect(emojiReaction).toHaveAttribute('title', 'Interactions are now frozen - no more changes allowed');
    
    // Add reaction button should be hidden when interactions are frozen
    const addReactionButton = screen.queryByRole('button', { name: '+' });
    expect(addReactionButton).not.toBeInTheDocument();
  });
});
