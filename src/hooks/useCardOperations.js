import { useState } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export const useCardOperations = ({ cardId, columnId, cardData, boardId, showNotification }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(cardData.content || '');

  const getCardRef = () => {
    return ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);
  };

  const toggleEditMode = (e) => {
    if (e) e.stopPropagation();
    setIsEditing(!isEditing);
    setEditedContent(cardData.content || '');
  };

  const saveCardChanges = async () => {
    if (!boardId) return;
    
    const cardRef = getCardRef();
    const trimmedContent = editedContent.trim();
    
    try {
      if (!trimmedContent) {
        await remove(cardRef);
        showNotification('Card deleted');
        return;
      }
      
      const updates = {
        ...cardData,
        content: trimmedContent
      };
      
      await set(cardRef, updates);
      showNotification('Card saved');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const deleteCard = async (e) => {
    e.stopPropagation();
    
    if (!boardId) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const cardRef = getCardRef();
        await remove(cardRef);
        showNotification('Card deleted');
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const updateVotes = async (delta, e, message) => {
    e.stopPropagation();
    
    if (!boardId) return;
    
    const currentVotes = cardData.votes || 0;
    if (delta < 0 && currentVotes <= 0) return;
    
    try {
      const newVotes = currentVotes + delta;
      const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
      await set(votesRef, newVotes);
      showNotification(message);
    } catch (error) {
      console.error('Error updating votes:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveCardChanges();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(cardData.content || '');
    }
  };

  return {
    isEditing,
    editedContent,
    setEditedContent,
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    updateVotes,
    handleKeyPress
  };
}; 