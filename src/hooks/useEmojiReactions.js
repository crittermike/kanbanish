import { useState, useRef, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../utils/firebase';

export const useEmojiReactions = ({ cardId, columnId, cardData, boardId, user }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (!showEmojiPicker) return;
    
    const handleClickOutside = (event) => {
      if (emojiButtonRef.current && emojiButtonRef.current.contains(event.target)) {
        return;
      }
      
      const pickerElement = document.querySelector('.emoji-picker');
      if (pickerElement && !pickerElement.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const toggleEmojiPicker = (e) => {
    e.stopPropagation();
    if (emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: buttonRect.bottom + window.scrollY + 5,
        left: buttonRect.left + window.scrollX
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const addReaction = async (e, emoji) => {
    e.stopPropagation();
    if (!boardId || !user) return;

    const reactionRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/reactions/${emoji}`);
    const currentReaction = cardData.reactions?.[emoji] || { count: 0, users: {} };
    const hasUserReacted = currentReaction.users?.[user.uid];

    try {
      if (hasUserReacted) {
        // Remove reaction
        const newUsers = { ...currentReaction.users };
        delete newUsers[user.uid];
        await set(reactionRef, {
          count: currentReaction.count - 1,
          users: newUsers
        });
      } else {
        // Add reaction
        await set(reactionRef, {
          count: (currentReaction.count || 0) + 1,
          users: {
            ...currentReaction.users,
            [user.uid]: true
          }
        });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  return {
    showEmojiPicker,
    emojiPickerPosition,
    emojiButtonRef,
    emojiPickerRef,
    toggleEmojiPicker,
    addReaction
  };
}; 