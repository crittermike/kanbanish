import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom hook for card search and filtering.
 * Manages search query, filter state, and computes which cards match.
 *
 * @param {Object} params
 * @param {Object} params.columns - Column data from BoardContext
 * @param {Object|null} params.user - Current user object (for "my cards" filter)
 * @returns {Object} Search/filter state and operations
 */
export function useSearchFilter({ columns, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minVotes, setMinVotes] = useState(0);
  const [filterColumn, setFilterColumn] = useState(''); // '' = all columns
  const [myCardsOnly, setMyCardsOnly] = useState(false);
  const [groupedFilter, setGroupedFilter] = useState('all'); // 'all' | 'grouped' | 'ungrouped'
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Check if any filter is active
  const isFiltering = useMemo(() => (
    searchQuery.trim() !== '' ||
    minVotes > 0 ||
    filterColumn !== '' ||
    myCardsOnly ||
    groupedFilter !== 'all'
  ), [searchQuery, minVotes, filterColumn, myCardsOnly, groupedFilter]);

  // Check if a card's content or comments match the search query
  const cardMatchesSearch = useCallback((cardData, query) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();

    // Match against card content
    if (cardData.content && cardData.content.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Match against comment text
    if (cardData.comments) {
      for (const comment of Object.values(cardData.comments)) {
        if (comment.content && comment.content.toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Check if a card matches all active filters
  const cardMatchesFilters = useCallback((cardId, cardData, columnId) => {
    const query = searchQuery.trim();

    // Text search
    if (!cardMatchesSearch(cardData, query)) return false;

    // Min votes filter
    if (minVotes > 0 && (cardData.votes || 0) < minVotes) return false;

    // Column filter
    if (filterColumn && columnId !== filterColumn) return false;

    // My cards filter
    if (myCardsOnly && user?.uid && cardData.createdBy !== user.uid) return false;

    // Grouped/ungrouped filter
    if (groupedFilter === 'grouped' && !cardData.groupId) return false;
    if (groupedFilter === 'ungrouped' && cardData.groupId) return false;

    return true;
  }, [searchQuery, minVotes, filterColumn, myCardsOnly, groupedFilter, user, cardMatchesSearch]);

  // Compute matching card IDs and total counts
  const { matchingCardIds, totalCards, matchingCount } = useMemo(() => {
    const matching = new Set();
    let total = 0;

    if (!columns) return { matchingCardIds: matching, totalCards: 0, matchingCount: 0 };

    for (const [columnId, columnData] of Object.entries(columns)) {
      if (!columnData.cards) continue;

      for (const [cardId, cardData] of Object.entries(columnData.cards)) {
        total++;
        if (!isFiltering || cardMatchesFilters(cardId, cardData, columnId)) {
          matching.add(cardId);
        }
      }
    }

    return { matchingCardIds: matching, totalCards: total, matchingCount: matching.size };
  }, [columns, isFiltering, cardMatchesFilters]);

  // Also compute matching group IDs — a group matches if ANY card inside it matches
  const matchingGroupIds = useMemo(() => {
    const matching = new Set();

    if (!columns || !isFiltering) return matching;

    for (const [_columnId, columnData] of Object.entries(columns)) {
      if (!columnData.groups) continue;

      for (const [groupId, groupData] of Object.entries(columnData.groups)) {
        if (!groupData.cardIds) continue;

        // Check if any card in this group matches
        const hasMatchingCard = groupData.cardIds.some(cardId => matchingCardIds.has(cardId));

        // Also check group name against search query
        const query = searchQuery.trim().toLowerCase();
        const nameMatches = query && groupData.name && groupData.name.toLowerCase().includes(query);

        if (hasMatchingCard || nameMatches) {
          matching.add(groupId);
        }
      }
    }

    return matching;
  }, [columns, isFiltering, matchingCardIds, searchQuery]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setMinVotes(0);
    setFilterColumn('');
    setMyCardsOnly(false);
    setGroupedFilter('all');
  }, []);

  // Open search and focus input
  const openSearch = useCallback(() => {
    setIsOpen(true);
    // Focus input after render
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, []);

  // Close search and clear filters
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    clearFilters();
  }, [clearFilters]);

  // Keyboard shortcut: Ctrl+F / Cmd+F to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        if (isOpen) {
          searchInputRef.current?.focus();
        } else {
          openSearch();
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Get column options for the column filter dropdown
  const columnOptions = useMemo(() => {
    if (!columns) return [];
    return Object.entries(columns)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, data]) => ({ id, title: data.title || 'Untitled' }));
  }, [columns]);

  return {
    // State
    searchQuery,
    minVotes,
    filterColumn,
    myCardsOnly,
    groupedFilter,
    isOpen,
    isFiltering,
    searchInputRef,

    // Computed
    matchingCardIds,
    matchingGroupIds,
    totalCards,
    matchingCount,
    columnOptions,

    // Actions
    setSearchQuery,
    setMinVotes,
    setFilterColumn,
    setMyCardsOnly,
    setGroupedFilter,
    openSearch,
    closeSearch,
    clearFilters,
  };
}
