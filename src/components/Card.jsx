import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ref, set, remove } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import { COMMON_EMOJIS } from '../utils/helpers';
import { useDrag } from 'react-dnd';

function Card({ cardId, cardData, columnId, showNotification }) {
    const { boardId, user } = useBoardContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(cardData.content || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const cardRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
    
    // Effect for handling clicks outside of the emoji picker
    useEffect(() => {
        if (!showEmojiPicker) return;
        
        // Function to handle clicks outside the picker
        const handleClickOutside = (event) => {
            // Don't close if clicking the button that opened the picker
            if (emojiButtonRef.current && emojiButtonRef.current.contains(event.target)) {
                return;
            }
            
            // Check if clicking outside the picker
            const pickerElement = document.querySelector('.emoji-picker');
            if (pickerElement && !pickerElement.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        
        // Add event listener when the picker is shown
        document.addEventListener('mousedown', handleClickOutside);
        
        // Clean up
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);
    
    // Configure drag functionality
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'CARD',
        item: { 
            cardId, 
            columnId,
            cardData
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        })
    }), [cardId, columnId, cardData]);
    
    // Apply the drag ref to the card element
    drag(cardRef);

    /**
     * Get database reference for the current card
     * @returns {Object} Firebase database reference
     */
    const getCardRef = () => {
        return ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);
    };

    // Toggle card editing mode
    const toggleEditMode = (e) => {
        if (e) e.stopPropagation();
        setIsEditing(!isEditing);
        setEditedContent(cardData.content || '');
    };

    // Save card edits
    const saveCardChanges = () => {
        if (!boardId) return;
        
        const cardRef = getCardRef();
        const trimmedContent = editedContent.trim();
        
        // If content is empty, delete the card
        if (!trimmedContent) {
            remove(cardRef)
                .then(() => {
                    showNotification('Card deleted');
                })
                .catch((error) => {
                    console.error('Error deleting card:', error);
                });
            return;
        }
        
        // Otherwise save the card
        const updates = {
            ...cardData,
            content: trimmedContent
        };
        
        set(cardRef, updates)
            .then(() => {
                showNotification('Card saved');
                setIsEditing(false);
            })
            .catch((error) => {
                console.error('Error saving card:', error);
            });
    };

    // Delete card
    const deleteCard = (e) => {
        e.stopPropagation();
        
        if (!boardId) return;
        
        if (window.confirm('Are you sure you want to delete this card?')) {
            const cardRef = getCardRef();
            remove(cardRef)
                .then(() => {
                    showNotification('Card deleted');
                })
                .catch((error) => {
                    console.error('Error deleting card:', error);
                });
        }
    };

    // Handle key press while editing
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveCardChanges();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditedContent(cardData.content || '');
        }
    };

    /**
     * Update votes for a card
     * @param {number} delta - The amount to change votes by (+1 or -1)
     * @param {Event} e - The event object
     * @param {string} message - Notification message to show
     */
    const updateVotes = (delta, e, message) => {
        e.stopPropagation();
        
        if (!boardId) return;
        
        const currentVotes = cardData.votes || 0;
        // Don't allow negative votes
        if (delta < 0 && currentVotes <= 0) return;
        
        const newVotes = currentVotes + delta;
        const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
        
        set(votesRef, newVotes)
            .then(() => {
                showNotification(message);
            })
            .catch((error) => {
                console.error('Error updating votes:', error);
            });
    };

    // Handle upvoting a card
    const upvoteCard = (e) => {
        updateVotes(1, e, 'Vote added');
    };

    // Handle downvoting a card
    const handleDownvote = (e) => {
        updateVotes(-1, e, 'Vote removed');
    };

    // Format emojis in card content
    const formatContentWithEmojis = (content) => {
        if (!content) return '';

        // Simple formatting for displaying emojis and line breaks
        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // Show emoji reactions if any
    const renderReactions = () => {
        return (
            <div className="reactions-left">
                {cardData.reactions && Object.entries(cardData.reactions).map(([emoji, reactionData]) => {
                    // Skip emojis with count of 0
                    if (reactionData.count <= 0) return null;
                    
                    // Check if current user has reacted with this emoji
                    const hasUserReacted = reactionData.users && reactionData.users[user?.uid];
                    
                    return (
                        <div 
                            className={`emoji-reaction ${hasUserReacted ? 'active' : ''}`} 
                            key={emoji} 
                            onClick={(e) => addReaction(e, emoji)}
                            title={hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction"}
                        >
                            <span className="emoji">{emoji}</span>
                            <span className="count">{reactionData.count}</span>
                        </div>
                    );
                })}
                {renderEmojiPicker()} {/* Render emoji picker if showEmojiPicker is true */}
                <button
                    className="add-reaction-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Calculate and set position before showing the emoji picker
                        if (emojiButtonRef.current) {
                            const buttonRect = emojiButtonRef.current.getBoundingClientRect();
                            // Position the emoji picker near the button but adjust to ensure visibility
                            setEmojiPickerPosition({
                                top: buttonRect.bottom + window.scrollY + 5, // 5px below the button
                                left: buttonRect.left + window.scrollX
                            });
                        }
                        setShowEmojiPicker(!showEmojiPicker); // Toggle emoji picker
                        setShowComments(false); // Close comments if open
                    }}
                    title="Add reaction"
                    ref={emojiButtonRef}
                >+</button>
            </div>
        );
    };

    // Render emoji picker
    const renderEmojiPicker = () => {
        if (!showEmojiPicker) return null;

        // Create and append the emoji picker to the document body to break out of any containers
        return ReactDOM.createPortal(
            <div 
                className="emoji-picker" 
                onClick={(e) => e.stopPropagation()}
                ref={emojiPickerRef}
                style={{ 
                    top: emojiPickerPosition.top, 
                    left: emojiPickerPosition.left 
                }}
            >
                {COMMON_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        className={`emoji-option ${hasUserReactedWithEmoji(emoji) ? 'selected' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            addReaction(e, emoji);
                            setShowEmojiPicker(false); // Close picker after selecting an emoji
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>,
            document.body
        );
    };

    // Add a comment to the card
    const addComment = () => {
        if (!boardId || !newComment.trim()) return;

        // Create a unique ID for the comment
        const commentId = `comment_${Date.now()}`;
        const commentData = {
            content: newComment,
            timestamp: Date.now()
        };

        // Create a direct reference to the comment path
        const commentRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);
        set(commentRef, commentData)
            .then(() => {
                showNotification('Comment added');
                setNewComment(''); // Clear the comment input
            })
            .catch((error) => {
                console.error('Error adding comment:', error);
            });
    };

    // Render comments section
    const renderComments = () => {
        if (!showComments) return null;

        return (
            <div className="comments-section">
                <h4>Comments</h4>
                {cardData.comments && Object.entries(cardData.comments).length > 0 ? (
                    Object.entries(cardData.comments).map(([commentId, comment]) => (
                        <div key={commentId} className="comment">
                            <div className="comment-content">{comment.content}</div>
                        </div>
                    ))
                ) : (
                    <p className="no-comments">No comments yet</p>
                )}

                {/* Comment form */}
                <div className="comment-form">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && newComment.trim()) {
                                e.preventDefault();
                                addComment();
                            }
                        }}
                    />
                </div>
            </div>
        );
    };

    /**
     * Check if a user has reacted with a specific emoji
     * @param {string} emoji - The emoji to check
     * @returns {boolean} True if user has reacted, false otherwise
     */
    const hasUserReactedWithEmoji = (emoji) => {
        return !!(cardData.reactions && 
                cardData.reactions[emoji] && 
                cardData.reactions[emoji].users && 
                cardData.reactions[emoji].users[user?.uid]);
    };

    /**
     * Get the current count of a specific emoji reaction
     * @param {string} emoji - The emoji to count
     * @returns {number} The count value
     */
    const getReactionCount = (emoji) => {
        return (cardData.reactions && 
                cardData.reactions[emoji] && 
                cardData.reactions[emoji].count) || 0;
    };

    /**
     * Create reference paths for emoji reaction data
     * @param {string} emoji - The emoji for the reaction
     * @returns {Object} References to user and count paths
     */
    const getReactionRefs = (emoji) => {
        const basePath = `boards/${boardId}/columns/${columnId}/cards/${cardId}/reactions/${emoji}`;
        return {
            userRef: ref(database, `${basePath}/users/${user.uid}`),
            countRef: ref(database, `${basePath}/count`)
        };
    };

    // Add or remove a reaction to a card
    const addReaction = (e, emoji) => {
        e.stopPropagation();

        if (!boardId || !user) return;
        
        const { userRef, countRef } = getReactionRefs(emoji);
        const hasUserReacted = hasUserReactedWithEmoji(emoji);
        
        if (hasUserReacted) {
            // If user already reacted, remove their reaction
            remove(userRef)
                .then(() => {
                    // Update the counter for this emoji
                    const newCount = Math.max(0, getReactionCount(emoji) - 1);
                    return set(countRef, newCount);
                })
                .then(() => {
                    showNotification('Your reaction removed');
                })
                .catch((error) => {
                    console.error('Error managing reaction:', error);
                });
        } else {
            // Add user's reaction
            set(userRef, true)
                .then(() => {
                    // Update the counter for this emoji
                    const newCount = getReactionCount(emoji) + 1;
                    return set(countRef, newCount);
                })
                .then(() => {
                    showNotification('Reaction added');
                })
                .catch((error) => {
                    console.error('Error managing reaction:', error);
                });
        }
    };

    return (
        <div 
            ref={cardRef}
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
                            <button className="vote-button" onClick={(e) => handleDownvote(e)} title="Downvote">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                                </svg>
                            </button>
                        </div>
                        <div className="card-content">
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
                                    setShowComments(!showComments); // Toggle comments visibility
                                    setShowEmojiPicker(false); // Close emoji picker if open
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
                    {/* Render comments section if showComments is true */}
                    {renderComments()}
                </>
            )}
        </div>
    );
}

export default Card;
