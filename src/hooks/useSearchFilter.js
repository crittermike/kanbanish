import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Default structured filter state.
 * Text search and structured filters combine with AND logic.
 * Within a filter category, multiple selections use OR logic.
 */
const DEFAULT_FILTERS = {
  tags: [],            // string[] — selected tag names (OR within)
  authorSelf: false,   // boolean — show only cards created by current user
  votesPreset: 'all',  // 'all' | 'has-votes' | 'no-votes' | 'top'
  colors: [],          // string[] — selected card border colors (OR within)
  hasComments: null,    // null (any) | true | false
  hasReactions: null,   // null (any) | true | false
  groupStatus: 'all',  // 'all' | 'grouped' | 'ungrouped'
};

/**
 * Custom hook for card search and structured filtering.
 * Manages search query state, structured filters, and computes which cards match.
 *
 * @param {Object} params
 * @param {Object} params.columns - Column data from BoardContext
 * @param {string} [params.userId] - Current user's Firebase UID (for "my cards" filter)
 * @returns {Object} Search state, filter state, and operations
 */
export function useSearchFilter({ columns, userId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const searchInputRef = useRef(null);

  // Check if any structured filters are active
  const hasActiveFilters = useMemo(() => (
    filters.tags.length > 0 ||
    filters.authorSelf ||
    filters.votesPreset !== 'all' ||
    filters.colors.length > 0 ||
    filters.hasComments !== null ||
    filters.hasReactions !== null ||
    filters.groupStatus !== 'all'
  ), [filters]);

  // Check if any filtering (text or structured) is active
  const isFiltering = useMemo(() => (
    searchQuery.trim() !== '' || hasActiveFilters
  ), [searchQuery, hasActiveFilters]);

  // Count active filter categories (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tags.length > 0) count++;
    if (filters.authorSelf) count++;
    if (filters.votesPreset !== 'all') count++;
    if (filters.colors.length > 0) count++;
    if (filters.hasComments !== null) count++;
    if (filters.hasReactions !== null) count++;
    if (filters.groupStatus !== 'all') count++;
    return count;
  }, [filters]);

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

  // Compute the maximum vote count across all cards (for "top" votes filter)
  const maxVotes = useMemo(() => {
    let max = 0;
    if (!columns) return max;
    for (const columnData of Object.values(columns)) {
      if (!columnData.cards) continue;
      for (const cardData of Object.values(columnData.cards)) {
        const v = cardData.votes || 0;
        if (v > max) max = v;
      }
    }
    return max;
  }, [columns]);

  // Check if a card matches all structured filters (AND across categories)
  const cardMatchesFilters = useCallback((cardData, currentFilters, uid) => {
    // Tags filter (OR within)
    if (currentFilters.tags.length > 0) {
      const cardTags = cardData.tags || [];
      if (!currentFilters.tags.some(tag => cardTags.includes(tag))) {
        return false;
      }
    }

    // Author self filter
    if (currentFilters.authorSelf && uid) {
      if (cardData.createdBy !== uid) {
        return false;
      }
    }

    // Votes preset filter
    if (currentFilters.votesPreset !== 'all') {
      const votes = cardData.votes || 0;
      switch (currentFilters.votesPreset) {
      case 'has-votes':
        if (votes <= 0) return false;
        break;
      case 'no-votes':
        if (votes !== 0) return false;
        break;
      case 'top':
        // "Top" means cards with the highest vote count (only if there are votes)
        if (maxVotes <= 0 || votes < maxVotes) return false;
        break;
      }
    }

    // Colors filter (OR within)
    if (currentFilters.colors.length > 0) {
      if (!currentFilters.colors.includes(cardData.color || '')) {
        return false;
      }
    }

    // Has comments filter
    if (currentFilters.hasComments !== null) {
      const has = cardData.comments && Object.keys(cardData.comments).length > 0;
      if (currentFilters.hasComments !== !!has) {
        return false;
      }
    }

    // Has reactions filter
    if (currentFilters.hasReactions !== null) {
      const has = cardData.reactions && Object.values(cardData.reactions).some(r => r.count > 0);
      if (currentFilters.hasReactions !== !!has) {
        return false;
      }
    }

    // Group status filter
    if (currentFilters.groupStatus !== 'all') {
      const isGrouped = !!cardData.groupId;
      if (currentFilters.groupStatus === 'grouped' && !isGrouped) return false;
      if (currentFilters.groupStatus === 'ungrouped' && isGrouped) return false;
    }

    return true;
  }, [maxVotes]);

  // Compute matching card IDs and total counts
  const { matchingCardIds, totalCards, matchingCount } = useMemo(() => {
    const matching = new Set();
    let total = 0;

    if (!columns) return { matchingCardIds: matching, totalCards: 0, matchingCount: 0 };

    const query = searchQuery.trim();

    for (const [_columnId, columnData] of Object.entries(columns)) {
      if (!columnData.cards) continue;

      for (const [cardId, cardData] of Object.entries(columnData.cards)) {
        total++;
        const textMatch = !query || cardMatchesSearch(cardData, query);
        const filterMatch = !hasActiveFilters || cardMatchesFilters(cardData, filters, userId);
        if (!isFiltering || (textMatch && filterMatch)) {
          matching.add(cardId);
        }
      }
    }

    return { matchingCardIds: matching, totalCards: total, matchingCount: matching.size };
  }, [columns, isFiltering, hasActiveFilters, cardMatchesSearch, cardMatchesFilters, searchQuery, filters, userId]);

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

  // Clear all structured filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Clear everything (text + filters)
  const clearAll = useCallback(() => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Clear search text only
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Toggle a single filter value (for tag and color multi-select)
  const toggleFilterValue = useCallback((filterKey, value) => {
    setFilters(prev => {
      const current = prev[filterKey];
      if (!Array.isArray(current)) return prev;
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterKey]: next };
    });
  }, []);

  // Set a single filter key to a value
  const setFilterValue = useCallback((filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  }, []);

  // Open search and focus input
  const openSearch = useCallback(() => {
    setIsOpen(true);
    // Focus input after render
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, []);

  // Close search and clear everything
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setIsFilterPanelOpen(false);
    clearAll();
  }, [clearAll]);

  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(prev => !prev);
  }, []);

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
      // Ctrl/Cmd+Shift+F for filter panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        if (!isOpen) {
          openSearch();
        }
        setIsFilterPanelOpen(prev => !prev);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  return {
    // State
    searchQuery,
    isOpen,
    isFiltering,
    isFilterPanelOpen,
    searchInputRef,

    // Filters
    filters,
    hasActiveFilters,
    activeFilterCount,

    // Computed
    matchingCardIds,
    matchingGroupIds,
    totalCards,
    matchingCount,

    // Actions
    setSearchQuery,
    openSearch,
    closeSearch,
    clearSearch,
    clearFilters,
    clearAll,
    toggleFilterPanel,
    toggleFilterValue,
    setFilterValue,
  };
}
