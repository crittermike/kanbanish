import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSearchFilter } from './useSearchFilter';

const createMockProps = (overrides = {}) => ({
  columns: {
    'a_col1': {
      title: 'Good stuff',
      cards: {
        'card1': { content: 'Great teamwork', votes: 3, createdBy: 'user1' },
        'card2': { content: 'Fast delivery', votes: 1, createdBy: 'user2', comments: { c1: { content: 'Agreed!' } } },
      },
      groups: {
        'group1': { name: 'Positive things', cardIds: ['card1'], votes: 3 }
      }
    },
    'b_col2': {
      title: 'Bad stuff',
      cards: {
        'card3': { content: 'Too many meetings', votes: 5, createdBy: 'user1', groupId: 'group2' },
        'card4': { content: 'Build is slow', votes: 0, createdBy: 'user2' },
      },
      groups: {
        'group2': { name: 'Process issues', cardIds: ['card3'], votes: 5 }
      }
    }
  },
  ...overrides
});

describe('useSearchFilter', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('isFiltering', () => {
    it('should be false when no search query is active', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.isFiltering).toBe(false);
    });

    it('should be true when searchQuery has text', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('team');
      });
      expect(result.current.isFiltering).toBe(true);
    });

    it('should be false when searchQuery is whitespace only', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('   ');
      });
      expect(result.current.isFiltering).toBe(false);
    });
  });

  describe('matchingCardIds — text search', () => {
    it('should return all cards when no search is active', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.matchingCardIds.size).toBe(4);
      expect(result.current.matchingCardIds.has('card1')).toBe(true);
      expect(result.current.matchingCardIds.has('card2')).toBe(true);
      expect(result.current.matchingCardIds.has('card3')).toBe(true);
      expect(result.current.matchingCardIds.has('card4')).toBe(true);
    });

    it('should filter by search query in card content (case-insensitive)', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('TEAM');
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true);
      expect(result.current.matchingCardIds.has('card2')).toBe(false);
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should filter by search query in comment content', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('Agreed');
      });
      expect(result.current.matchingCardIds.has('card2')).toBe(true);
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should handle partial string matches', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('meet');
      });
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // 'Too many meetings'
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should return all cards when search query is whitespace', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('   ');
      });
      expect(result.current.matchingCardIds.size).toBe(4);
      expect(result.current.isFiltering).toBe(false);
    });
  });

  describe('matchingGroupIds', () => {
    it('should return empty set when no search is active', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.matchingGroupIds.size).toBe(0);
    });

    it('should include group if any card inside matches search', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('teamwork');
      });
      expect(result.current.matchingGroupIds.has('group1')).toBe(true);
      expect(result.current.matchingGroupIds.size).toBe(1);
    });

    it('should include group if group name matches search query', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('Process');
      });
      expect(result.current.matchingGroupIds.has('group2')).toBe(true);
    });

    it('should include group if group name matches even when no card matches', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('positive');
      });
      expect(result.current.matchingGroupIds.has('group1')).toBe(true);
      expect(result.current.matchingGroupIds.size).toBe(1);
    });

    it('should exclude group if no cards match and name does not match', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('xyznonexistent');
      });
      expect(result.current.matchingGroupIds.size).toBe(0);
    });

    it('should handle groups with missing cardIds property', () => {
      const props = createMockProps({
        columns: {
          'a_col1': {
            title: 'Test',
            cards: { 'card1': { content: 'test', votes: 1, createdBy: 'user1' } },
            groups: { 'group1': { name: 'Test group' } }
          }
        }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      act(() => {
        result.current.setSearchQuery('test');
      });
      // Groups without cardIds are skipped
      expect(result.current.matchingGroupIds.has('group1')).toBe(false);
    });
  });

  describe('clearSearch', () => {
    it('should reset search query to empty string', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
      });
      expect(result.current.isFiltering).toBe(true);
      act(() => {
        result.current.clearSearch();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.isFiltering).toBe(false);
    });
  });

  describe('openSearch', () => {
    it('should set isOpen to true', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.isOpen).toBe(false);
      act(() => {
        result.current.openSearch();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should set focus on searchInputRef', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useSearchFilter(mockProps));
      const mockFocus = vi.fn();
      result.current.searchInputRef.current = { focus: mockFocus };
      act(() => {
        result.current.openSearch();
      });
      act(() => {
        vi.runAllTimers();
      });
      expect(mockFocus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('closeSearch', () => {
    it('should set isOpen to false', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.openSearch();
      });
      expect(result.current.isOpen).toBe(true);
      act(() => {
        result.current.closeSearch();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should clear search query when closing', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
        result.current.openSearch();
      });
      act(() => {
        result.current.closeSearch();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('totalCards and matchingCount', () => {
    it('should return correct totalCards count', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.totalCards).toBe(4);
    });

    it('should return matching count equal to total when no search', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.matchingCount).toBe(result.current.totalCards);
    });

    it('should return reduced matching count when search is applied', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('team');
      });
      expect(result.current.matchingCount).toBe(1);
      expect(result.current.totalCards).toBe(4);
    });

    it('should return 0 totalCards and matchingCount when columns is null', () => {
      const { result } = renderHook(() => useSearchFilter(createMockProps({ columns: null })));
      expect(result.current.totalCards).toBe(0);
      expect(result.current.matchingCount).toBe(0);
    });

    it('should handle columns with no cards', () => {
      const props = createMockProps({
        columns: { 'a_col1': { title: 'Empty', cards: {} } }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      expect(result.current.totalCards).toBe(0);
    });

    it('should return 0 matching when search finds nothing', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('xyznonexistent');
      });
      expect(result.current.matchingCardIds.size).toBe(0);
      expect(result.current.matchingCount).toBe(0);
    });
  });

  describe('state setters', () => {
    it('should update searchQuery', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
      });
      expect(result.current.searchQuery).toBe('test');
    });
  });

  describe('edge cases', () => {
    it('should handle columns with missing cards property', () => {
      const props = createMockProps({
        columns: { 'a_col1': { title: 'No cards' } }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      expect(result.current.totalCards).toBe(0);
      expect(result.current.matchingCardIds.size).toBe(0);
    });

    it('should handle cards with no comments', () => {
      const props = createMockProps({
        columns: {
          'a_col1': {
            title: 'Test',
            cards: { 'card1': { content: 'test', votes: 1, createdBy: 'user1' } }
          }
        }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      act(() => {
        result.current.setSearchQuery('comment');
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(false);
    });
  });

  describe('search input reference', () => {
    it('should provide searchInputRef', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.searchInputRef).toBeDefined();
      expect(result.current.searchInputRef).toHaveProperty('current');
    });
  });
});
