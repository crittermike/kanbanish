import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export function useCardOperations({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  user, 
  showNotification,
  multipleVotesAllowed = false // pass this from the Card component
}) {
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(cardData.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });

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

  // Voting operations
  const updateVotes = useCallback(async (delta, e, message) => {
    e.stopPropagation();
    
    if (!boardId || !user) return;
    
    const currentVotes = cardData.votes || 0;
    
    // Prevent negative votes
    if (delta < 0 && currentVotes <= 0) {
      showNotification("Can't have negative votes");
      return;
    }
    
    // Get the user's current vote if any
    const userCurrentVote = cardData.voters && cardData.voters[user.uid] ? cardData.voters[user.uid] : 0;
    
    // If multiple votes are not allowed
    if (!multipleVotesAllowed) {
      // If the user is trying to vote in the same direction they already voted
      if (userCurrentVote === delta) {
        showNotification("You've already voted");
        return;
      }
      
      // If the user already voted and is now voting in opposite direction,
      // just reset their vote (remove previous vote, don't add new one)
      if (userCurrentVote !== 0) {
        // Cancel their previous vote only
        delta = -userCurrentVote;
      }
    }
    
    try {
      const newVotes = currentVotes + delta;
      
      // Update the total vote count
      const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
      await set(votesRef, newVotes);
      
      // Record the user's vote
      const voterRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/voters/${user.uid}`);
      
      // Calculate the new user vote:
      // - For multiple votes allowed: increment their current vote
      // - For single votes only: set to the new direction, or zero if they're toggling an existing vote
      let newUserVote;
      if (multipleVotesAllowed) {
        newUserVote = userCurrentVote + delta;
      } else {
        // If they had a previous vote and are voting opposite, clear their vote (userCurrentVote + delta = 0)
        // If they had no previous vote, set to new direction (delta)
        newUserVote = (userCurrentVote !== 0 && delta === -userCurrentVote) ? 0 : delta;
      }
      
      if (newUserVote === 0) {
        // If the vote is cleared, remove from the database
        await remove(voterRef);
      } else {
        // Otherwise store the vote
        await set(voterRef, newUserVote);
      }
      
      // Show an appropriate message based on what happened
      if (!multipleVotesAllowed && userCurrentVote !== 0 && delta === -userCurrentVote) {
        showNotification('Vote removed');
      } else {
        showNotification(message);
      }
    } catch (error) {
      console.error('Error updating votes:', error);
    }
  }, [boardId, columnId, cardId, cardData.votes, showNotification]);

  const upvoteCard = useCallback((e) => {
    updateVotes(1, e, 'Upvoted card');
  }, [updateVotes]);

  const downvoteCard = useCallback((e) => {
    updateVotes(-1, e, 'Downvoted card');
  }, [updateVotes]);

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

  // Comment operations
  const addComment = useCallback(async () => {
    if (!boardId || !newComment.trim()) return;

    try {
      const commentId = `comment_${Date.now()}`;
      const commentData = {
        content: newComment,
        timestamp: Date.now()
      };

      const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);
      await set(commentRef, commentData);
      showNotification('Comment added');
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [boardId, columnId, cardId, newComment, showNotification]);

  const editComment = useCallback(async (commentId, newContent) => {
    if (!boardId || !commentId || !newContent.trim()) return;

    try {
      const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);
      
      // Get current comment data to preserve timestamp
      const existingComment = cardData.comments?.[commentId];
      if (!existingComment) return;
      
      await set(commentRef, {
        ...existingComment,
        content: newContent.trim()
      });
      
      showNotification('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }, [boardId, columnId, cardId, cardData.comments, showNotification]);

  const deleteComment = useCallback(async (commentId) => {
    if (!boardId || !commentId) return;

    try {
      const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);
      await remove(commentRef);
      showNotification('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, [boardId, columnId, cardId, showNotification]);

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
