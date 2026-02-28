import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom hook for card text search.
 * Manages search query state and computes which cards match.
 *
 * @param {Object} params
 * @param {Object} params.columns - Column data from BoardContext
 * @returns {Object} Search state and operations
 */
export function useSearchFilter({ columns }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Check if search is active
  const isFiltering = useMemo(() => (
    searchQuery.trim() !== ''
  ), [searchQuery]);

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
        if (!isFiltering || cardMatchesSearch(cardData, query)) {
          matching.add(cardId);
        }
      }
    }

    return { matchingCardIds: matching, totalCards: total, matchingCount: matching.size };
  }, [columns, isFiltering, cardMatchesSearch, searchQuery]);

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

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Open search and focus input
  const openSearch = useCallback(() => {
    setIsOpen(true);
    // Focus input after render
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, []);

  // Close search and clear
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    clearSearch();
  }, [clearSearch]);

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

  return {
    // State
    searchQuery,
    isOpen,
    isFiltering,
    searchInputRef,

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
  };
}
