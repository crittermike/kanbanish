import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { useCardOperations } from '../hooks/useCardOperations';

// Import modularized components
import Comments from './Comments';
import VotingControls from './VotingControls';
import CardReactions from './CardReactions';

// Card Editor component for editing mode
const CardEditor = ({ 
  editedContent, 
  setEditedContent, 
  handleKeyPress, 
  saveCardChanges, 
  toggleEditMode, 
  deleteCard 
}) => (
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
);

// Card Content component for display mode
const CardContent = ({ 
  cardData, 
  formatContentWithEmojis, 
  upvoteCard, 
  downvoteCard,
  votingEnabled,
  downvotingEnabled,
  userId
}) => {
  // Determine if we should show the downvote button:
  // 1. Always show if downvotingEnabled is true
  // 2. Only show if user has upvoted and downvotingEnabled is false
  const userVotes = cardData.voters && userId ? cardData.voters[userId] || 0 : 0;
  const showDownvoteButton = downvotingEnabled || userVotes > 0;

  return (
    <div className="card-header">
      {votingEnabled && (
        <VotingControls 
          votes={cardData.votes} 
          onUpvote={upvoteCard} 
          onDownvote={downvoteCard} 
          showDownvoteButton={showDownvoteButton}
        />
      )}
      <div className={`card-content ${!votingEnabled ? 'full-width' : ''}`} data-testid="card-content">
        {formatContentWithEmojis(cardData.content)}
      </div>
    </div>
  );
};

function Card({ cardId, cardData, columnId }) {
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed } = useBoardContext();
  const { showNotification } = useNotification();
  const cardElementRef = useRef(null);
  
  // Use the custom hook for card operations
  const {
    // State
    isEditing,
    editedContent,
    showEmojiPicker,
    showComments,
    newComment,
    emojiPickerPosition,
    
    // State setters
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
  } = useCardOperations({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification,
    multipleVotesAllowed
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
  drag(cardElementRef);
  
  // Get comment count
  const commentCount = cardData.comments ? Object.keys(cardData.comments).length : 0;
  
  return (
    <div 
      ref={cardElementRef}
      className={`card ${isDragging ? 'dragging' : ''}`} 
      onClick={() => !isEditing && toggleEditMode()}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {isEditing ? (
        <CardEditor 
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          handleKeyPress={handleKeyPress}
          saveCardChanges={saveCardChanges}
          toggleEditMode={toggleEditMode}
          deleteCard={deleteCard}
        />
      ) : (
        <>
          <CardContent 
            cardData={cardData}
            formatContentWithEmojis={formatContentWithEmojis}
            upvoteCard={upvoteCard}
            downvoteCard={downvoteCard}
            votingEnabled={votingEnabled}
            downvotingEnabled={downvotingEnabled}
            userId={user?.uid}
          />
          
          <CardReactions
            reactions={cardData.reactions}
            userId={user?.uid}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            setShowComments={setShowComments}
            addReaction={addReaction}
            hasUserReactedWithEmoji={hasUserReactedWithEmoji}
            commentCount={commentCount}
            toggleComments={toggleComments}
            emojiPickerPosition={emojiPickerPosition}
            setEmojiPickerPosition={setEmojiPickerPosition}
          />
          
          {showComments && (
            <Comments
              comments={cardData.comments}
              onAddComment={addComment}
              newComment={newComment}
              onCommentChange={setNewComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Card;
