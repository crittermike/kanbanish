import { renderHook, act } from '@testing-library/react';
import { ref, set, remove } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { areInteractionsDisabled } from '../utils/retrospectiveModeUtils';
import { areInteractionsRevealed, isCardEditingAllowed } from '../utils/workflowUtils';
import { useCardOperations } from './useCardOperations';

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

// Mock utilities
vi.mock('../utils/linkify', () => ({
  linkifyText: vi.fn(text => text)
}));

vi.mock('../utils/retrospectiveModeUtils', () => ({
  areInteractionsDisabled: vi.fn(() => false)
}));

vi.mock('../utils/workflowUtils', () => ({
  areInteractionsRevealed: vi.fn(() => false),
  isCardEditingAllowed: vi.fn(() => true)
}));

const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  columnId: 'column-456',
  cardId: 'card-789',
  cardData: {
    content: 'Test card content',
    votes: 0,
    created: 123456,
    createdBy: 'user1',
    voters: {},
    reactions: {},
    comments: {}
  },
  user: { uid: 'user1' },
  showNotification: vi.fn(),
  multipleVotesAllowed: false,
  retrospectiveMode: false,
  workflowPhase: 'CREATION',
  votesPerUser: 3,
  getUserVoteCount: vi.fn(() => 0),
  ...overrides
});

