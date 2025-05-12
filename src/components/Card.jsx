import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useCardOperations } from '../hooks/useCardOperations';
import { Lock } from 'react-feather';

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

function Card({ cardId, cardData, columnId, showNotification }) {
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed, boardLocked } = useBoardContext();
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
    canDrag: !boardLocked, // Disable dragging when board is locked
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [cardId, columnId, cardData, boardLocked]);
  
  // Apply the drag ref to the card element
  drag(cardElementRef);
  
  // Get comment count
  const commentCount = cardData.comments ? Object.keys(cardData.comments).length : 0;
  
  return (
    <div 
      ref={cardElementRef}
      className={`card ${isDragging ? 'dragging' : ''} ${boardLocked ? 'locked' : ''}`} 
      onClick={() => {
        if (boardLocked) {
          showNotification('Board is locked - Cannot edit cards');
          return;
        }
        if (!isEditing) toggleEditMode();
      }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {isEditing ? (
        <CardEditor 
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          handleKeyPress={handleKeyPress}
          saveCardChanges={boardLocked ? () => showNotification('Board is locked - Cannot edit cards') : saveCardChanges}
          toggleEditMode={boardLocked ? () => showNotification('Board is locked - Cannot edit cards') : toggleEditMode}
          deleteCard={boardLocked ? () => showNotification('Board is locked - Cannot delete cards') : deleteCard}
        />
      ) : (
        <>
          <CardContent 
            cardData={cardData}
            formatContentWithEmojis={formatContentWithEmojis}
            upvoteCard={boardLocked ? () => showNotification('Board is locked - Cannot vote') : upvoteCard}
            downvoteCard={boardLocked ? () => showNotification('Board is locked - Cannot vote') : downvoteCard}
            votingEnabled={votingEnabled}
            downvotingEnabled={downvotingEnabled}
            userId={user?.uid}
          />
          {boardLocked && (
            <div className="card-locked-indicator" style={{ position: 'absolute', top: '4px', right: '4px' }}>
              <Lock size={14} style={{ opacity: 0.7 }} />
            </div>
          )}
          
          <CardReactions
            reactions={cardData.reactions}
            userId={user?.uid}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={boardLocked ? () => showNotification('Board is locked - Cannot add reactions') : setShowEmojiPicker}
            setShowComments={setShowComments}
            addReaction={boardLocked ? () => showNotification('Board is locked - Cannot add reactions') : addReaction}
            hasUserReactedWithEmoji={hasUserReactedWithEmoji}
            commentCount={commentCount}
            toggleComments={toggleComments}
            emojiPickerPosition={emojiPickerPosition}
            setEmojiPickerPosition={setEmojiPickerPosition}
            boardLocked={boardLocked}
          />
          
          {showComments && (
            <Comments
              comments={cardData.comments}
              onAddComment={boardLocked ? () => showNotification('Board is locked - Cannot add comments') : addComment}
              newComment={newComment}
              onCommentChange={boardLocked ? () => showNotification('Board is locked - Cannot add comments') : setNewComment}
              onEditComment={boardLocked ? () => showNotification('Board is locked - Cannot edit comments') : editComment}
              onDeleteComment={boardLocked ? () => showNotification('Board is locked - Cannot delete comments') : deleteComment}
              boardLocked={boardLocked}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Card;
