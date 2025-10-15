import { render, screen } from '@testing-library/react';
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

describe('Card Workflow Phase Interactions (Correct Behavior)', () => {
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
          id: 'comment1',
          text: 'Test comment',
          createdBy: 'user1',
          created: Date.now()
        }
      },
      createdBy: 'user1',
      created: Date.now()
    },
    showNotification: mockShowNotification
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides interactions in CREATION phase', () => {
    const creationPhaseContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'CREATION',
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };

    useBoardContext.mockReturnValue(creationPhaseContext);

    render(<Card {...baseProps} />);

    // Interactions should not be visible at all in creation phase
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Toggle comments')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Upvote')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
  });

  it('hides interactions in GROUPING phase', () => {
    const groupingPhaseContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'GROUPING',
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };

    useBoardContext.mockReturnValue(groupingPhaseContext);

    render(<Card {...baseProps} />);

    // Interactions should not be visible at all in grouping phase
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Toggle comments')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Upvote')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Downvote')).not.toBeInTheDocument();
  });

  it('shows and enables interactions in INTERACTIONS phase', () => {
    const interactionsPhaseContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS',
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };

    useBoardContext.mockReturnValue(interactionsPhaseContext);

    render(<Card {...baseProps} />);

    // Interactions should be visible and enabled
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reaction' })).toBeInTheDocument();
    expect(screen.getByTitle('Toggle comments')).toBeInTheDocument();
    expect(screen.getByTitle('Upvote')).toBeInTheDocument();

    // Reactions should be enabled (not disabled)
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).not.toHaveClass('disabled');

    // Add reaction button should be enabled
    const addReactionButton = screen.getByRole('button', { name: 'Add reaction' });
    expect(addReactionButton).not.toBeDisabled();
  });

  it('shows but disables interactions in INTERACTION_REVEAL phase', () => {
    const interactionRevealPhaseContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTION_REVEAL',
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      addComment: mockAddComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      isCardAuthor: (cardData, user) => cardData?.createdBy === user?.uid,
      isCommentAuthor: (comment, user) => comment?.createdBy === user?.uid
    };

    useBoardContext.mockReturnValue(interactionRevealPhaseContext);

    render(<Card {...baseProps} />);

    // Interactions should be visible but disabled (frozen)
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle comments')).toBeInTheDocument();
    // Check that voting buttons show the frozen message
    expect(screen.getAllByTitle('Voting is frozen - no more changes allowed')).toHaveLength(2);

    // Reactions should exist but be disabled for frozen state
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).toBeInTheDocument();
    // In frozen state, reactions don't get disabled styling but are not clickable
  });

  it('shows interactions when reveal mode is disabled (normal mode)', () => {
    const normalModeContext = {
      boardId: 'test-board',
      user: { uid: 'user1' },
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: false,
      retrospectiveMode: false, // Reveal mode is off
      workflowPhase: 'CREATION', // Phase doesn't matter when reveal mode is off
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

    // When reveal mode is disabled, interactions should always be visible and enabled
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reaction' })).toBeInTheDocument();
    expect(screen.getByTitle('Toggle comments')).toBeInTheDocument();
    expect(screen.getByTitle('Upvote')).toBeInTheDocument();

    // Reactions should be enabled
    const existingReaction = screen.getByText('👍').closest('.emoji-reaction');
    expect(existingReaction).not.toHaveClass('disabled');

    // Add reaction button should be enabled
    const addReactionButton = screen.getByRole('button', { name: 'Add reaction' });
    expect(addReactionButton).not.toBeDisabled();
  });
});
