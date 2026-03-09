import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Flattens columns into an ordered array of cards with column context.
 * Cards are ordered by column key (alphabetical prefix), then by card key within each column.
 * Groups are expanded into their constituent cards.
 *
 * @param {Object} columns - Board columns from context
 * @param {boolean} sortByVotes - Whether to sort cards by votes (descending) within each column
 * @returns {Array<{ cardId: string, cardData: Object, columnId: string, columnTitle: string, groupId?: string, groupName?: string }>}
 */
const flattenCards = (columns, sortByVotes) => {
  if (!columns || Object.keys(columns).length === 0) {
    return [];
  }

  const result = [];

  // Sort column keys (they have alphabet prefixes like a_xxx, b_xxx)
  const sortedColumnKeys = Object.keys(columns).sort();

  for (const columnId of sortedColumnKeys) {
    const column = columns[columnId];
    if (!column?.cards) {
      continue;
    }

    const columnTitle = column.title || 'Untitled';
    const cards = column.cards;
    const groups = column.groups || {};

    // Separate grouped and ungrouped cards
    const groupedCardIds = new Set();
    const groupEntries = Object.entries(groups);

    // Process groups first to maintain group ordering
    for (const [_groupId, groupData] of groupEntries) {
      if (groupData.cardIds && Array.isArray(groupData.cardIds)) {
        for (const cardId of groupData.cardIds) {
          groupedCardIds.add(cardId);
        }
      }
    }

    // Collect ungrouped cards
    let ungroupedCards = Object.entries(cards)
      .filter(([cardId]) => !groupedCardIds.has(cardId))
      .map(([cardId, cardData]) => ({
        cardId,
        cardData,
        columnId,
        columnTitle,
        votes: cardData.votes || 0
      }));

    // Sort ungrouped cards by votes if requested, otherwise by key
    if (sortByVotes) {
      ungroupedCards.sort((a, b) => b.votes - a.votes);
    }

    // Process groups: add group header info, then cards in the group
    for (const [groupId, groupData] of groupEntries) {
      if (!groupData.cardIds || !Array.isArray(groupData.cardIds)) {
        continue;
      }

      let groupCards = groupData.cardIds
        .filter(cardId => cards[cardId])
        .map(cardId => ({
          cardId,
          cardData: cards[cardId],
          columnId,
          columnTitle,
          groupId,
          groupName: groupData.name || 'Unnamed Group',
          votes: cards[cardId]?.votes || 0
        }));

      if (sortByVotes) {
        groupCards.sort((a, b) => b.votes - a.votes);
      }

      result.push(...groupCards);
    }

    // Add ungrouped cards
    result.push(...ungroupedCards);
  }

  return result;
};

/**
 * Hook for Focus Mode — a full-screen presentation view for navigating cards.
 *
 * @param {Object} params
 * @param {Object} params.columns - Board columns from context
 * @param {boolean} params.sortByVotes - Whether cards are sorted by votes
 * @returns {Object} Focus mode state and controls
 */
const useFocusMode = ({ columns, sortByVotes = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5000); // 5 seconds default

  // Flatten cards when columns or sort order changes
  const cards = useMemo(
    () => flattenCards(columns, sortByVotes),
    [columns, sortByVotes]
  );

  const totalCards = cards.length;
  const currentCard = cards[currentIndex] || null;

  // Clamp index if cards change (e.g., card deleted while in focus mode)
  useEffect(() => {
    if (currentIndex >= totalCards && totalCards > 0) {
      setCurrentIndex(totalCards - 1);
    }
  }, [currentIndex, totalCards]);

  // Navigate to next card
  const goNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, totalCards - 1));
  }, [totalCards]);

  // Navigate to previous card
  const goPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Jump to a specific card index
  const goToIndex = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalCards - 1)));
  }, [totalCards]);

  // Enter focus mode
  const enter = useCallback(() => {
    setCurrentIndex(0);
    setAutoPlayActive(false);
    setIsActive(true);
  }, []);

  // Exit focus mode
  const exit = useCallback(() => {
    setIsActive(false);
    setAutoPlayActive(false);
    setCurrentIndex(0);
  }, []);

  // Toggle auto-play
  const toggleAutoPlay = useCallback(() => {
    setAutoPlayActive(prev => !prev);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!autoPlayActive || !isActive) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= totalCards - 1) {
          setAutoPlayActive(false);
          return prev;
        }
        return prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayActive, isActive, totalCards, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (e) => {
      switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goPrev();
        break;
      case 'Escape':
        e.preventDefault();
        exit();
        break;
      case ' ':
        e.preventDefault();
        toggleAutoPlay();
        break;
      case 'Home':
        e.preventDefault();
        goToIndex(0);
        break;
      case 'End':
        e.preventDefault();
        goToIndex(totalCards - 1);
        break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, goNext, goPrev, exit, toggleAutoPlay, goToIndex, totalCards]);

  // Lock body scroll when active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  return {
    isActive,
    currentIndex,
    currentCard,
    totalCards,
    cards,
    goNext,
    goPrev,
    goToIndex,
    enter,
    exit,
    autoPlayActive,
    autoPlayInterval,
    setAutoPlayInterval,
    toggleAutoPlay
  };
};

export { flattenCards };
export default useFocusMode;
