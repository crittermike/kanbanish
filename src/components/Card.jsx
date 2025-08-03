import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
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
  userId,
  revealMode,
  cardsRevealed,
  groupId
}) => {
  // Determine if we should show the downvote button:
  // 1. Always show if downvotingEnabled is true
  // 2. Only show if user has upvoted and downvotingEnabled is false
  const userVotes = cardData.voters && userId ? cardData.voters[userId] || 0 : 0;
  const showDownvoteButton = downvotingEnabled || userVotes > 0;

  // Generate obfuscated text that matches the length of the original content
  const generateObfuscatedText = (text) => {
    if (!text) return '';

    // Replace each character with appropriate obfuscation
    return text.split('').map(char => {
      if (char === ' ') return ' ';
      if (char === '\n') return '\n';
      return '█';
    }).join('');
  };

  // Determine what content to show
  const shouldObfuscate = revealMode && !cardsRevealed;
  const isCreator = cardData.createdBy && userId && cardData.createdBy === userId;
  const showObfuscatedText = shouldObfuscate && !isCreator; // Don't obfuscate for the creator

  // Disable interactions for ALL users when reveal mode is active and cards haven't been revealed yet
  const interactionsDisabled = shouldObfuscate; // This affects everyone, not just non-creators

  const displayContent = showObfuscatedText ?
    generateObfuscatedText(cardData.content) :
    formatContentWithEmojis(cardData.content);

  return (
    <div className="card-header">
      {votingEnabled && !groupId && (
        <VotingControls
          votes={cardData.votes}
          onUpvote={interactionsDisabled ? () => { } : upvoteCard}
          onDownvote={interactionsDisabled ? () => { } : downvoteCard}
          showDownvoteButton={showDownvoteButton}
          disabled={interactionsDisabled}
        />
      )}
      <div className={`card-content ${!votingEnabled || groupId ? 'full-width' : ''} ${showObfuscatedText ? 'obfuscated' : ''}`} data-testid="card-content">
        {displayContent}
      </div>
    </div>
  );
};

function Card({ 
  cardId, 
  cardData, 
  columnId, 
  groupId = null,
  showNotification,
  onCardDropOnCard = null
}) {
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed, revealMode, cardsRevealed } = useBoardContext();
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
    toggleComments,
    
    // Authorship checking
    isCardAuthor,
    isCommentAuthor
  } = useCardOperations({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification,
    multipleVotesAllowed
  });

  // Get comment count
  const commentCount = cardData.comments ? Object.keys(cardData.comments).length : 0;

  // Determine if editing should be disabled for this user
  const shouldObfuscate = revealMode && !cardsRevealed;
  const isCreator = cardData.createdBy && user?.uid && cardData.createdBy === user?.uid;
  const editingDisabled = shouldObfuscate && !isCreator;

  // Grouping is only available when reveal mode is enabled AND cards have been revealed
  const dragDisabled = shouldObfuscate && !isCreator; // Only disable drag for non-creators when obfuscated
  const canDropOnCard = revealMode && cardsRevealed; // Only allow card-on-card drops after "Reveal All Cards" is clicked

  // Configure drag functionality - allow drag for normal column movement or grouping after reveal
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { cardId, columnId, cardData, groupId },
    canDrag: !dragDisabled || canDropOnCard, // Allow drag when not obfuscated OR when grouping is available
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [cardId, columnId, cardData, dragDisabled, groupId, canDropOnCard]);

  // Configure drop functionality - allow cards to be dropped on this card after "Reveal All Cards" is clicked
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => {
      if (canDropOnCard && onCardDropOnCard && item.cardId !== cardId) {
        onCardDropOnCard(item.cardId, cardId);
      }
    },
    canDrop: () => canDropOnCard,
    collect: (monitor) => ({
      isOver: !!monitor.isOver() && !!monitor.canDrop(),
    }),
  }), [canDropOnCard, onCardDropOnCard, cardId]);

  // Handle card click - enter edit mode when not obfuscated and not in grouping mode
  const handleCardClick = () => {
    if (!isEditing && !editingDisabled && !canDropOnCard) {
      toggleEditMode();
    }
  };

  // Combine drag and drop refs
  const combinedRef = (element) => {
    cardElementRef.current = element;
    if (!dragDisabled || canDropOnCard) {
      drag(element);
    }
    if (canDropOnCard) {
      drop(element);
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`card ${isDragging ? 'dragging' : ''} ${editingDisabled ? 'editing-disabled' : ''} ${dragDisabled && !canDropOnCard ? 'drag-disabled' : ''} ${isOver ? 'drop-target' : ''} ${canDropOnCard ? 'groupable' : ''} ${isCardAuthor() ? 'author-editable' : ''}`}
      onClick={handleCardClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canDropOnCard ? 'grab' : (dragDisabled ? 'not-allowed' : (isEditing ? 'default' : 'pointer'))
      }}
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
            revealMode={revealMode}
            cardsRevealed={cardsRevealed}
            groupId={groupId}
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
            disabled={revealMode && !cardsRevealed}
          />

          {showComments && (
            <Comments
              comments={cardData.comments}
              onAddComment={addComment}
              newComment={newComment}
              onCommentChange={setNewComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
              isCommentAuthor={isCommentAuthor}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Card;
