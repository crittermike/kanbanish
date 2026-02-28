import { ref, set, remove } from 'firebase/database';
import { memo, useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { addCard } from '../utils/boardUtils';
import { database } from '../utils/firebase';
import { isGroupingAllowed, isCardCreationAllowed } from '../utils/workflowUtils';
import Card from './Card';
import CardGroup from './CardGroup';

function Column({ columnId, columnData, sortByVotes, collapsed, onToggleCollapse, isFiltering, matchingCardIds, matchingGroupIds }) {
  const { 
    boardId, 
    moveCard, 
    user, 
    createCardGroup, 
    retrospectiveMode, 
    workflowPhase, 
    columns,
    startCardCreation,
    stopCardCreation
  } = useBoardContext();
  const { showNotification } = useNotification();
  const [title, setTitle] = useState(columnData.title || 'New Column');
  const [isEditing, setIsEditing] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [draggedCardForGrouping, setDraggedCardForGrouping] = useState(null);
  const columnRef = useRef(null);
  const groupModalRef = useRef(null);

  // Cancel group creation
  const cancelCreateGroup = () => {
    setShowGroupModal(false);
    setNewGroupName('');
    setDraggedCardForGrouping(null);
  };

  useFocusTrap(groupModalRef, showGroupModal, { onClose: cancelCreateGroup });

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
        showNotification('Card moved successfully');
      } else if (item.groupId) {
        // Moving card from group to column (ungrouping)
        moveCard(item.cardId, item.columnId, columnId, null);
        showNotification('Card removed from group');
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver()
    })
  }), [columnId, moveCard, showNotification]);

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
        .then(() => {
          showNotification('Column deleted');
        })
        .catch(() => {
          // Error deleting column - silent fallback
        });
    }
  };

  // Show the inline card form
  const showAddCardForm = () => {
    setIsAddingCard(true);
    setNewCardContent('');
    startCardCreation(columnId);
  };

  // Hide the inline card form
  const hideAddCardForm = () => {
    setIsAddingCard(false);
    setNewCardContent('');
    stopCardCreation();
  };

  // Add a new card inline
  const saveNewCard = () => {
    if (boardId && newCardContent.trim()) {
      addCard(boardId, columnId, newCardContent, user)
        .then((cardId) => {
          showNotification('Card added');
          hideAddCardForm();
          
          setTimeout(() => {
            const newCardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (newCardElement) {
              // Add a subtle fading highlight effect via CSS animation
              newCardElement.classList.add('card-highlight');
              setTimeout(() => {
                newCardElement.classList.remove('card-highlight');
              }, 2000);
            }
          }, 100);
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

    // Store both the card IDs and column info for group creation
    setDraggedCardForGrouping({
      draggedCardId,
      targetCardId,
      draggedCardColumn,
      targetCardColumn: columnId
    });
    setShowGroupModal(true);
    setNewGroupName('');
  };

  // Confirm group creation
  const confirmCreateGroup = () => {
    if (!newGroupName.trim()) {
      showNotification('Please enter a group name');
      return;
    }

    if (draggedCardForGrouping) {
      const { draggedCardId, targetCardId, draggedCardColumn, targetCardColumn } = draggedCardForGrouping;

      // Get the target card's created timestamp to maintain sort position
      const targetCard = columnData.cards?.[targetCardId];
      const targetCreatedTime = targetCard?.created;

      if (draggedCardColumn === targetCardColumn) {
        // Same column - create group directly
        createCardGroup(columnId, [draggedCardId, targetCardId], newGroupName.trim(), targetCreatedTime);
        showNotification(`Group "${newGroupName.trim()}" created`);
      } else {
        // Cross-column - move the dragged card first, then create group
        moveCard(draggedCardId, draggedCardColumn, targetCardColumn, null)
          .then(() => {
            // Now that the card has been moved, create the group
            createCardGroup(targetCardColumn, [draggedCardId, targetCardId], newGroupName.trim(), targetCreatedTime);
            showNotification(`Card moved and group "${newGroupName.trim()}" created`);
          })
          .catch(() => {
            // Error moving card for group creation
            showNotification('Error creating group across columns');
          });
      }
    }

    setShowGroupModal(false);
    setNewGroupName('');
    setDraggedCardForGrouping(null);
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
    <div className="column">
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
          </h2>
        )}
        <div className="column-actions">
          <button
            className="collapse-toggle icon-button"
            title="Collapse column"
            onClick={() => onToggleCollapse(columnId)}
            aria-label="Collapse column"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          {isCardCreationAllowed(workflowPhase, retrospectiveMode) && (
            <button className="icon-button" title="Delete Column" onClick={deleteColumn} aria-label="Delete column">
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={columnRef}
        className={`column-content ${isOver ? 'drag-over' : ''}`}
      >
        {sortedGroups().length === 0 && sortedCards().length === 0 && (
          <div className="empty-column-placeholder">
            <span>No cards yet</span>
            <span>Add a card to get started</span>
          </div>
        )}

        {isAddingCard ? (
          <div className="inline-card-form">
            <textarea
              placeholder="Enter card content..."
              value={newCardContent}
              onChange={e => setNewCardContent(e.target.value)}
              onKeyDown={handleNewCardKeyPress}
              className="inline-card-textarea"
              autoFocus
              aria-label="Card content"
            />
            <div className="inline-card-actions">
              <button className="btn primary-btn" onClick={saveNewCard}>Add</button>
              <button className="btn secondary-btn" onClick={hideAddCardForm}>Cancel</button>
            </div>
          </div>
        ) : (
          isCardCreationAllowed(workflowPhase, retrospectiveMode) && (
            <button className="add-card" onClick={showAddCardForm}>
              <Plus />
              Add Card
            </button>
          )
        )}

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
              />
            );
          }
        })}

        {/* Group creation modal */}
        {showGroupModal && (
          <div className="group-modal-overlay" onClick={cancelCreateGroup} role="presentation">
            <div ref={groupModalRef} className="group-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-group-title">
              <h3 id="create-group-title">Create Card Group</h3>
              <p>Creating a group with 2 cards</p>
              <input
                type="text"
                placeholder="Enter group name..."
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    confirmCreateGroup();
                  }
                  if (e.key === 'Escape') {
                    cancelCreateGroup();
                  }
                }}
                className="group-name-input"
                autoFocus
                aria-label="Group name"
              />
              <div className="group-modal-actions">
                <button className="btn primary-btn" onClick={confirmCreateGroup}>
                  Create Group
                </button>
                <button className="btn secondary-btn" onClick={cancelCreateGroup}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Column);
