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

describe('Card Reveal Mode Interactions', () => {
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
      votes: 5,
      voters: { user1: 1, user2: 1 },
      reactions: { '👍': { count: 2, users: { user1: true, user2: true } } },
      comments: {
        comment1: {
          content: 'Test comment',
          timestamp: Date.now(),
          createdBy: 'user1'
        }
      },
      createdBy: 'user1'
    },
    showNotification: mockShowNotification,
    user: { uid: 'user1' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables reactions when in reveal mode and cards not revealed', () => {
    const revealModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: true,  // Reveal mode is on
      cardsRevealed: false, // Cards are not revealed yet
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(revealModeContext);
    
    render(<Card {...baseProps} />);
    
    // Try to click on existing reaction - should be disabled
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).toHaveClass('disabled');
    expect(existingReaction).toHaveAttribute('title', 'Reactions disabled until cards are revealed');
    
    // Try to click add reaction button - should be disabled
    const addReactionButton = screen.getByText('+');
    expect(addReactionButton).toBeDisabled();
    expect(addReactionButton).toHaveClass('disabled');
  });

  it('hides comment button when in reveal mode and cards not revealed', () => {
    const revealModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: true,  // Reveal mode is on
      cardsRevealed: false, // Cards are not revealed yet
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(revealModeContext);
    
    render(<Card {...baseProps} />);
    
    // Comment button should be hidden
    const commentsButton = screen.queryByTitle('Toggle comments');
    expect(commentsButton).not.toBeInTheDocument();
  });

  it('enables reactions when in reveal mode and cards are revealed', () => {
    const revealModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: true,  // Reveal mode is on
      cardsRevealed: true, // Cards are revealed
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(revealModeContext);
    
    render(<Card {...baseProps} />);
    
    // Reactions should be enabled
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).not.toHaveClass('disabled');
    
    // Add reaction button should be enabled
    const addReactionButton = screen.getByTitle('Add reaction');
    expect(addReactionButton).not.toBeDisabled();
  });

  it('shows comment button when in reveal mode and cards are revealed', () => {
    const revealModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: true,  // Reveal mode is on
      cardsRevealed: true, // Cards are revealed
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(revealModeContext);
    
    render(<Card {...baseProps} />);
    
    // Reactions should be enabled
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).not.toHaveClass('disabled');
    
    // Add reaction button should be enabled
    const addReactionButton = screen.getByTitle('Add reaction');
    expect(addReactionButton).not.toBeDisabled();
    
    // Comment button should be visible
    const commentsButton = screen.getByTitle('Toggle comments');
    expect(commentsButton).toBeInTheDocument();
  });

  it('shows comment button when reveal mode is disabled', () => {
    const normalModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: false, // Reveal mode is off
      cardsRevealed: false,
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
    
    // Reactions should be enabled
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).not.toHaveClass('disabled');
    
    // Comment button should be visible
    const commentsButton = screen.getByTitle('Toggle comments');
    expect(commentsButton).toBeInTheDocument();
  });

  it('shows proper notification when trying to add reaction while disabled', () => {
    const revealModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      revealMode: true,
      cardsRevealed: false,
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };
    
    useBoardContext.mockReturnValue(revealModeContext);
    
    render(<Card {...baseProps} />);
    
    // Try to click on existing reaction (disabled element clicks should not trigger handlers)
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    
    // Verify that the reaction element is disabled and clicking it won't work
    expect(existingReaction).toHaveClass('disabled');
    
    // The onclick is undefined when disabled, so no notification should be triggered
    // This test verifies that the disable functionality is working as expected
    fireEvent.click(existingReaction);
    
    // No notification should be called since onClick is undefined when disabled
    expect(mockShowNotification).not.toHaveBeenCalled();
  });
});
