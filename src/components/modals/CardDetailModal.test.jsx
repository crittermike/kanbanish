import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardContext } from '../../context/BoardContext';
import CardDetailModal from './CardDetailModal';

vi.mock('../../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

vi.mock('../../hooks/useCardOperations', () => ({
  useCardOperations: vi.fn(() => ({
    showEmojiPicker: false,
    newComment: '',
    emojiPickerPosition: { top: 0, left: 0 },
    setShowEmojiPicker: vi.fn(),
    setNewComment: vi.fn(),
    setEmojiPickerPosition: vi.fn(),
    upvoteCard: vi.fn(),
    downvoteCard: vi.fn(),
    hasUserReactedWithEmoji: vi.fn(() => false),
    addReaction: vi.fn(),
    addComment: vi.fn(),
    editComment: vi.fn(),
    deleteComment: vi.fn(),
    isCardAuthor: vi.fn(() => true),
    isCommentAuthor: vi.fn(() => true),
    setCardColor: vi.fn(),
    setCardTags: vi.fn()
  }))
}));

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn()
}));

vi.mock('../../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

vi.mock('../CardTimerControls', () => ({
  default: () => <div>Timer controls</div>
}));

vi.mock('../CardColorPicker', () => ({
  default: () => null
}));

vi.mock('../CardReactions', () => ({
  default: () => <div>Reactions list</div>
}));

vi.mock('../CardTagPicker', () => ({
  default: () => null
}));

vi.mock('../Comments', () => ({
  default: () => <div>Comments</div>
}));

vi.mock('../EmojiPicker', () => ({
  default: () => null
}));

vi.mock('../MarkdownContent', () => ({
  default: ({ content }) => <div>{content}</div>
}));

vi.mock('../VotingControls', () => ({
  default: () => <div>Votes</div>
}));

vi.mock('../../utils/avatarColors', () => ({
  getInitials: vi.fn(() => 'AN')
}));

describe('CardDetailModal', () => {
  const updateBoardSettings = vi.fn();

  const baseContext = {
    boardId: 'board-1',
    user: { uid: 'user-1' },
    columns: {
      'col-1': {
        title: 'Went well',
        cards: {
          'card-1': {
            content: 'First card',
            reactions: {},
            comments: {},
            votes: 3,
            createdBy: 'user-1'
          },
          'card-2': {
            content: 'Second card',
            reactions: {},
            comments: {},
            votes: 1,
            createdBy: 'user-2'
          }
        }
      }
    },
    votingEnabled: true,
    downvotingEnabled: true,
    multipleVotesAllowed: false,
    votesPerUser: 3,
    getUserVoteCount: vi.fn(() => 0),
    retrospectiveMode: true,
    workflowPhase: 'RESULTS',
    recordAction: vi.fn(),
    undo: vi.fn(),
    boardTags: [],
    actionItems: {},
    actionItemsEnabled: false,
    createActionItem: vi.fn(),
    deleteActionItem: vi.fn(),
    presenceData: {},
    displayName: '',
    userColor: '',
    sortByVotes: false,
    detailNavigationHintsDismissed: false,
    updateBoardSettings
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(baseContext);
  });

  const renderModal = () => render(
    <CardDetailModal
      isOpen={true}
      onClose={vi.fn()}
      cardId="card-1"
      columnId="col-1"
      onNavigateCard={vi.fn()}
      cardList={[
        { cardId: 'card-1', columnId: 'col-1' },
        { cardId: 'card-2', columnId: 'col-1' }
      ]}
      contextLabel="Retro review"
    />
  );

  it('keeps reactions available during retro results review', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /add reaction/i })).toBeInTheDocument();
  });

  it('persists review-tip dismissal per board', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /dismiss review tips/i }));

    expect(updateBoardSettings).toHaveBeenCalledWith({ detailNavigationHintsDismissed: true });
  });

  it('hides the review tip banner after the board setting is dismissed', () => {
    useBoardContext.mockReturnValue({
      ...baseContext,
      detailNavigationHintsDismissed: true
    });

    renderModal();

    expect(screen.queryByText(/use ← and → to review cards/i)).not.toBeInTheDocument();
  });
});
