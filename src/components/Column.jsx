import { ref, set, remove } from 'firebase/database';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import useEmojiAutocomplete from '../hooks/useEmojiAutocomplete';
import { addCard, addCards } from '../utils/boardUtils';
import { database } from '../utils/firebase';
import { getDefaultGroupName } from '../utils/groupName';
import { parsePastedCards } from '../utils/pasteCards';
import { isGroupingAllowed, isCardCreationAllowed } from '../utils/workflowUtils';
import Card from './Card';
import CardGroup from './CardGroup';
import ColumnTimer from './ColumnTimer';
import EmojiAutocomplete from './EmojiAutocomplete';

const TYPING_INDICATOR_TIMEOUT_MS = 5000;

function Column({ columnId, columnData, sortByVotes, collapsed, onToggleCollapse, isFiltering, matchingCardIds, matchingGroupIds, onExpandCard }) {
  const { 
    boardId, 
    moveCard, 
    user, 
    createCardGroup, 
    retrospectiveMode, 
    workflowPhase, 
    columns,
    startCardCreation,
    stopCardCreation,
    displayName,
    userColor
  } = useBoardContext();
  const { showNotification } = useNotification();

  // Check if column timer has expired
  const isColumnTimerExpired = columnData.timer && (
    (columnData.timer.isRunning && columnData.timer.startedAt &&
      (Date.now() - columnData.timer.startedAt) / 1000 >= columnData.timer.duration) ||
    (columnData.timer.pausedRemaining !== null && columnData.timer.pausedRemaining !== undefined &&
      columnData.timer.pausedRemaining <= 0)
  );
  const [title, setTitle] = useState(columnData.title || 'New Column');
  const [isEditing, setIsEditing] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [splitOnSave, setSplitOnSave] = useState(false);
  const [newGroupId, setNewGroupId] = useState(null);
  const columnRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const newCardTextareaRef = useRef(null);

  const emojiAC = useEmojiAutocomplete(newCardContent, setNewCardContent, newCardTextareaRef);

  const clearNewGroupId = useCallback(() => setNewGroupId(null), []);

  // Only a multi-line paste offers to split; typed multi-line text stays one card
  const pastedCards = splitOnSave ? parsePastedCards(newCardContent) : [];
  const isSplitting = pastedCards.length > 1;

  // Update local title when columnData changes (from Firebase)
  useEffect(() => {
    if (columnData && columnData.title !== title && !isEditing) {
      setTitle(columnData.title);
    }
  }, [columnData, isEditing, title]);

  // Hide add card form when card creation is no longer allowed
  useEffect(() => {
    if (retrospectiveMode && !isCardCreationAllowed(workflowPhase, retrospectiveMode) && isAddingCard) {
      setIsAddingCard(false);
      stopCardCreation(); // Also stop tracking when form is hidden due to phase change
    }
  }, [workflowPhase, retrospectiveMode, isAddingCard, stopCardCreation, columnId]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Set up drop target for cards
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item, monitor) => {
      // Only handle the drop if it wasn't handled by a child component (like CardGroup)
      if (monitor.didDrop()) {
        return; // Child component already handled the drop
      }

      if (item.columnId !== columnId) {
        // Moving card between different columns
        moveCard(item.cardId, item.columnId, columnId);
      } else if (item.groupId) {
        // Moving card from group to column (ungrouping)
        moveCard(item.cardId, item.columnId, columnId, null);
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver()
    })
  }), [columnId, moveCard]);

  // Apply the drop ref to column content
  drop(columnRef);

  // Handle column title change
  const handleTitleChange = e => {
    setTitle(e.target.value);
  };

  // Save column title
  const saveColumnTitle = () => {
    if (boardId) {
      // Create a direct reference to the title path
      const titlePath = `boards/${boardId}/columns/${columnId}/title`;
      const titleRef = ref(database, titlePath);

      set(titleRef, title)
        .then(() => {
          // Column title updated successfully
          setIsEditing(false);
        })
        .catch(() => {
          // Error updating column title - silent fallback
        });
    }
  };

  // Handle key press (save on Enter)
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      saveColumnTitle();
    }
  };

  // Delete column
  const deleteColumn = () => {
    if (boardId && window.confirm('Are you sure you want to delete this column and all its cards?')) {
      const columnRef = ref(database, `boards/${boardId}/columns/${columnId}`);
      remove(columnRef)
        .catch(() => {
          // Error deleting column - silent fallback
        });
    }
  };

  // Clear any pending typing indicator timeout
  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Show the inline card form
  const showAddCardForm = () => {
    setIsAddingCard(true);
    setNewCardContent('');
    setSplitOnSave(false);
  };

  // Hide the inline card form
  const hideAddCardForm = () => {
    setIsAddingCard(false);
    setNewCardContent('');
    setSplitOnSave(false);
    clearTypingTimeout();
    stopCardCreation();
  };

  // Handle typing in the new card textarea — trigger typing indicator
  const handleNewCardChange = (e) => {
    setNewCardContent(e.target.value);
    emojiAC.onChange();
    startCardCreation(columnId);
    clearTypingTimeout();
    typingTimeoutRef.current = setTimeout(() => {
      stopCardCreation();
      typingTimeoutRef.current = null;
    }, TYPING_INDICATOR_TIMEOUT_MS);
  };

  const handleNewCardPaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (parsePastedCards(pasted).length > 1) {
      setSplitOnSave(true);
    }
  };

  const highlightNewCards = (cardIds) => {
    setTimeout(() => {
      cardIds.forEach((cardId, index) => {
        const newCardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!newCardElement) {
          return;
        }
        if (index === 0) {
          newCardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        // Add a subtle fading highlight effect via CSS animation
        newCardElement.classList.add('card-highlight');
        setTimeout(() => {
          newCardElement.classList.remove('card-highlight');
        }, 2000);
      });
    }, 100);
  };

  // Add a new card inline, or one card per line for a pasted list
  const saveNewCard = ({ split = isSplitting } = {}) => {
    if (boardId && newCardContent.trim()) {
      const save = split
        ? addCards(boardId, columnId, pastedCards, user, displayName, userColor)
        : addCard(boardId, columnId, newCardContent, user, displayName, userColor).then(cardId => [cardId]);
      save
        .then((cardIds) => {
          hideAddCardForm();
          highlightNewCards(cardIds);
        })
        .catch(error => {
          // Error adding card - handle user feedback
          if (error.message === 'Card content is required') {
            hideAddCardForm();
            showNotification('Empty cards are not allowed');
          }
        });
    } else {
      // Don't add empty cards
      hideAddCardForm();
      showNotification('Empty cards are not allowed');
    }
  };

  // Handle key press for new card
  const handleNewCardKeyPress = e => {
    // Let emoji autocomplete handle keys first when open
    if (emojiAC.isOpen) {
      emojiAC.onKeyDown(e);
      if (e.defaultPrevented) return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNewCard();
    } else if (e.key === 'Escape') {
      hideAddCardForm();
    }
  };

  // Sort cards by votes or creation time - only ungrouped cards
  const sortedCards = () => {
    if (!columnData.cards) {
      return [];
    }

    const cardsArray = Object.entries(columnData.cards)
      .filter(([_id, data]) => !data.groupId) // Only include cards not in groups
      .map(([id, data]) => ({
        id,
        ...data
      }));

    if (sortByVotes) {
      return cardsArray.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      // Sort by creation time - newest first (reverse chronological order)
      return cardsArray.sort((a, b) => (b.created || 0) - (a.created || 0));
    }
  };

  // Sort groups by votes or creation time
  const sortedGroups = () => {
    if (!columnData.groups) {
      return [];
    }

    const groupsArray = Object.entries(columnData.groups).map(([id, data]) => ({ id, ...data }));

    if (sortByVotes) {
      return groupsArray.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      // Sort by creation time - newest first (reverse chronological order)
      return groupsArray.sort((a, b) => (b.created || 0) - (a.created || 0));
    }
  };

  // Combine and sort all items (groups and cards) when sorting by votes
  const getSortedItems = () => {
    const cards = sortedCards().map(card => ({ type: 'card', data: card }));
    const groups = sortedGroups().map(group => ({ type: 'group', data: group }));

    if (sortByVotes) {
      // Combine all items and sort by votes
      return [...cards, ...groups].sort((a, b) => (b.data.votes || 0) - (a.data.votes || 0));
    } else {
      // Sort by creation time - newest first, with groups and cards intermixed
      const allItems = [...groups, ...cards];
      return allItems.sort((a, b) => (b.data.created || 0) - (a.data.created || 0));
    }
  };

  // Handle creating a group when a card is dropped onto another card after "Reveal All Cards" is clicked
  // Handle creating a group when a card is dropped onto another card during grouping phase
  const handleCardDropOnCard = (draggedCardId, targetCardId) => {
    if (!isGroupingAllowed(workflowPhase, retrospectiveMode)) {
      return;
    } // Only allow grouping during GROUPING phase
    if (draggedCardId === targetCardId) {
      return;
    } // Can't group with itself

    // Find which column the dragged card belongs to
    let draggedCardColumn = null;
    Object.keys(columns || {}).forEach(colId => {
      if (columns[colId].cards && columns[colId].cards[draggedCardId]) {
        draggedCardColumn = colId;
      }
    });

    if (!draggedCardColumn) {
      showNotification('Error: Could not find dragged card');
      return;
    }

    // Create the group right away, named after the target card; the creator can rename it inline
    const targetCard = columnData.cards?.[targetCardId];
    const groupName = getDefaultGroupName(targetCard?.content);
    const targetCreatedTime = targetCard?.created;

    if (draggedCardColumn === columnId) {
      setNewGroupId(createCardGroup(columnId, [draggedCardId, targetCardId], groupName, targetCreatedTime));
    } else {
      moveCard(draggedCardId, draggedCardColumn, columnId, null)
        .then(() => {
          setNewGroupId(createCardGroup(columnId, [draggedCardId, targetCardId], groupName, targetCreatedTime));
        })
        .catch(() => {
          showNotification('Error creating group across columns');
        });
    }
  };

  // Count total cards in this column (including grouped cards)
  const getCardCount = () => {
    const cardCount = columnData.cards ? Object.keys(columnData.cards).length : 0;
    return cardCount;
  };

  // Collapsed column view
  if (collapsed) {
    return (
      <div
        className="column collapsed"
        onClick={() => onToggleCollapse(columnId)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleCollapse(columnId); } }}
        aria-label={`Expand ${title} column (${getCardCount()} cards)`}
        title={`${title} — ${getCardCount()} cards. Click to expand.`}
      >
        <div className="column-header">
          <span className="collapsed-card-count">{getCardCount()}</span>
          <div className="collapsed-title-wrapper">
            <span className="collapsed-title">{title}</span>
          </div>
          <button
            className="collapse-toggle"
            aria-label={`Expand ${title} column`}
            onClick={e => { e.stopPropagation(); onToggleCollapse(columnId); }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={columnRef}
      className={`column${isColumnTimerExpired ? ' column-timer-expired' : ''}${isOver ? ' drag-over' : ''}`}
    >
      <div className="column-header">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={saveColumnTitle}
            onKeyPress={handleKeyPress}
            className="column-title-input"
            autoFocus
            aria-label="Column title"
          />
        ) : (
          <h2
            className="column-title"
            onClick={() => setIsEditing(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEditing(true); } }}
            role="button"
            tabIndex={0}
            title="Click to edit column title"
          >
            {title}
            <span className="column-card-count">{getCardCount()}</span>
          </h2>
        )}
        <div className="column-actions">
          <button
            className="collapse-toggle icon-button"
            title="Collapse column"
            onClick={() => onToggleCollapse(columnId)}
            aria-label="Collapse column"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <ColumnTimer columnId={columnId} timerData={columnData.timer} defaultTimerSeconds={columnData.defaultTimerSeconds} />
          {isCardCreationAllowed(workflowPhase, retrospectiveMode) && (
            <button className="icon-button" title="Delete Column" onClick={deleteColumn} aria-label="Delete column">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="column-content">
        {/* Render card groups and individual cards in sorted order */}
        {getSortedItems().map(item => {
          if (item.type === 'group') {
            return (
              <CardGroup
                key={item.data.id}
                groupId={item.data.id}
                groupData={item.data}
                columnId={columnId}
                columnData={columnData}
                sortByVotes={sortByVotes}
                dimmed={isFiltering && matchingGroupIds && !matchingGroupIds.has(item.data.id)}
                isFiltering={isFiltering}
                matchingCardIds={matchingCardIds}
                onExpandCard={onExpandCard}
                autoEditName={item.data.id === newGroupId}
                onAutoEditName={clearNewGroupId}
              />
            );
          } else {
            return (
              <Card
                key={item.data.id}
                cardId={item.data.id}
                cardData={item.data}
                columnId={columnId}
                onCardDropOnCard={handleCardDropOnCard}
                dimmed={isFiltering && matchingCardIds && !matchingCardIds.has(item.data.id)}
                onExpandCard={onExpandCard}
              />
            );
          }
        })}
      </div>

      {/* Add Card button / inline form — outside scrollable area so it's always visible */}
      {isAddingCard ? (
        <div className="inline-card-form">
          <textarea
            ref={newCardTextareaRef}
            placeholder="Enter card content..."
            value={newCardContent}
            onChange={handleNewCardChange}
            onKeyDown={handleNewCardKeyPress}
            onPaste={handleNewCardPaste}
            className="inline-card-textarea"
            autoFocus
            aria-label="Card content"
          />
          <EmojiAutocomplete
            loading={emojiAC.loading}
            error={emojiAC.error}
            suggestions={emojiAC.suggestions}
            selectedIndex={emojiAC.selectedIndex}
            onSelect={emojiAC.onSelect}
            inputRef={newCardTextareaRef}
          />
          <div className="inline-card-actions">
            <button className="btn secondary-btn" onClick={hideAddCardForm}>Cancel</button>
            {isSplitting && (
              <button className="btn secondary-btn" onClick={() => saveNewCard({ split: false })}>Add as 1</button>
            )}
            <button className="btn primary-btn" onClick={() => saveNewCard()}>
              {isSplitting ? `Add ${pastedCards.length} cards` : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        isCardCreationAllowed(workflowPhase, retrospectiveMode) && (
          <button className="add-card" onClick={showAddCardForm}>
            <Plus size={16} />
            Add Card
          </button>
        )
      )}
    </div>
  );
}

export default memo(Column);
