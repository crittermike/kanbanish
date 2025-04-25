import React, { useState, useEffect } from 'react';
import { ref, set, remove, push } from 'firebase/database';
import { useBoardContext } from '../../context/BoardContext';
import { database } from '../../utils/firebase';
import { COMMON_EMOJIS } from '../../utils/helpers';

function CardDetailModal({ showNotification }) {
  const { 
    boardId,
    boardRef, 
    activeCardId, 
    activeColumnId, 
    isNewCard, 
    setActiveCardId,
    setActiveColumnId,
    setIsNewCard,
    columns 
  } = useBoardContext();
  
  const [cardContent, setCardContent] = useState('');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Initialize card content when activeCardId changes
  useEffect(() => {
    if (activeCardId && activeColumnId && columns && columns[activeColumnId] && columns[activeColumnId].cards) {
      const cardData = columns[activeColumnId].cards[activeCardId];
      if (cardData) {
        setCardContent(cardData.content || '');
        setComments(cardData.comments || {});
      } else {
        setCardContent('');
        setComments({});
      }
    }
  }, [activeCardId, activeColumnId, columns]);

  // Close the modal
  const closeModal = () => {
    document.getElementById('card-detail-modal').style.display = 'none';
    setActiveCardId(null);
    setActiveColumnId(null);
    setIsNewCard(false);
    setShowEmojiPicker(false);
  };

  // Save card changes
  const saveCard = () => {
    if (!boardId || !activeCardId || !activeColumnId) return;

    const cardRef = ref(database, `boards/${boardId}/columns/${activeColumnId}/cards/${activeCardId}`);
    
    // Update or set created timestamp if it's a new card
    const updates = {
      content: cardContent,
    };

    if (isNewCard) {
      updates.created = Date.now();
      updates.votes = 0;
    }
    
    // Get current card data if available
    const currentCardData = columns[activeColumnId]?.cards?.[activeCardId] || {};
    
    set(cardRef, {
      ...currentCardData,
      ...updates
    })
      .then(() => {
        showNotification('Card saved');
        if (cardContent.trim() === '') {
          // If content is empty, stay in the modal
          setCardContent('');
        } else {
          closeModal();
        }
      })
      .catch((error) => {
        console.error('Error saving card:', error);
      });
  };

  // Delete card
  const deleteCard = () => {
    if (!boardId || !activeCardId || !activeColumnId) return;

    if (window.confirm('Are you sure you want to delete this card?')) {
      const cardRef = ref(database, `boards/${boardId}/columns/${activeColumnId}/cards/${activeCardId}`);
      remove(cardRef)
        .then(() => {
          showNotification('Card deleted');
          closeModal();
        })
        .catch((error) => {
          console.error('Error deleting card:', error);
        });
    }
  };

  // Add a comment to the card
  const addComment = () => {
    if (!boardId || !activeCardId || !activeColumnId || !newComment.trim()) return;

    const commentsRef = ref(database, `boards/${boardId}/columns/${activeColumnId}/cards/${activeCardId}/comments`);
    const commentData = {
      content: newComment,
      timestamp: Date.now()
    };
    
    const newCommentRef = push(commentsRef);
    set(newCommentRef, commentData)
      .then(() => {
        showNotification('Comment added');
        setNewComment('');
      })
      .catch((error) => {
        console.error('Error adding comment:', error);
      });
  };

  // Add emoji reaction to card
  const addEmojiReaction = (emoji) => {
    if (!boardId || !activeCardId || !activeColumnId) return;

    const reactionRef = ref(database, `boards/${boardId}/columns/${activeColumnId}/cards/${activeCardId}/reactions/${emoji}`);
    const card = columns[activeColumnId]?.cards?.[activeCardId];
    const reactions = card?.reactions || {};
    const count = reactions[emoji] || 0;
    
    set(reactionRef, count + 1)
      .then(() => {
        showNotification('Reaction added');
      })
      .catch((error) => {
        console.error('Error adding reaction:', error);
      });
      
    setShowEmojiPicker(false);
  };

  // Format timestamp for comment display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Handle clicking outside the emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPicker = document.getElementById('emoji-picker');
      const emojiButton = document.getElementById('add-emoji-button');
      
      if (showEmojiPicker && emojiPicker && !emojiPicker.contains(event.target) && 
          event.target !== emojiButton && !emojiButton.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div id="card-detail-modal" className="modal">
      <div className="modal-content">
        <span className="close-modal" onClick={closeModal}>&times;</span>
        <h2>Card Details</h2>
        <div className="modal-body">
          <textarea 
            id="card-content-edit" 
            placeholder="Card content" 
            value={cardContent}
            onChange={(e) => setCardContent(e.target.value)}
          ></textarea>
          
          <div className="card-actions">
            <button id="save-card" className="btn primary-btn" onClick={saveCard}>Save</button>
            <button id="delete-card" className="btn danger-btn" onClick={deleteCard}>Delete</button>
          </div>
          
          <div className="comments-section">
            <h3>Comments</h3>
            <div id="comments-container" className="comments-container">
              {Object.entries(comments || {}).length > 0 ? (
                Object.entries(comments).map(([commentId, commentData]) => (
                  <div key={commentId} className="comment">
                    <div className="comment-content">{commentData.content}</div>
                    <div className="comment-timestamp">{formatTimestamp(commentData.timestamp)}</div>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet</p>
              )}
            </div>
            <div className="add-comment">
              <textarea 
                id="new-comment" 
                placeholder="Add a comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <button id="add-comment-btn" className="btn primary-btn" onClick={addComment}>Add Comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardDetailModal;
