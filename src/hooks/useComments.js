import { useState } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../utils/firebase';

export const useComments = ({ cardId, columnId, cardData, boardId, user }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && newComment.trim()) {
      e.preventDefault();
      await addComment();
    }
  };

  const addComment = async () => {
    if (!boardId || !user || !newComment.trim()) return;

    const commentId = Date.now().toString();
    const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);

    try {
      await set(commentRef, {
        content: newComment.trim(),
        user: user.uid
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (e) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  return {
    showComments,
    newComment,
    setNewComment,
    handleKeyPress,
    toggleComments
  };
}; 