describe('useCardOperations', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('Initial State', () => {
    it('should initialize isEditing to false', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isEditing).toBe(false);
    });

    it('should initialize showEmojiPicker to false', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.showEmojiPicker).toBe(false);
    });

    it('should initialize showComments to false', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.showComments).toBe(false);
    });

    it('should initialize newComment to empty string', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.newComment).toBe('');
    });

    it('should initialize editedContent from cardData.content', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.editedContent).toBe('Test card content');
    });

    it('should initialize editedContent to empty string when cardData.content is null', () => {
      const props = createMockProps({
        cardData: { ...mockProps.cardData, content: null }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.editedContent).toBe('');
    });
  });

  describe('Authorship', () => {
    it('should return true when user.uid matches cardData.createdBy', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isCardAuthor()).toBe(true);
    });

    it('should return false when user.uid differs from cardData.createdBy', () => {
      const props = createMockProps({
        user: { uid: 'user2' }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.isCardAuthor()).toBe(false);
    });

    it('should return true when cardData.createdBy is null (backward compat)', () => {
      const props = createMockProps({
        cardData: { ...mockProps.cardData, createdBy: null }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.isCardAuthor()).toBe(true);
    });

    it('should return true when cardData.createdBy is undefined (backward compat)', () => {
      const props = createMockProps({
        cardData: { ...mockProps.cardData, createdBy: undefined }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.isCardAuthor()).toBe(true);
    });

    it('should return true for isCommentAuthor when comment.createdBy matches user', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isCommentAuthor({ createdBy: 'user1' })).toBe(true);
    });

    it('should return false for isCommentAuthor when comment.createdBy differs', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isCommentAuthor({ createdBy: 'user2' })).toBe(false);
    });

    it('should return true for isCommentAuthor when comment.createdBy is null (backward compat)', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isCommentAuthor({ createdBy: null })).toBe(true);
    });

    it('should return true for isCommentAuthor when comment.createdBy is undefined', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      expect(result.current.isCommentAuthor({ createdBy: undefined })).toBe(true);
    });
  });

  describe('Toggle Edit Mode', () => {
    it('should set isEditing to true for card author', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      act(() => {
        result.current.toggleEditMode(mockEvent);
      });

      expect(result.current.isEditing).toBe(true);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should show notification for non-author', () => {
      const props = createMockProps({ user: { uid: 'user2' } });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      act(() => {
        result.current.toggleEditMode(mockEvent);
      });

      expect(result.current.isEditing).toBe(false);
      expect(props.showNotification).toHaveBeenCalledWith('Only the author can edit this card');
    });

    it('should reset editedContent to cardData.content when toggling', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      // Modify editedContent first
      act(() => {
        result.current.setEditedContent('Modified content');
      });
      expect(result.current.editedContent).toBe('Modified content');

      // Toggle edit mode should reset it
      act(() => {
        result.current.toggleEditMode(mockEvent);
      });

      expect(result.current.editedContent).toBe('Test card content');
    });

    it('should not enter edit mode when workflow phase disallows it', () => {
      isCardEditingAllowed.mockReturnValue(false);

      const props = createMockProps({ retrospectiveMode: true });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      act(() => {
        result.current.toggleEditMode(mockEvent);
      });

      expect(result.current.isEditing).toBe(false);
      // Should NOT show notification for workflow restrictions (silent)
      expect(props.showNotification).not.toHaveBeenCalled();

      // Reset mock
      isCardEditingAllowed.mockReturnValue(true);
    });

    it('should toggle isEditing back to false when called while editing', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      act(() => {
        result.current.toggleEditMode(mockEvent);
      });
      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.toggleEditMode(mockEvent);
      });
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle being called without an event object', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.toggleEditMode();
      });

      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('Save Card Changes', () => {
    it('should save trimmed content via Firebase set()', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      // Enter edit mode and change content
      act(() => {
        result.current.toggleEditMode(mockEvent);
      });
      act(() => {
        result.current.setEditedContent('Updated content');
      });

      await act(async () => {
        await result.current.saveCardChanges();
      });

      expect(set).toHaveBeenCalledWith('mock-ref', {
        ...mockProps.cardData,
        content: 'Updated content'
      });
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card saved');
      expect(result.current.isEditing).toBe(false);
    });

    it('should delete card when content is empty', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setEditedContent('   ');
      });

      await act(async () => {
        await result.current.saveCardChanges();
      });

      expect(remove).toHaveBeenCalledWith('mock-ref');
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card deleted');
    });

    it('should not save when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.saveCardChanges();
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('Voting', () => {
    it('should call set() on votes and voters refs when upvoting', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      // ref is called for: cardRef (useMemo) + votesRef + voterRef
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Upvoted card');
    });

    it('should not go below 0 votes when downvoting', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.downvoteCard(mockEvent);
      });

      // cardData.votes is 0, so downvote should be rejected
      expect(mockProps.showNotification).toHaveBeenCalledWith("Can't have negative votes");
      expect(set).not.toHaveBeenCalled();
    });

    it('should show "You\'ve already voted" for duplicate single-vote', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          votes: 1,
          voters: { user1: 1 }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(props.showNotification).toHaveBeenCalledWith("You've already voted");
    });

    it('should show notification when interactions are disabled', async () => {
      areInteractionsDisabled.mockReturnValue(true);

      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(mockProps.showNotification).toHaveBeenCalledWith('Voting is disabled until cards are revealed');

      // Reset mock
      areInteractionsDisabled.mockReturnValue(false);
    });

    it('should show frozen message when interactions are revealed', async () => {
      areInteractionsDisabled.mockReturnValue(true);
      areInteractionsRevealed.mockReturnValue(true);

      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(mockProps.showNotification).toHaveBeenCalledWith('Voting is now frozen - no more changes allowed');

      // Reset mocks
      areInteractionsDisabled.mockReturnValue(false);
      areInteractionsRevealed.mockReturnValue(false);
    });

    it('should not vote when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not vote when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should enforce vote limit in retrospective mode', async () => {
      const props = createMockProps({
        retrospectiveMode: true,
        votesPerUser: 3,
        getUserVoteCount: vi.fn(() => 3)
      });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(props.showNotification).toHaveBeenCalledWith("You've reached your vote limit (3 votes)");
    });

    it('should remove vote when voting opposite direction in single-vote mode', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          votes: 1,
          voters: { user1: 1 }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.downvoteCard(mockEvent);
      });

      // Should show "Vote removed" when toggling
      expect(props.showNotification).toHaveBeenCalledWith('Vote removed');
    });

    it('should allow multiple votes when multipleVotesAllowed is true', async () => {
      const props = createMockProps({
        multipleVotesAllowed: true,
        cardData: {
          ...createMockProps().cardData,
          votes: 1,
          voters: { user1: 1 }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.upvoteCard(mockEvent);
      });

      expect(set).toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Upvoted card');
    });
  });

  describe('Reactions', () => {
    it('should return true for hasUserReactedWithEmoji when user has reacted', () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          reactions: {
            '👍': { count: 1, users: { user1: true } }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(true);
    });

    it('should return false for hasUserReactedWithEmoji when user has not reacted', () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          reactions: {
            '👍': { count: 1, users: { user2: true } }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });

    it('should return false for hasUserReactedWithEmoji with missing reactions data', () => {
      const props = createMockProps({
        cardData: { ...createMockProps().cardData, reactions: {} }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });

    it('should return false for hasUserReactedWithEmoji with null reactions', () => {
      const props = createMockProps({
        cardData: { ...createMockProps().cardData, reactions: null }
      });
      const { result } = renderHook(() => useCardOperations(props));
      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });

    it('should show notification when adding reaction with interactions disabled', async () => {
      areInteractionsDisabled.mockReturnValue(true);

      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(mockProps.showNotification).toHaveBeenCalledWith('Reactions are disabled until cards are revealed');

      areInteractionsDisabled.mockReturnValue(false);
    });

    it('should show frozen message for reactions when interactions are revealed', async () => {
      areInteractionsDisabled.mockReturnValue(true);
      areInteractionsRevealed.mockReturnValue(true);

      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(mockProps.showNotification).toHaveBeenCalledWith('Interactions are now frozen - no more changes allowed');

      areInteractionsDisabled.mockReturnValue(false);
      areInteractionsRevealed.mockReturnValue(false);
    });

    it('should add a new reaction via Firebase set()', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Reaction added');
    });

    it('should remove an existing reaction', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          reactions: {
            '👍': { count: 1, users: { user1: true } }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(remove).toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Your reaction removed');
    });

    it('should not add reaction when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not add reaction when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));
      const mockEvent = { stopPropagation: vi.fn() };

      await act(async () => {
        await result.current.addReaction(mockEvent, '👍');
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('Comments', () => {
    it('should toggle showComments and close emoji picker', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      // Open emoji picker first
      act(() => {
        result.current.setShowEmojiPicker(true);
      });
      expect(result.current.showEmojiPicker).toBe(true);

      // Toggle comments
      act(() => {
        result.current.toggleComments();
      });

      expect(result.current.showComments).toBe(true);
      expect(result.current.showEmojiPicker).toBe(false);
    });

    it('should toggle showComments back to false', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.toggleComments();
      });
      expect(result.current.showComments).toBe(true);

      act(() => {
        result.current.toggleComments();
      });
      expect(result.current.showComments).toBe(false);
    });

    it('should show notification when adding comment with interactions disabled', async () => {
      areInteractionsDisabled.mockReturnValue(true);

      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setNewComment('A test comment');
      });

      await act(async () => {
        await result.current.addComment();
      });

      expect(mockProps.showNotification).toHaveBeenCalledWith('Comments are disabled until cards are revealed');

      areInteractionsDisabled.mockReturnValue(false);
    });

    it('should add a comment via Firebase set()', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setNewComment('A test comment');
      });

      await act(async () => {
        await result.current.addComment();
      });

      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Comment added');
      expect(result.current.newComment).toBe('');
    });

    it('should not add empty comment', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      await act(async () => {
        await result.current.addComment();
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not add comment when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));

      act(() => {
        result.current.setNewComment('A test comment');
      });

      await act(async () => {
        await result.current.addComment();
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should edit a comment the user authored', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user1', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.editComment('comment1', 'Updated comment');
      });

      expect(set).toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Comment updated');
    });

    it('should not allow editing a comment by another user', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user2', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.editComment('comment1', 'Updated comment');
      });

      expect(set).not.toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Only the author can edit this comment');
    });

    it('should delete a comment the user authored', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user1', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.deleteComment('comment1');
      });

      expect(remove).toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Comment deleted');
    });

    it('should not allow deleting a comment by another user', async () => {
      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user2', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.deleteComment('comment1');
      });

      expect(remove).not.toHaveBeenCalled();
      expect(props.showNotification).toHaveBeenCalledWith('Only the author can delete this comment');
    });

    it('should not edit comment when interactions are disabled', async () => {
      areInteractionsDisabled.mockReturnValue(true);

      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user1', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.editComment('comment1', 'Updated');
      });

      expect(props.showNotification).toHaveBeenCalledWith('Comment editing is disabled until cards are revealed');

      areInteractionsDisabled.mockReturnValue(false);
    });

    it('should not delete comment when interactions are disabled', async () => {
      areInteractionsDisabled.mockReturnValue(true);

      const props = createMockProps({
        cardData: {
          ...createMockProps().cardData,
          comments: {
            comment1: { content: 'Original', createdBy: 'user1', timestamp: 123 }
          }
        }
      });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.deleteComment('comment1');
      });

      expect(props.showNotification).toHaveBeenCalledWith('Comment deletion is disabled until cards are revealed');

      areInteractionsDisabled.mockReturnValue(false);
    });

    it('should not edit nonexistent comment', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      await act(async () => {
        await result.current.editComment('nonexistent', 'Updated');
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not delete nonexistent comment', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      await act(async () => {
        await result.current.deleteComment('nonexistent');
      });

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null user gracefully for reactions', () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useCardOperations(props));

      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });

    it('should handle null user gracefully for comment authorship', () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useCardOperations(props));

      // The && chain returns undefined when user is null, which is falsy
      expect(result.current.isCommentAuthor({ createdBy: 'user1' })).toBeFalsy();
    });

    it('should handle null user gracefully for card authorship', () => {
      const props = createMockProps({
        user: null,
        cardData: { ...createMockProps().cardData, createdBy: 'user1' }
      });
      const { result } = renderHook(() => useCardOperations(props));

      // The && chain returns undefined when user is null, which is falsy
      expect(result.current.isCardAuthor()).toBeFalsy();
    });

    it('should handle null boardId gracefully for save', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));

      await act(async () => {
        await result.current.saveCardChanges();
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should handle null boardId gracefully for comment operations', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useCardOperations(props));

      act(() => {
        result.current.setNewComment('Test comment');
      });

      await act(async () => {
        await result.current.addComment();
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('Key Press Handling', () => {
    it('should call saveCardChanges on Enter key', async () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      await act(async () => {
        result.current.handleKeyPress({
          key: 'Enter',
          shiftKey: false,
          preventDefault: vi.fn()
        });
      });

      // saveCardChanges is called, which triggers set()
      expect(set).toHaveBeenCalled();
    });

    it('should not save on Shift+Enter', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.handleKeyPress({
          key: 'Enter',
          shiftKey: true,
          preventDefault: vi.fn()
        });
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should cancel editing on Escape key', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));
      const mockEvent = { stopPropagation: vi.fn() };

      // Enter edit mode
      act(() => {
        result.current.toggleEditMode(mockEvent);
      });
      expect(result.current.isEditing).toBe(true);

      // Change content
      act(() => {
        result.current.setEditedContent('Modified');
      });

      // Press Escape
      act(() => {
        result.current.handleKeyPress({
          key: 'Escape',
          shiftKey: false,
          preventDefault: vi.fn()
        });
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editedContent).toBe('Test card content');
    });
  });

  describe('State Management', () => {
    it('should update newComment text', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setNewComment('New comment text');
      });

      expect(result.current.newComment).toBe('New comment text');
    });

    it('should update emoji picker position', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setEmojiPickerPosition({ top: 100, left: 200 });
      });

      expect(result.current.emojiPickerPosition).toEqual({ top: 100, left: 200 });
    });

    it('should toggle showEmojiPicker', () => {
      const { result } = renderHook(() => useCardOperations(mockProps));

      act(() => {
        result.current.setShowEmojiPicker(true);
      });
      expect(result.current.showEmojiPicker).toBe(true);

      act(() => {
        result.current.setShowEmojiPicker(false);
      });
      expect(result.current.showEmojiPicker).toBe(false);
    });
  });
});
