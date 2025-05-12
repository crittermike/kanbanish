import React, { useState, useRef, useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Card from './Card';
import { generateId } from '../utils/helpers';
import { addCard } from '../utils/boardUtils';
import { useDrop } from 'react-dnd';
import { Trash2, Plus, Lock } from 'react-feather';

function Column({ columnId, columnData, sortByVotes, showNotification }) {
  const { boardId, moveCard, votingEnabled, boardLocked } = useBoardContext();
  const [title, setTitle] = useState(columnData.title || 'New Column');
  const [isEditing, setIsEditing] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const columnRef = useRef(null);
  
  // Update local title when columnData changes (from Firebase)
  useEffect(() => {
    if (columnData && columnData.title !== title && !isEditing) {
      setTitle(columnData.title);
    }
  }, [columnData, isEditing, title]);

  // Set up drop target for cards
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => {
      if (boardLocked) {
        showNotification('Board is locked - Cannot move cards');
        return;
      }
      if (item.columnId !== columnId) {
        moveCard(item.cardId, item.columnId, columnId);
        showNotification('Card moved successfully');
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [columnId, moveCard, showNotification, boardLocked]);

  // Apply the drop ref to column content
  drop(columnRef);

  // Handle column title change
  const handleTitleChange = (e) => {
    if (boardLocked) {
      showNotification('Board is locked - Cannot edit column title');
      return;
    }
    setTitle(e.target.value);
  };

  // Save column title
  const saveColumnTitle = () => {
    if (boardLocked) {
      showNotification('Board is locked - Cannot edit column title');
      setIsEditing(false);
      return;
    }
    
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
    if (boardLocked) {
      showNotification('Board is locked - Cannot delete column');
      return;
    }
    
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
    if (boardLocked) {
      showNotification('Board is locked - Cannot add cards');
      return;
    }
    
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
      addCard(boardId, columnId, newCardContent)
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
      return cardsArray.sort((a, b) => b.votes - a.votes);
    } else {
      return cardsArray.sort((a, b) => a.created - b.created);
    }
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
          <h2 className="column-title" onClick={() => boardLocked ? showNotification('Board is locked - Cannot edit column title') : setIsEditing(true)}>
            {title}
            {boardLocked && <Lock size={14} className="ml-2" style={{ marginLeft: '6px', opacity: 0.7 }} />}
          </h2>
        )}
        <div className="column-actions">
          <button 
            className="icon-button" 
            title={boardLocked ? "Board is locked - Cannot delete column" : "Delete Column"} 
            onClick={deleteColumn}
            disabled={boardLocked}
          >
            <Trash2 style={{ opacity: boardLocked ? 0.5 : 1 }} />
          </button>
        </div>
      </div>
      <div 
        ref={columnRef}
        className={`column-content ${isOver ? 'drag-over' : ''}`}
      >
        {sortedCards().length === 0 && (
          <div className="empty-column-placeholder">
            <span>No cards yet</span>
            <span>Add a card to get started</span>
          </div>
        )}
        
        {sortedCards().map((card) => (
          <Card 
            key={card.id} 
            cardId={card.id} 
            cardData={card} 
            columnId={columnId}
            showNotification={showNotification}
          />
        ))}
        
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
          <button 
            className={`add-card ${boardLocked ? 'disabled' : ''}`} 
            onClick={showAddCardForm}
            disabled={boardLocked}
            title={boardLocked ? "Board is locked - Cannot add cards" : "Add Card"}
          >
            <Plus style={{ opacity: boardLocked ? 0.5 : 1 }} />
            Add Card {boardLocked && <Lock size={14} style={{ marginLeft: '5px', opacity: 0.7 }} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Column;
