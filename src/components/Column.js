import React, { useState } from 'react';
import { ref, set, remove, push } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Card from './Card';
import { generateId } from '../utils/helpers';

function Column({ columnId, columnData, sortByVotes, showNotification }) {
  const { 
    boardRef,
    boardId, 
    setActiveCardId, 
    setActiveColumnId, 
    setIsNewCard 
  } = useBoardContext();
  const [title, setTitle] = useState(columnData.title || 'New Column');
  const [isEditing, setIsEditing] = useState(false);

  // Handle column title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Save column title
  const saveColumnTitle = () => {
    if (boardId) {
      const titleRef = ref(database, `boards/${boardId}/columns/${columnId}/title`);
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

  // Add a new card
  const addNewCard = () => {
    if (boardId) {
      const cardId = generateId();
      const cardData = {
        content: '',
        votes: 0,
        created: Date.now()
      };
      
      // Create a direct reference to the card path
      const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);

      set(cardRef, cardData)
        .then(() => {
          setActiveCardId(cardId);
          setActiveColumnId(columnId);
          setIsNewCard(true);
          document.getElementById('card-detail-modal').style.display = 'flex';
          showNotification('Card added');
        })
        .catch((error) => {
          console.error('Error adding card:', error);
        });
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
          <h2 className="column-title" onClick={() => setIsEditing(true)}>
            {title}
          </h2>
        )}
        <div className="column-actions">
          <button className="icon-button" title="Delete Column" onClick={deleteColumn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="column-content">
        {sortedCards().map((card) => (
          <Card 
            key={card.id} 
            cardId={card.id} 
            cardData={card} 
            columnId={columnId}
            showNotification={showNotification}
          />
        ))}
        <button className="add-card" onClick={addNewCard}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Card
        </button>
      </div>
    </div>
  );
}

export default Column;
