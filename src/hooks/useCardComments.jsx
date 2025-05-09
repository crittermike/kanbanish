import { useCallback } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export function useCardComments({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  showNotification
}) {
  // Comment operations
  const addComment = useCallback(async (newComment) => {
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
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }, [boardId, columnId, cardId, showNotification]);

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

  return {
    // Comment operations
    addComment,
    editComment,
    deleteComment
  };
}