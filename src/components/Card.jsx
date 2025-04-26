import React from 'react';
import { useDrag } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useCardOperations } from '../hooks/useCardOperations';
import { useEmojiReactions } from '../hooks/useEmojiReactions';
import { useComments } from '../hooks/useComments';
import CardContent from './card/CardContent';
import CardActions from './card/CardActions';
import { COMMON_EMOJIS } from '../utils/helpers';

function Card({ cardId, cardData, columnId, showNotification }) {
  const { boardId, user } = useBoardContext();
  const cardRef = React.useRef(null);

  // Use custom hooks
  const {
    isEditing,
    editedContent,
    setEditedContent,
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    updateVotes,
    handleKeyPress: handleCardKeyPress
  } = useCardOperations({
    cardId,
    columnId,
    cardData,
    boardId,
    showNotification
  });

  const {
    showEmojiPicker,
    emojiPickerPosition,
    emojiButtonRef,
    emojiPickerRef,
    toggleEmojiPicker,
    addReaction
  } = useEmojiReactions({
    cardId,
    columnId,
    cardData,
    boardId,
    user
  });

  const {
    showComments,
    newComment,
    setNewComment,
    handleKeyPress: handleCommentKeyPress,
    toggleComments
  } = useComments({
    cardId,
    columnId,
    cardData,
    boardId,
    user
  });

  // Configure drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { cardId, columnId, cardData },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [cardId, columnId, cardData]);

  // Apply the drag ref to the card element
  drag(cardRef);

  // Format emojis in card content
  const formatContentWithEmojis = (content) => {
    if (!content) return '';
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Handle upvoting a card
  const upvoteCard = (e) => {
    e.stopPropagation();
    updateVotes(1, e, 'Vote added');
  };

  // Handle downvoting a card
  const handleDownvote = (e) => {
    updateVotes(-1, e, 'Vote removed');
  };

  return (
    <div 
      ref={cardRef}
      className={`card ${isDragging ? 'dragging' : ''}`}
      onClick={toggleEditMode}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <CardContent
        isEditing={isEditing}
        editedContent={editedContent}
        setEditedContent={setEditedContent}
        handleKeyPress={handleCardKeyPress}
        saveCardChanges={saveCardChanges}
        deleteCard={deleteCard}
        formatContentWithEmojis={formatContentWithEmojis}
        cardData={cardData}
        upvoteCard={upvoteCard}
        handleDownvote={handleDownvote}
      />

      <div className="card-footer">
        {/* Emoji Reactions */}
        <div className="reactions-left">
          {cardData.reactions && Object.entries(cardData.reactions).map(([emoji, reactionData]) => {
            if (reactionData.count <= 0) return null;
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
          <button
            className="add-reaction-button"
            onClick={toggleEmojiPicker}
            title="Add reaction"
            ref={emojiButtonRef}
          >+</button>
        </div>

        <CardActions
          toggleComments={toggleComments}
          showComments={showComments}
          cardData={cardData}
        />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          className="emoji-picker" 
          onClick={(e) => e.stopPropagation()}
          ref={emojiPickerRef}
          style={{ 
            position: 'absolute',
            top: emojiPickerPosition.top,
            left: emojiPickerPosition.left
          }}
        >
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={(e) => addReaction(e, emoji)}
              className="emoji-option"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section" onClick={(e) => e.stopPropagation()}>
          <h4>Comments</h4>
          <div className="comments-list">
            {cardData.comments && Object.entries(cardData.comments).map(([commentId, comment]) => (
              <div key={commentId} className="comment">
                <p>{comment.content}</p>
              </div>
            ))}
          </div>
          <div className="comment-form">
            <input
              type="text"
              value={newComment}
              className="comment-input"
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleCommentKeyPress}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add a comment..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Card;
