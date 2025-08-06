import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Card from './Card';

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

describe('Card Authorship Tests', () => {
  const mockShowNotification = vi.fn();
  const mockUpdateCard = vi.fn();
  const mockDeleteCard = vi.fn();
  const mockAddComment = vi.fn();
  const mockUpdateComment = vi.fn();
  const mockDeleteComment = vi.fn();

  const defaultMockContext = {
    boardId: 'test-board',
    user: { uid: 'author1' },
    votingEnabled: true,
    downvotingEnabled: false,
    multipleVotesAllowed: false,
    retrospectiveMode: false,
    workflowPhase: 'CREATION',
    updateCard: mockUpdateCard,
    deleteCard: mockDeleteCard,
    addComment: mockAddComment,
    updateComment: mockUpdateComment,
    deleteComment: mockDeleteComment,
    isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
    isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
  };

  const baseProps = {
    columnId: 'col1',
    cardId: 'card1',
    cardData: {
      content: 'Test card content',
      votes: 5,
      voters: { user1: 1, user2: 1 },
      reactions: { '👍': { user1: true, user2: true } },
      comments: {
        comment1: {
          content: 'Test comment',
          timestamp: Date.now(),
          createdBy: 'author1'
        }
      },
      createdBy: 'author1'
    },
    showNotification: mockShowNotification,
    user: { uid: 'author1' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  it('allows card author to edit their card', () => {
    render(<Card {...baseProps} />);

    // Click to edit the card
    const cardContent = screen.getByTestId('card-content');
    fireEvent.click(cardContent);

    // Should enter edit mode (textarea appears)
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Test card content');
  });

  it('prevents non-author from editing card', () => {
    const nonAuthorContext = {
      ...defaultMockContext,
      user: { uid: 'different-user' }
    };
    useBoardContext.mockReturnValue(nonAuthorContext);

    render(<Card {...baseProps} />);

    // Click to edit the card
    const cardContent = screen.getByTestId('card-content');
    fireEvent.click(cardContent);

    // Should NOT enter edit mode and show notification
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(mockShowNotification).toHaveBeenCalledWith('Only the author can edit this card');
  });

  it('allows comment author to edit their comment', () => {
    render(<Card {...baseProps} />);

    // Open comments
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment to edit it
    const commentContent = screen.getByText('Test comment');
    fireEvent.click(commentContent);

    // Should enter edit mode
    const editInput = screen.getByDisplayValue('Test comment');
    expect(editInput).toBeInTheDocument();
  });

  it('prevents non-author from editing comment', () => {
    const nonAuthorContext = {
      ...defaultMockContext,
      user: { uid: 'different-user' }
    };
    useBoardContext.mockReturnValue(nonAuthorContext);

    render(<Card {...baseProps} />);

    // Open comments
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    // Click on the comment - should not enter edit mode
    const commentContent = screen.getByText('Test comment');
    fireEvent.click(commentContent);

    // Should NOT enter edit mode
    expect(screen.queryByDisplayValue('Test comment')).not.toBeInTheDocument();
  });

  it('shows visual indicators for editable content', () => {
    render(<Card {...baseProps} />);

    // Card should have author-editable class
    const card = screen.getByTestId('card-content').closest('.card');
    expect(card).toHaveClass('author-editable');

    // Open comments to check comment editability indicators
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    const commentContent = screen.getByText('Test comment');
    expect(commentContent).toHaveClass('editable');
    expect(commentContent).toHaveAttribute('title', 'Click to edit');
  });

  it('shows non-editable indicators for non-authors', () => {
    const nonAuthorContext = {
      ...defaultMockContext,
      user: { uid: 'different-user' }
    };
    useBoardContext.mockReturnValue(nonAuthorContext);

    render(<Card {...baseProps} />);

    // Card should NOT have author-editable class
    const card = screen.getByTestId('card-content').closest('.card');
    expect(card).not.toHaveClass('author-editable');

    // Open comments to check comment editability indicators
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);

    const commentContent = screen.getByText('Test comment');
    expect(commentContent).not.toHaveClass('editable');
    expect(commentContent).toHaveAttribute('title', 'Only the author can edit this comment');
  });

  it('hides author indicator in all phases beyond creation to maintain anonymity', () => {
    // Test grouping phase
    const groupingPhaseContext = {
      ...defaultMockContext,
      workflowPhase: 'GROUPING',
      retrospectiveMode: true
    };
    useBoardContext.mockReturnValue(groupingPhaseContext);

    const { unmount } = render(<Card {...baseProps} />);

    // Card should NOT have author-editable class during grouping phase
    const card = screen.getByTestId('card-content').closest('.card');
    expect(card).not.toHaveClass('author-editable');
    
    unmount();

    // Test interactions phase as well
    const interactionsPhaseContext = {
      ...defaultMockContext,
      workflowPhase: 'INTERACTIONS',
      retrospectiveMode: true
    };
    useBoardContext.mockReturnValue(interactionsPhaseContext);
    
    render(<Card {...baseProps} />);
    const cardInteractions = screen.getByTestId('card-content').closest('.card');
    expect(cardInteractions).not.toHaveClass('author-editable');
  });

  it('shows author indicator only in creation phase', () => {
    const creationPhaseContext = {
      ...defaultMockContext,
      workflowPhase: 'CREATION',
      retrospectiveMode: true
    };
    useBoardContext.mockReturnValue(creationPhaseContext);

    render(<Card {...baseProps} />);

    // Card should have author-editable class in creation phase
    const card = screen.getByTestId('card-content').closest('.card');
    expect(card).toHaveClass('author-editable');
  });
});
