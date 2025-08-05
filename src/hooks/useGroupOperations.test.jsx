import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useGroupOperations } from './useGroupOperations';

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
}));

// Mock utilities
vi.mock('../utils/helpers', () => ({
  generateId: vi.fn(() => 'mock-id-123')
}));

vi.mock('../utils/workflowUtils', () => ({
  areInteractionsAllowed: vi.fn(() => true),
  areInteractionsRevealed: vi.fn(() => false)
}));

const mockProps = {
  boardId: 'board-123',
  columnId: 'column-456',
  groupId: 'group-789',
  groupData: {
    reactions: {
      '👍': { count: 2, users: { 'user1': true, 'user2': true } },
      '😄': { count: 1, users: { 'user1': true } }
    },
    comments: {
      'comment1': { content: 'Test comment', createdBy: 'user1', createdAt: 123456 }
    }
  },
  user: { uid: 'user1' },
  showNotification: vi.fn(),
  retrospectiveMode: false,
  workflowPhase: 'CREATION'
};

describe('useGroupOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      expect(result.current.showEmojiPicker).toBe(false);
      expect(result.current.showComments).toBe(false);
      expect(result.current.newComment).toBe('');
      expect(result.current.emojiPickerPosition).toEqual({ top: 0, left: 0 });
    });
  });

  describe('Reaction Operations', () => {
    it('should correctly identify user reactions', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(true);
      expect(result.current.hasUserReactedWithEmoji('😄')).toBe(true);
      expect(result.current.hasUserReactedWithEmoji('❤️')).toBe(false);
    });

    it('should handle missing reactions data', () => {
      const propsWithoutReactions = {
        ...mockProps,
        groupData: {}
      };
      const { result } = renderHook(() => useGroupOperations(propsWithoutReactions));

      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });
  });

  describe('Comment Operations', () => {
    it('should identify comment authorship correctly', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      const userComment = { createdBy: 'user1' };
      const otherComment = { createdBy: 'user2' };

      expect(result.current.isCommentAuthor(userComment)).toBe(true);
      expect(result.current.isCommentAuthor(otherComment)).toBe(false);
    });

    it('should toggle comments visibility', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      expect(result.current.showComments).toBe(false);

      act(() => {
        result.current.toggleComments();
      });

      expect(result.current.showComments).toBe(true);

      act(() => {
        result.current.toggleComments();
      });

      expect(result.current.showComments).toBe(false);
    });

    it('should close emoji picker when toggling comments', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      act(() => {
        result.current.setShowEmojiPicker(true);
      });

      expect(result.current.showEmojiPicker).toBe(true);

      act(() => {
        result.current.toggleComments();
      });

      expect(result.current.showEmojiPicker).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should update new comment text', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      act(() => {
        result.current.setNewComment('New comment text');
      });

      expect(result.current.newComment).toBe('New comment text');
    });

    it('should update emoji picker position', () => {
      const { result } = renderHook(() => useGroupOperations(mockProps));

      const newPosition = { top: 100, left: 200 };

      act(() => {
        result.current.setEmojiPickerPosition(newPosition);
      });

      expect(result.current.emojiPickerPosition).toEqual(newPosition);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      const propsWithoutUser = {
        ...mockProps,
        user: null
      };
      const { result } = renderHook(() => useGroupOperations(propsWithoutUser));

      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
      expect(result.current.isCommentAuthor({ createdBy: 'user1' })).toBe(false);
    });

    it('should handle missing group data gracefully', () => {
      const propsWithoutGroupData = {
        ...mockProps,
        groupData: {}
      };
      const { result } = renderHook(() => useGroupOperations(propsWithoutGroupData));

      expect(result.current.hasUserReactedWithEmoji('👍')).toBe(false);
    });
  });
});
