import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useCardEditing } from './useCardEditing';
import { useCardVoting } from './useCardVoting';
import { useCardReactions } from './useCardReactions';
import { useCardComments } from './useCardComments';

// This is a compatibility layer that combines the modularized hooks
export function useCardOperations({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  user, 
  showNotification,
  multipleVotesAllowed = false
}) {
  // State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });

  // Use the modularized hooks
  const {
    isEditing,
    editedContent,
    setIsEditing,
    setEditedContent,
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    handleKeyPress,
    formatContentWithEmojis
  } = useCardEditing({
    boardId,
    columnId,
    cardId,
    cardData,
    showNotification
  });

  const {
    upvoteCard,
    downvoteCard
  } = useCardVoting({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification,
    multipleVotesAllowed
  });

  const {
    hasUserReactedWithEmoji,
    addReaction
  } = useCardReactions({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification
  });

  const {
    addComment: addCommentBase,
    editComment,
    deleteComment
  } = useCardComments({
    boardId,
    columnId,
    cardId,
    cardData,
    showNotification
  });

  // Wrapper for addComment to maintain the same API
  const addComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    const success = await addCommentBase(newComment);
    if (success) {
      setNewComment('');
    }
  }, [addCommentBase, newComment]);
  
  // Toggle comments visibility
  const toggleComments = useCallback(() => {
    setShowComments(!showComments);
    setShowEmojiPicker(false);
  }, [showComments]);

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
    isEditing,
    editedContent,
    showEmojiPicker,
    showComments,
    newComment,
    emojiPickerPosition,
    
    // State setters
    setIsEditing,
    setEditedContent,
    setShowEmojiPicker,
    setShowComments,
    setNewComment,
    setEmojiPickerPosition,
    
    // Card operations
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    handleKeyPress,
    
    // Voting operations
    upvoteCard,
    downvoteCard,
    
    // Content formatting
    formatContentWithEmojis,
    
    // Reaction operations
    hasUserReactedWithEmoji,
    addReaction,
    
    // Comment operations
    addComment,
    editComment,
    deleteComment,
    toggleComments
  };
}
