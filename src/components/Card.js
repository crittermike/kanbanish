import React, { useState } from 'react';
import { ref, set, remove } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import { COMMON_EMOJIS } from '../utils/helpers';

function Card({ cardId, cardData, columnId, showNotification }) {
    const {
        boardId,
        boardRef,
        setActiveCardId,
        setActiveColumnId,
        setIsNewCard
    } = useBoardContext();

    // Open card detail modal
    const openCardDetail = () => {
        setActiveCardId(cardId);
        setActiveColumnId(columnId);
        setIsNewCard(false);
        document.getElementById('card-detail-modal').style.display = 'flex';
    };

    // Handle upvoting a card
    const upvoteCard = (e) => {
        e.stopPropagation();

        if (boardId) {
            const newVotes = (cardData.votes || 0) + 1;
            const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
            set(votesRef, newVotes)
                .then(() => {
                    showNotification('Vote added');
                })
                .catch((error) => {
                    console.error('Error adding vote:', error);
                });
        }
    };

    // Handle downvoting a card
    const handleDownvote = (e) => {
        e.stopPropagation();

        if (boardId) {
            const currentVotes = cardData.votes || 0;
            if (currentVotes > 0) {
                const newVotes = currentVotes - 1;
                const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
                set(votesRef, newVotes)
                    .then(() => {
                        showNotification('Vote removed');
                    })
                    .catch((error) => {
                        console.error('Error removing vote:', error);
                    });
            }
        }
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

    // State for showing emoji picker and comments
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [showComments, setShowComments] = React.useState(false);

    // Show emoji reactions if any
    const renderReactions = () => {
        return (
            <div className="reactions-left">
                {cardData.reactions && Object.entries(cardData.reactions).map(([emoji, count]) => (
                    <div className="emoji-reaction" key={emoji} onClick={(e) => addReaction(e, emoji)}>
                        <span className="emoji">{emoji}</span>
                        <span className="count">{count}</span>
                    </div>
                ))}
                {renderEmojiPicker()} {/* Render emoji picker if showEmojiPicker is true */}
                <button
                    className="add-reaction-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker); // Toggle emoji picker
                        setShowComments(false); // Close comments if open
                    }}
                    title="Add reaction"
                >+</button>
            </div>
        );
    };

    // Render emoji picker
    const renderEmojiPicker = () => {
        if (!showEmojiPicker) return null;

        return (
            <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
                {COMMON_EMOJIS.map((emoji) => {
                    // Check if this emoji is already used
                    const isSelected = cardData.reactions && cardData.reactions[emoji];
                    return (
                        <button
                            key={emoji}
                            className={`emoji-option ${isSelected ? 'selected' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                addReaction(e, emoji);
                                setShowEmojiPicker(false); // Close picker after selecting an emoji
                            }}
                        >
                            {emoji}
                        </button>
                    );
                })}
            </div>
        );
    };

    // State for new comment input
    const [newComment, setNewComment] = useState('');

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

    // Add or remove a reaction to a card
    const addReaction = (e, emoji) => {
        e.stopPropagation();

        if (boardId) {
            const reactionRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/reactions/${emoji}`);
            const currentCount = cardData.reactions && cardData.reactions[emoji] ? cardData.reactions[emoji] : 0;

            // If already reacted, remove the reaction, otherwise add it
            if (currentCount > 0) {
                // Remove the reaction
                remove(reactionRef)
                    .then(() => {
                        showNotification('Reaction removed');
                    })
                    .catch((error) => {
                        console.error('Error removing reaction:', error);
                    });
            } else {
                // Add the reaction
                set(reactionRef, 1)
                    .then(() => {
                        showNotification('Reaction added');
                    })
                    .catch((error) => {
                        console.error('Error adding reaction:', error);
                    });
            }
        }
    };

    return (
        <div className="card" onClick={openCardDetail}>
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
        </div>
    );
}

export default Card;
