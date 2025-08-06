import { ref, set, remove } from 'firebase/database';
import { useState, useCallback, useRef } from 'react';
import { database } from '../utils/firebase';
import { generateId } from '../utils/helpers';
import { areInteractionsAllowed, areInteractionsRevealed } from '../utils/workflowUtils';

/**
 * Custom hook for group-specific operations (comments, reactions)
 * Similar to useCardOperations but focused on groups
 */
export function useGroupOperations({
  boardId,
  columnId,
  groupId,
  groupData,
  user,
  showNotification,
  retrospectiveMode = false,
  workflowPhase = 'CREATION'
}) {
  // State for group interactions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  
  // Ref for emoji button positioning
  const emojiButtonRef = useRef(null);

  // Check if interactions are disabled due to workflow phase
  const isInteractionDisabled = useCallback(() => {
    return !areInteractionsAllowed(workflowPhase, retrospectiveMode);
  }, [workflowPhase, retrospectiveMode]);

  // Reaction operations
  const hasUserReactedWithEmoji = useCallback(emoji => {
    return !!(groupData.reactions &&
            groupData.reactions[emoji] &&
            groupData.reactions[emoji].users &&
            groupData.reactions[emoji].users[user?.uid]);
  }, [groupData.reactions, user?.uid]);

  const getReactionCount = useCallback(emoji => {
    return groupData.reactions?.[emoji]?.count || 0;
  }, [groupData.reactions]);

  const getReactionRefs = useCallback(emoji => {
    const userRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/reactions/${emoji}/users/${user?.uid}`);
    const countRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/reactions/${emoji}/count`);
    return { userRef, countRef };
  }, [boardId, columnId, groupId, user?.uid]);

  const addReaction = useCallback(async (e, emoji) => {
    e.stopPropagation();

    if (!boardId || !user) {
      return;
    }

    // Check if interactions are disabled due to reveal mode
    if (isInteractionDisabled()) {
      if (areInteractionsRevealed(workflowPhase, retrospectiveMode)) {
        showNotification('Interactions are now frozen - no more changes allowed');
      } else {
        showNotification('Reactions are disabled until cards are revealed');
      }
      return;
    }

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
  }, [boardId, user, getReactionRefs, hasUserReactedWithEmoji, getReactionCount, showNotification, isInteractionDisabled, workflowPhase, retrospectiveMode]);

  // Comment operations
  const addComment = useCallback(async () => {
    if (!boardId || !newComment.trim()) {
      return;
    }

    // Check if interactions are disabled
    if (isInteractionDisabled()) {
      if (areInteractionsRevealed(workflowPhase, retrospectiveMode)) {
        showNotification('Interactions are now frozen - no more changes allowed');
      } else {
        showNotification('Comments are disabled until cards are revealed');
      }
      return;
    }

    const commentId = generateId();
    const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/comments/${commentId}`);
    
    const commentData = {
      content: newComment.trim(),
      createdBy: user.uid,
      createdAt: Date.now()
    };

    try {
      await set(commentRef, commentData);
      setNewComment('');
      showNotification('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      showNotification('Error adding comment');
    }
  }, [boardId, columnId, groupId, newComment, user, showNotification, isInteractionDisabled, workflowPhase, retrospectiveMode]);

  const editComment = useCallback(async (commentId, newContent) => {
    if (!boardId || !newContent.trim()) {
      return;
    }

    // Check if interactions are disabled
    if (isInteractionDisabled()) {
      if (areInteractionsRevealed(workflowPhase, retrospectiveMode)) {
        showNotification('Interactions are now frozen - no more changes allowed');
      } else {
        showNotification('Comments are disabled until cards are revealed');
      }
      return;
    }

    const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/comments/${commentId}/content`);
    
    try {
      await set(commentRef, newContent.trim());
      showNotification('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      showNotification('Error updating comment');
    }
  }, [boardId, columnId, groupId, showNotification, isInteractionDisabled, workflowPhase, retrospectiveMode]);

  const deleteComment = useCallback(async commentId => {
    if (!boardId) {
      return;
    }

    // Check if interactions are disabled
    if (isInteractionDisabled()) {
      if (areInteractionsRevealed(workflowPhase, retrospectiveMode)) {
        showNotification('Interactions are now frozen - no more changes allowed');
      } else {
        showNotification('Comments are disabled until cards are revealed');
      }
      return;
    }

    const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/comments/${commentId}`);
    
    try {
      await remove(commentRef);
      showNotification('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showNotification('Error deleting comment');
    }
  }, [boardId, columnId, groupId, showNotification, isInteractionDisabled, workflowPhase, retrospectiveMode]);

  const toggleComments = useCallback(() => {
    setShowComments(!showComments);
    setShowEmojiPicker(false); // Close emoji picker when toggling comments
  }, [showComments]);

  // Authorship checking
  const isCommentAuthor = useCallback((comment) => {
    return comment?.createdBy === user?.uid;
  }, [user?.uid]);

  return {
    // State
    showEmojiPicker,
    showComments,
    newComment,
    emojiPickerPosition,
    emojiButtonRef,

    // State setters
    setShowEmojiPicker,
    setShowComments,
    setNewComment,
    setEmojiPickerPosition,

    // Reaction operations
    hasUserReactedWithEmoji,
    addReaction,

    // Comment operations
    addComment,
    editComment,
    deleteComment,
    toggleComments,

    // Authorship checking
    isCommentAuthor
  };
}
