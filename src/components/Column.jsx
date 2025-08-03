import React, { useState, useRef, useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Card from './Card';
import CardGroup from './CardGroup';
import { generateId } from '../utils/helpers';
import { addCard } from '../utils/boardUtils';
import { useDrop } from 'react-dnd';
import { Trash2, Plus } from 'react-feather';

function Column({ columnId, columnData, sortByVotes, showNotification }) {
  const { boardId, moveCard, votingEnabled, user, createCardGroup, revealMode, cardsRevealed } = useBoardContext();
  const [title, setTitle] = useState(columnData.title || 'New Column');
  const [isEditing, setIsEditing] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [draggedCardForGrouping, setDraggedCardForGrouping] = useState(null);
  const columnRef = useRef(null);

  // Update local title when columnData changes (from Firebase)
  useEffect(() => {
    if (columnData && columnData.title !== title && !isEditing) {
      setTitle(columnData.title);
    }
  }, [columnData, isEditing, title]);

  // Hide add card form when cards are revealed
  useEffect(() => {
    if (cardsRevealed && isAddingCard) {
      setIsAddingCard(false);
      setNewCardContent('');
    }
  }, [cardsRevealed, isAddingCard]);

  // Set up drop target for cards
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => {
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
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [columnId, moveCard, showNotification]);

  // Apply the drop ref to column content
  drop(columnRef);

  // Handle column title change
  const handleTitleChange = (e) => {
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
          console.log('Column title updated');
          setIsEditing(false);
        })
        .catch((error) => {
          console.error('Error updating column title:', error);
        });
    }
  };

  // Handle key press (save on Enter)
  const handleKeyPress = (e) => {
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
        .catch((error) => {
          console.error('Error deleting column:', error);
        });
    }
  };

  // Show the inline card form
  const showAddCardForm = () => {
    setIsAddingCard(true);
    setNewCardContent('');
  };

  // Hide the inline card form
  const hideAddCardForm = () => {
    setIsAddingCard(false);
    setNewCardContent('');
  };

  // Add a new card inline
  const saveNewCard = () => {
    if (boardId && newCardContent.trim()) {
      addCard(boardId, columnId, newCardContent, user)
        .then(() => {
          showNotification('Card added');
          hideAddCardForm();
        })
        .catch((error) => {
          console.error('Error adding card:', error);
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
  const handleNewCardKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNewCard();
    } else if (e.key === 'Escape') {
      hideAddCardForm();
    }
  };

  // Sort cards by votes or creation time
  const sortedCards = () => {
    if (!columnData.cards) return [];

    const cardsArray = Object.entries(columnData.cards).map(([id, data]) => ({
      id,
      ...data
    }));

    if (sortByVotes) {
      return cardsArray.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      return cardsArray.sort((a, b) => (a.created || 0) - (b.created || 0));
    }
  };

  // Sort groups by votes or creation time
  const sortedGroups = () => {
    if (!columnData.groups) return [];

    const groupsArray = Object.entries(columnData.groups).map(([id, data]) => ({ id, ...data }));

    if (sortByVotes) {
      return groupsArray.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      return groupsArray.sort((a, b) => (a.created || 0) - (b.created || 0));
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
      // Sort by creation time - groups first, then cards
      const allItems = [...groups, ...cards];
      return allItems.sort((a, b) => (a.data.created || 0) - (b.data.created || 0));
    }
  };

  // Handle creating a group when a card is dropped onto another card after "Reveal All Cards" is clicked
  const handleCardDropOnCard = (draggedCardId, targetCardId) => {
    if (!revealMode || !cardsRevealed) return; // Only allow grouping after cards are revealed
    if (draggedCardId === targetCardId) return; // Can't group with itself
    
    setDraggedCardForGrouping({ draggedCardId, targetCardId });
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
      // Create group from dragged card onto target card
      const { draggedCardId, targetCardId } = draggedCardForGrouping;
      
      // Get the target card's created timestamp to maintain sort position
      const targetCard = columnData.cards?.[targetCardId];
      const targetCreatedTime = targetCard?.created;
      
      createCardGroup(columnId, [draggedCardId, targetCardId], newGroupName.trim(), targetCreatedTime);
      showNotification(`Group "${newGroupName.trim()}" created`);
    }

    setShowGroupModal(false);
    setNewGroupName('');
    setDraggedCardForGrouping(null);
  };

  // Cancel group creation
  const cancelCreateGroup = () => {
    setShowGroupModal(false);
    setNewGroupName('');
    setDraggedCardForGrouping(null);
  };

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
          />
        ) : (
          <h2 className="column-title" onClick={() => setIsEditing(true)}>
            {title}
          </h2>
        )}
        <div className="column-actions">
          {!cardsRevealed && (
            <button className="icon-button" title="Delete Column" onClick={deleteColumn}>
              <Trash2 />
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

        {/* Render card groups and individual cards in sorted order */}
        {getSortedItems().map((item) => {
          if (item.type === 'group') {
            return (
              <CardGroup
                key={item.data.id}
                groupId={item.data.id}
                groupData={item.data}
                columnId={columnId}
                sortByVotes={sortByVotes}
                showNotification={showNotification}
              />
            );
          } else {
            return (
              <Card
                key={item.data.id}
                cardId={item.data.id}
                cardData={item.data}
                columnId={columnId}
                showNotification={showNotification}
                onCardDropOnCard={handleCardDropOnCard}
              />
            );
          }
        })}

        {isAddingCard ? (
          <div className="inline-card-form">
            <textarea
              placeholder="Enter card content..."
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              onKeyDown={handleNewCardKeyPress}
              className="inline-card-textarea"
              autoFocus
            />
            <div className="inline-card-actions">
              <button className="btn primary-btn" onClick={saveNewCard}>Add</button>
              <button className="btn secondary-btn" onClick={hideAddCardForm}>Cancel</button>
            </div>
          </div>
        ) : (
          !cardsRevealed && (
            <button className="add-card" onClick={showAddCardForm}>
              <Plus />
              Add Card
            </button>
          )
        )}

        {/* Group creation modal */}
        {showGroupModal && (
          <div className="group-modal-overlay" onClick={cancelCreateGroup}>
            <div className="group-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Create Card Group</h3>
              <p>Creating a group with 2 cards</p>
              <input
                type="text"
                placeholder="Enter group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmCreateGroup();
                  if (e.key === 'Escape') cancelCreateGroup();
                }}
                className="group-name-input"
                autoFocus
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

export default Column;
