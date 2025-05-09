import { useState, useCallback, useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export function useCardReactions({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  user, 
  showNotification,
  setShowComments
}) {
  // State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  
  // Set showComments to false when opening emoji picker
  const toggleEmojiPicker = useCallback((value, position) => {
    setShowEmojiPicker(value);
    if (position) {
      setEmojiPickerPosition(position);
    }
    // If opening emoji picker, close comments
    if (value === true && setShowComments) {
      setShowComments(false);
    }
  }, [setShowComments]);

  // Reaction operations
  const hasUserReactedWithEmoji = useCallback((emoji) => {
    return !!(cardData.reactions && 
            cardData.reactions[emoji] && 
            cardData.reactions[emoji].users && 
            cardData.reactions[emoji].users[user?.uid]);
  }, [cardData.reactions, user?.uid]);

  const getReactionCount = useCallback((emoji) => {
    return (cardData.reactions && 
            cardData.reactions[emoji] && 
            cardData.reactions[emoji].count) || 0;
  }, [cardData.reactions]);

  const getReactionRefs = useCallback((emoji) => {
    const basePath = `boards/${boardId}/columns/${columnId}/cards/${cardId}/reactions/${emoji}`;
    return {
      userRef: ref(database, `${basePath}/users/${user?.uid}`),
      countRef: ref(database, `${basePath}/count`)
    };
  }, [boardId, columnId, cardId, user?.uid]);

  const addReaction = useCallback(async (e, emoji) => {
    e.stopPropagation();

    if (!boardId || !user) return;
    
    const { userRef, countRef } = getReactionRefs(emoji);
    const hasUserReacted = hasUserReactedWithEmoji(emoji);
    
    try {
      if (hasUserReacted) {
        await remove(userRef);
        const newCount = Math.max(0, getReactionCount(emoji) - 1);
        await set(countRef, newCount);
        showNotification('Your reaction removed');
      } else {
        await set(userRef, true);
        const newCount = getReactionCount(emoji) + 1;
        await set(countRef, newCount);
        showNotification('Reaction added');
      }
    } catch (error) {
      console.error('Error managing reaction:', error);
    }
  }, [boardId, user, getReactionRefs, hasUserReactedWithEmoji, getReactionCount, showNotification]);

  // Effect for emoji picker clicks outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    
    const handleClickOutside = (event) => {
      const pickerElement = document.querySelector('.emoji-picker');
      if (pickerElement && !pickerElement.contains(event.target) && 
          !event.target.closest('.add-reaction-button')) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  return {
    // State
    showEmojiPicker,
    emojiPickerPosition,
    
    // State setters
    setShowEmojiPicker,
    toggleEmojiPicker,
    setEmojiPickerPosition,
    
    // Reaction operations
    hasUserReactedWithEmoji,
    addReaction
  };
}