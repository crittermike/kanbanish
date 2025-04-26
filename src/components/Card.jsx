import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import { COMMON_EMOJIS } from '../utils/helpers';
import { useDrag } from 'react-dnd';

// Extracted EmojiPicker component
const EmojiPicker = React.memo(({ 
  position, 
  onEmojiSelect, 
  onClose, 
  hasUserReactedWithEmoji 
}) => {
  return ReactDOM.createPortal(
    <div 
      className="emoji-picker" 
      onClick={(e) => e.stopPropagation()}
      data-testid="emoji-picker"
      style={{ 
        top: position.top, 
        left: position.left 
      }}
    >
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className={`emoji-option ${hasUserReactedWithEmoji(emoji) ? 'selected' : ''}`}
          data-testid="emoji-option"
          onClick={(e) => {
            e.stopPropagation();
            onEmojiSelect(e, emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>,
    document.body
  );
});

// Extracted Comments component
const Comments = React.memo(({ 
  comments, 
  onAddComment, 
  newComment, 
  onCommentChange 
}) => {
  return (
    <div className="comments-section">
      <h4>Comments</h4>
      {comments && Object.entries(comments).length > 0 ? (
        Object.entries(comments).map(([commentId, comment]) => (
          <div key={commentId} className="comment">
            <div className="comment-content">{comment.content}</div>
          </div>
        ))
      ) : (
        <p className="no-comments">No comments yet</p>
      )}

      <div className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          className="comment-input"
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && newComment.trim()) {
              e.preventDefault();
              onAddComment();
            }
          }}
        />
      </div>
    </div>
  );
});

function Card({ cardId, cardData, columnId, showNotification }) {
    const { boardId, user } = useBoardContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(cardData.content || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const cardElementRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
    
    // Memoized database reference
    const cardRef = useMemo(() => 
      ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`),
      [boardId, columnId, cardId]
    );

    // Effect for handling clicks outside of the emoji picker
    useEffect(() => {
        if (!showEmojiPicker) return;
        
        const handleClickOutside = (event) => {
            if (emojiButtonRef.current?.contains(event.target)) return;
            
            const pickerElement = document.querySelector('.emoji-picker');
            if (pickerElement && !pickerElement.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);
    
    // Configure drag functionality
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'CARD',
        item: { cardId, columnId, cardData },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    }), [cardId, columnId, cardData]);
    
    // Apply the drag ref to the card element
    drag(cardElementRef);

    // Memoized handlers
    const toggleEditMode = useCallback((e) => {
        if (e) e.stopPropagation();
        setIsEditing(!isEditing);
        setEditedContent(cardData.content || '');
    }, [isEditing, cardData.content]);

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

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveCardChanges();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditedContent(cardData.content || '');
        }
    }, [saveCardChanges, cardData.content]);

    const updateVotes = useCallback(async (delta, e, message) => {
        e.stopPropagation();
        
        if (!boardId) return;
        
        const currentVotes = cardData.votes || 0;
        if (delta < 0 && currentVotes <= 0) return;
        
        try {
            const newVotes = currentVotes + delta;
            const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
            await set(votesRef, newVotes);
            showNotification(message);
        } catch (error) {
            console.error('Error updating votes:', error);
        }
    }, [boardId, columnId, cardId, cardData.votes, showNotification]);

    const upvoteCard = useCallback((e) => {
        updateVotes(1, e, 'Vote added');
    }, [updateVotes]);

    const handleDownvote = useCallback((e) => {
        updateVotes(-1, e, 'Vote removed');
    }, [updateVotes]);

    const formatContentWithEmojis = useCallback((content) => {
        if (!content) return '';

        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    }, []);

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
            userRef: ref(database, `${basePath}/users/${user.uid}`),
            countRef: ref(database, `${basePath}/count`)
        };
    }, [boardId, columnId, cardId, user.uid]);

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

    const renderReactions = useCallback(() => {
        return (
            <div className="reactions-left">
                {cardData.reactions && Object.entries(cardData.reactions).map(([emoji, reactionData]) => {
                    if (reactionData.count <= 0) return null;
                    
                    const hasUserReacted = reactionData.users && reactionData.users[user?.uid];
                    
                    return (
                        <div 
                            className={`emoji-reaction ${hasUserReacted ? 'active' : ''}`} 
                            key={emoji} 
                            data-testid="emoji-reaction"
                            onClick={(e) => addReaction(e, emoji)}
                            title={hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction"}
                        >
                            <span className="emoji">{emoji}</span>
                            <span className="count">{reactionData.count}</span>
                        </div>
                    );
                })}
                {showEmojiPicker && (
                    <EmojiPicker
                        position={emojiPickerPosition}
                        onEmojiSelect={addReaction}
                        onClose={() => setShowEmojiPicker(false)}
                        hasUserReactedWithEmoji={hasUserReactedWithEmoji}
                    />
                )}
                <button
                    className="add-reaction-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (emojiButtonRef.current) {
                            const buttonRect = emojiButtonRef.current.getBoundingClientRect();
                            setEmojiPickerPosition({
                                top: buttonRect.bottom + window.scrollY + 5,
                                left: buttonRect.left + window.scrollX
                            });
                        }
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowComments(false);
                    }}
                    title="Add reaction"
                    ref={emojiButtonRef}
                >+</button>
            </div>
        );
    }, [cardData.reactions, user?.uid, showEmojiPicker, emojiPickerPosition, addReaction, hasUserReactedWithEmoji]);

    return (
        <div 
            ref={cardElementRef}
            className={`card ${isDragging ? 'dragging' : ''}`} 
            onClick={() => !isEditing && toggleEditMode()}
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            {isEditing ? (
                <div className="card-edit" onClick={(e) => e.stopPropagation()}>
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="card-edit-textarea"
                        autoFocus
                    />
                    <div className="card-edit-actions">
                        <button className="btn primary-btn" onClick={saveCardChanges}>Save</button>
                        <button className="btn secondary-btn" onClick={toggleEditMode}>Cancel</button>
                        <button className="btn danger-btn" onClick={deleteCard}>Delete</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="card-header">
                        <div className="votes">
                            <button className="vote-button" onClick={upvoteCard} title="Upvote">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                                </svg>
                            </button>
                            <span className="vote-count">{cardData.votes || 0}</span>
                            <button className="vote-button" onClick={handleDownvote} title="Downvote">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                                </svg>
                            </button>
                        </div>
                        <div className="card-content" data-testid="card-content">
                            {formatContentWithEmojis(cardData.content)}
                        </div>
                    </div>
                    <div className="emoji-reactions">
                        {renderReactions()}
                        <div className="reactions-right">
                            <button
                                className="comments-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowComments(!showComments);
                                    setShowEmojiPicker(false);
                                }}
                                title="Toggle comments"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                </svg>
                                <span>
                                    {(cardData.comments && Object.keys(cardData.comments).length) || 0}
                                </span>
                            </button>
                        </div>
                    </div>
                    {showComments && (
                        <Comments
                            comments={cardData.comments}
                            onAddComment={addComment}
                            newComment={newComment}
                            onCommentChange={setNewComment}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default Card;
