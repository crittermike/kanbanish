import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ref, set, remove, get } from 'firebase/database';
import { database } from '../utils/firebase';
import { useBoardContext } from '../context/BoardContext';

export function useCardOperations({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  user, 
  showNotification 
}) {
  // Get vote limit info from context
  const { maxVotesPerUser, getRemainingVotes } = useBoardContext();
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(cardData.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [hasUserVotedOnCard, setHasUserVotedOnCard] = useState(false);

  // Memoized database reference
  const cardRef = useMemo(() => 
    ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`),
    [boardId, columnId, cardId]
  );

  // Check if user has already voted on this card
  useEffect(() => {
    if (!boardId || !user) return;

    const userVoteRef = ref(database, `boardVotes/${boardId}/users/${user.uid}/${cardId}`);
    
    const checkUserVote = async () => {
      try {
        const snapshot = await get(userVoteRef);
        setHasUserVotedOnCard(snapshot.exists());
      } catch (error) {
        console.error('Error checking if user voted:', error);
      }
    };
    
    checkUserVote();
  }, [boardId, user, cardId]);

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
    if (delta < 0 && currentVotes <= 0) return;

    // Reference to track user votes
    const userVoteRef = ref(database, `boardVotes/${boardId}/users/${user.uid}/${cardId}`);
    const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
    
    try {
      // For upvote
      if (delta > 0) {
        // Check if user already voted on this card
        if (hasUserVotedOnCard) {
          showNotification('You already voted on this card');
          return;
        }
        
        // Check if user has votes remaining
        const remainingVotes = getRemainingVotes();
        if (maxVotesPerUser !== null && remainingVotes <= 0) {
          showNotification(`You've used all ${maxVotesPerUser} of your votes`);
          return;
        }

        // Record this vote
        await set(userVoteRef, true);
        
        // Update card votes
        const newVotes = currentVotes + delta;
        await set(votesRef, newVotes);
        setHasUserVotedOnCard(true);
        showNotification(message);
      } 
      // For downvote
      else if (delta < 0) {
        // Can only remove your own vote
        if (!hasUserVotedOnCard) {
          showNotification('You can only remove your own votes');
          return;
        }
        
        // Remove user's vote record
        await remove(userVoteRef);
        
        // Update card votes
        const newVotes = currentVotes + delta;
        await set(votesRef, newVotes);
        setHasUserVotedOnCard(false);
        showNotification(message);
      }
    } catch (error) {
      console.error('Error updating votes:', error);
    }
  }, [boardId, columnId, cardId, cardData.votes, user, hasUserVotedOnCard, maxVotesPerUser, getRemainingVotes, showNotification]);

  const upvoteCard = useCallback((e) => {
    updateVotes(1, e, 'Vote added');
  }, [updateVotes]);

  const downvoteCard = useCallback((e) => {
    updateVotes(-1, e, 'Vote removed');
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
    hasUserVotedOnCard,
    
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
