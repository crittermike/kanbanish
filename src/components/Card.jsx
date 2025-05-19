import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useCardEditing, useCardVoting, useCardReactions, useCardComments } from '../hooks';

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
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed } = useBoardContext();
  const cardElementRef = useRef(null);

  // Initialize state that will be shared between hooks
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = React.useState({ top: 0, left: 0 });
  const [newComment, setNewComment] = React.useState('');

  // Use the modular hooks for card operations
  const {
    isEditing,
    editedContent,
    setEditedContent,
    toggleEditMode,
    saveCardChanges,
    deleteCard,
    handleKeyPress,
    formatContentWithEmojis
  } = useCardEditing({
    boardId,
    columnId,
    cardId,
    cardData,
    showNotification
  });

  const {
    upvoteCard,
    downvoteCard
  } = useCardVoting({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification,
    multipleVotesAllowed
  });

  const {
    hasUserReactedWithEmoji,
    addReaction
  } = useCardReactions({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification
  });

  const {
    addComment,
    editComment,
    deleteComment
  } = useCardComments({
    boardId,
    columnId,
    cardId,
    cardData,
    showNotification
  });

  // Add emoji picker click-outside effect
  React.useEffect(() => {
    if (!showEmojiPicker) return;
    
    const handleClickOutside = (event) => {
      const pickerElement = document.querySelector('.emoji-picker');
      if (pickerElement && !pickerElement.contains(event.target) && 
          !event.target.closest('.add-reaction-button')) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handler for adding comments
  const handleAddComment = React.useCallback(() => {
    if (newComment.trim()) {
      addComment(newComment).then(success => {
        if (success) {
          setNewComment('');
        }
      });
    }
  }, [addComment, newComment]);

  // Handler for toggling emoji picker
  const toggleEmojiPicker = React.useCallback((event) => {
    if (event) {
      event.stopPropagation();
      const button = event.currentTarget;
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        setEmojiPickerPosition({
          top: buttonRect.bottom + window.scrollY + 5,
          left: buttonRect.left + window.scrollX
        });
      }
    }
    setShowEmojiPicker(!showEmojiPicker);
    setShowComments(false);
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
            toggleEmojiPicker={toggleEmojiPicker}
            setShowComments={setShowComments}
            addReaction={addReaction}
            hasUserReactedWithEmoji={hasUserReactedWithEmoji}
            commentCount={commentCount}
            toggleComments={() => {
              setShowComments(!showComments);
              setShowEmojiPicker(false);
            }}
            emojiPickerPosition={emojiPickerPosition}
            setEmojiPickerPosition={setEmojiPickerPosition}
          />
          
          {showComments && (
            <Comments
              comments={cardData.comments}
              onAddComment={handleAddComment}
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
