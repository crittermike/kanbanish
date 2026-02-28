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
  user: { uid: 'user1' },
  ...overrides
});

describe('useSearchFilter', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('isFiltering', () => {
    it('should be false when no filters are active', () => {
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

    it('should be true when minVotes > 0', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(2);
      });
      expect(result.current.isFiltering).toBe(true);
    });

    it('should be true when filterColumn is set', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setFilterColumn('a_col1');
      });
      expect(result.current.isFiltering).toBe(true);
    });

    it('should be true when myCardsOnly is true', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMyCardsOnly(true);
      });
      expect(result.current.isFiltering).toBe(true);
    });

    it('should be true when groupedFilter is "grouped"', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setGroupedFilter('grouped');
      });
      expect(result.current.isFiltering).toBe(true);
    });

    it('should be true when groupedFilter is "ungrouped"', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setGroupedFilter('ungrouped');
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

  describe('matchingCardIds and cardMatchesFilters', () => {
    it('should return all cards when no filters are active', () => {
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

    it('should filter by minVotes threshold', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(2);
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true); // votes: 3
      expect(result.current.matchingCardIds.has('card2')).toBe(false); // votes: 1
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // votes: 5
      expect(result.current.matchingCardIds.has('card4')).toBe(false); // votes: 0
      expect(result.current.matchingCardIds.size).toBe(2);
    });

    it('should filter by specific column', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setFilterColumn('a_col1');
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true);
      expect(result.current.matchingCardIds.has('card2')).toBe(true);
      expect(result.current.matchingCardIds.has('card3')).toBe(false);
      expect(result.current.matchingCardIds.has('card4')).toBe(false);
      expect(result.current.matchingCardIds.size).toBe(2);
    });

    it('should filter by myCardsOnly (own user)', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMyCardsOnly(true);
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true); // user1
      expect(result.current.matchingCardIds.has('card2')).toBe(false); // user2
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // user1
      expect(result.current.matchingCardIds.has('card4')).toBe(false); // user2
      expect(result.current.matchingCardIds.size).toBe(2);
    });

    it('should include all cards when myCardsOnly is true but user is null', () => {
      const { result } = renderHook(() => useSearchFilter(createMockProps({ user: null })));
      act(() => {
        result.current.setMyCardsOnly(true);
      });
      // user?.uid is falsy so the myCardsOnly check short-circuits — all cards pass
      expect(result.current.matchingCardIds.size).toBe(4);
    });

    it('should filter to grouped cards only', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setGroupedFilter('grouped');
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(false);
      expect(result.current.matchingCardIds.has('card2')).toBe(false);
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // has groupId
      expect(result.current.matchingCardIds.has('card4')).toBe(false);
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should filter to ungrouped cards only', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setGroupedFilter('ungrouped');
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true);
      expect(result.current.matchingCardIds.has('card2')).toBe(true);
      expect(result.current.matchingCardIds.has('card3')).toBe(false); // has groupId
      expect(result.current.matchingCardIds.has('card4')).toBe(true);
      expect(result.current.matchingCardIds.size).toBe(3);
    });

    it('should combine multiple filters with AND logic', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('meetings');
        result.current.setMinVotes(3);
      });
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // matches search AND votes >= 3
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should combine column filter with other filters', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setFilterColumn('a_col1');
        result.current.setMinVotes(2);
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(true); // col1, votes >= 2
      expect(result.current.matchingCardIds.has('card2')).toBe(false); // col1 but votes < 2
      expect(result.current.matchingCardIds.size).toBe(1);
    });
  });

  describe('matchingGroupIds', () => {
    it('should return empty set when no filters are active', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.matchingGroupIds.size).toBe(0);
    });

    it('should include group if any card inside matches filters', () => {
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

    it('should include group if any matching card OR group name matches', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('positive');
      });
      expect(result.current.matchingGroupIds.has('group1')).toBe(true);
      expect(result.current.matchingGroupIds.size).toBe(1);
    });

    it('should respect minVotes filter for group card membership', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(3);
      });
      expect(result.current.matchingGroupIds.has('group1')).toBe(true); // has card1 (votes: 3)
      expect(result.current.matchingGroupIds.has('group2')).toBe(true); // has card3 (votes: 5)
      expect(result.current.matchingGroupIds.size).toBe(2);
    });

    it('should exclude group if no cards match and name does not match', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(10);
      });
      expect(result.current.matchingGroupIds.size).toBe(0);
    });
  });

  describe('clearFilters', () => {
    it('should reset all filter state to defaults', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setMinVotes(3);
        result.current.setFilterColumn('a_col1');
        result.current.setMyCardsOnly(true);
        result.current.setGroupedFilter('grouped');
      });
      act(() => {
        result.current.clearFilters();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.minVotes).toBe(0);
      expect(result.current.filterColumn).toBe('');
      expect(result.current.myCardsOnly).toBe(false);
      expect(result.current.groupedFilter).toBe('all');
    });

    it('should result in isFiltering being false after clearFilters', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
      });
      expect(result.current.isFiltering).toBe(true);
      act(() => {
        result.current.clearFilters();
      });
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

    it('should clear all filters when closing', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setMinVotes(2);
        result.current.openSearch();
      });
      act(() => {
        result.current.closeSearch();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.minVotes).toBe(0);
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('columnOptions', () => {
    it('should return empty array when columns is null', () => {
      const { result } = renderHook(() => useSearchFilter(createMockProps({ columns: null })));
      expect(result.current.columnOptions).toEqual([]);
    });

    it('should return array of column options sorted alphabetically by id', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.columnOptions).toHaveLength(2);
      expect(result.current.columnOptions[0]).toEqual({ id: 'a_col1', title: 'Good stuff' });
      expect(result.current.columnOptions[1]).toEqual({ id: 'b_col2', title: 'Bad stuff' });
    });

    it('should use "Untitled" for columns without a title', () => {
      const props = createMockProps({
        columns: { 'a_col1': { cards: {} } }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      expect(result.current.columnOptions[0].title).toBe('Untitled');
    });

    it('should maintain sort order even with mixed id patterns', () => {
      const props = createMockProps({
        columns: {
          'c_col3': { title: 'Third' },
          'a_col1': { title: 'First' },
          'b_col2': { title: 'Second' }
        }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      expect(result.current.columnOptions).toHaveLength(3);
      expect(result.current.columnOptions[0].id).toBe('a_col1');
      expect(result.current.columnOptions[1].id).toBe('b_col2');
      expect(result.current.columnOptions[2].id).toBe('c_col3');
    });
  });

  describe('totalCards and matchingCount', () => {
    it('should return correct totalCards count', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.totalCards).toBe(4);
    });

    it('should return matching count equal to total when no filters', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.matchingCount).toBe(result.current.totalCards);
    });

    it('should return reduced matching count when filters are applied', () => {
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

    it('should return correct counts with multiple filter combinations', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(2);
        result.current.setFilterColumn('b_col2');
      });
      expect(result.current.totalCards).toBe(4);
      expect(result.current.matchingCount).toBe(1); // only card3 (votes: 5)
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

    it('should update minVotes', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(5);
      });
      expect(result.current.minVotes).toBe(5);
    });

    it('should update filterColumn', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setFilterColumn('b_col2');
      });
      expect(result.current.filterColumn).toBe('b_col2');
    });

    it('should update myCardsOnly', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMyCardsOnly(true);
      });
      expect(result.current.myCardsOnly).toBe(true);
    });

    it('should update groupedFilter', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setGroupedFilter('grouped');
      });
      expect(result.current.groupedFilter).toBe('grouped');
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

    it('should handle cards with missing votes property', () => {
      const props = createMockProps({
        columns: {
          'a_col1': {
            title: 'Test',
            cards: { 'card1': { content: 'test', createdBy: 'user1' } }
          }
        }
      });
      const { result } = renderHook(() => useSearchFilter(props));
      act(() => {
        result.current.setMinVotes(1);
      });
      expect(result.current.matchingCardIds.has('card1')).toBe(false);
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

    it('should handle empty search query (whitespace)', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('   ');
      });
      expect(result.current.matchingCardIds.size).toBe(4);
      expect(result.current.isFiltering).toBe(false);
    });

    it('should handle partial string matches in search', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('meet');
      });
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // 'Too many meetings'
      expect(result.current.matchingCardIds.size).toBe(1);
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
      // Groups without cardIds are skipped entirely (continue in loop), name match never checked
      expect(result.current.matchingGroupIds.has('group1')).toBe(false);
    });

    it('should include all cards when myCardsOnly is true but user has no uid', () => {
      const props = createMockProps({ user: {} });
      const { result } = renderHook(() => useSearchFilter(props));
      act(() => {
        result.current.setMyCardsOnly(true);
      });
      // user?.uid is undefined (falsy) so the myCardsOnly check short-circuits — all cards pass
      expect(result.current.matchingCardIds.size).toBe(4);
    });
  });

  describe('search input reference', () => {
    it('should provide searchInputRef', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      expect(result.current.searchInputRef).toBeDefined();
      expect(result.current.searchInputRef).toHaveProperty('current');
    });
  });

  describe('complex filter scenarios', () => {
    it('should combine search + minVotes + column + myCardsOnly', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('');
        result.current.setMinVotes(3);
        result.current.setFilterColumn('b_col2');
        result.current.setMyCardsOnly(true);
      });
      expect(result.current.matchingCardIds.has('card3')).toBe(true); // user1, col2, votes: 5
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should handle grouped filter with search query', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setSearchQuery('meetings');
        result.current.setGroupedFilter('grouped');
      });
      expect(result.current.matchingCardIds.has('card3')).toBe(true);
      expect(result.current.matchingCardIds.size).toBe(1);
    });

    it('should match nothing when filters conflict', () => {
      const { result } = renderHook(() => useSearchFilter(mockProps));
      act(() => {
        result.current.setMinVotes(100);
        result.current.setSearchQuery('test');
      });
      expect(result.current.matchingCardIds.size).toBe(0);
      expect(result.current.matchingCount).toBe(0);
    });
  });
});
