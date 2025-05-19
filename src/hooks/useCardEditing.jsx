import React, { useState, useCallback, useMemo } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export function useCardEditing({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  showNotification
}) {
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(cardData.content || '');

  // Memoized database reference
  const cardRef = useMemo(() => 
    ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`),
    [boardId, columnId, cardId]
  );

  // Toggle edit mode
  const toggleEditMode = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsEditing(!isEditing);
    setEditedContent(cardData.content || '');
  }, [isEditing, cardData.content]);

  // Save card changes
  const saveCardChanges = useCallback(async () => {
    if (!boardId) return;
    
    const trimmedContent = editedContent.trim();
    
    try {
      if (!trimmedContent) {
        await remove(cardRef);
        showNotification('Card deleted');
        return;
      }
      
      await set(cardRef, {
        ...cardData,
        content: trimmedContent
      });
      showNotification('Card saved');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  }, [boardId, cardRef, cardData, editedContent, showNotification]);

  // Delete card
  const deleteCard = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!boardId) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await remove(cardRef);
        showNotification('Card deleted');
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  }, [boardId, cardRef, showNotification]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveCardChanges();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(cardData.content || '');
    }
  }, [saveCardChanges, cardData.content]);

  // Format content
  const formatContentWithEmojis = useCallback((content) => {
    if (!content) return '';

    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }, []);

  return {
    // State
    isEditing,
    editedContent,
    
    // State setters
    setIsEditing,
    setEditedContent,
    
    // Card operations
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    handleKeyPress,
    
    // Content formatting
    formatContentWithEmojis,
    
    // Shared resources
    cardRef
  };
}