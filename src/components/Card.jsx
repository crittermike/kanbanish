import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useCardOperations } from '../hooks/useCardOperations';
import { 
  shouldObfuscateContent, 
  areInteractionsDisabled, 
  getDisabledReason 
} from '../utils/revealModeUtils';

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
  groupId,
  isInteractionDisabled,
  interactionsRevealed,
  disabledReason
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
  const isCreator = cardData.createdBy && userId && cardData.createdBy === userId;
  const showObfuscatedText = shouldObfuscateContent(revealMode, cardsRevealed, isCreator);

  // For now, calculate interactions disabled directly based on reveal mode and cards revealed status
  const interactionsDisabled = areInteractionsDisabled(revealMode, cardsRevealed, interactionsRevealed);

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
          disabledReason={disabledReason}
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
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed, revealMode, cardsRevealed, interactionsRevealed } = useBoardContext();
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
    isCommentAuthor,
    
    // Reveal mode checking
    isInteractionDisabled
  } = useCardOperations({
    boardId,
    columnId,
    cardId,
    cardData,
    user,
    showNotification,
    multipleVotesAllowed,
    revealMode,
    cardsRevealed,
    interactionsRevealed
  });

  // Get comment count
  const commentCount = cardData.comments ? Object.keys(cardData.comments).length : 0;

  // Get disabled reason using utility function
  const disabledReason = getDisabledReason(revealMode, cardsRevealed, interactionsRevealed);

  // Determine if editing should be disabled for this user
  const isCreator = cardData.createdBy && user?.uid && cardData.createdBy === user?.uid;
  const editingDisabled = shouldObfuscateContent(revealMode, cardsRevealed, isCreator);

  // Filter interactions to show only user's own if interactions are not revealed
  const shouldHideOthersInteractions = revealMode && cardsRevealed && !interactionsRevealed;
  
  // Create filtered card data for display
  const displayCardData = shouldHideOthersInteractions ? {
    ...cardData,
    // Filter votes to only show user's own vote count
    votes: cardData.voters && user?.uid && cardData.voters[user.uid] ? Math.abs(cardData.voters[user.uid]) : 0,
    voters: cardData.voters && user?.uid ? { [user.uid]: cardData.voters[user.uid] } : {},
    // Filter reactions to only show user's own
    reactions: cardData.reactions ? Object.fromEntries(
      Object.entries(cardData.reactions).filter(([emoji, data]) => 
        data.users && user?.uid && data.users[user.uid]
      ).map(([emoji, data]) => [emoji, { count: 1, users: { [user.uid]: true } }])
    ) : {},
    // Filter comments to only show user's own when interactions are hidden
    comments: cardData.comments ? Object.fromEntries(
      Object.entries(cardData.comments).filter(([commentId, comment]) => 
        comment.createdBy === user?.uid
      )
    ) : {}
  } : cardData;

  // Grouping is only available when reveal mode is enabled AND cards have been revealed
  const dragDisabled = shouldObfuscateContent(revealMode, cardsRevealed, isCreator); // Only disable drag for non-creators when obfuscated
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

  // Determine dynamic classes based on state
  const getDynamicClasses = () => {
    const classes = [];
    
    if (isDragging) classes.push('dragging');
    if (editingDisabled) classes.push('editing-disabled');
    if (dragDisabled && !canDropOnCard) classes.push('drag-disabled');
    if (isOver) classes.push('drop-target');
    if (canDropOnCard) classes.push('groupable');
    if (isCardAuthor()) classes.push('author-editable');
    
    // Cursor classes
    if (canDropOnCard) classes.push('cursor-grab');
    else if (dragDisabled) classes.push('cursor-not-allowed');
    else if (isEditing) classes.push('cursor-default');
    else classes.push('cursor-pointer');
    
    return classes.join(' ');
  };

  return (
    <div
      ref={combinedRef}
      className={`card ${getDynamicClasses()}`}
      onClick={handleCardClick}
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
            cardData={displayCardData}
            formatContentWithEmojis={formatContentWithEmojis}
            upvoteCard={upvoteCard}
            downvoteCard={downvoteCard}
            votingEnabled={votingEnabled}
            downvotingEnabled={downvotingEnabled}
            userId={user?.uid}
            revealMode={revealMode}
            cardsRevealed={cardsRevealed}
            groupId={groupId}
            isInteractionDisabled={isInteractionDisabled}
            interactionsRevealed={interactionsRevealed}
            disabledReason={disabledReason}
          />

          <CardReactions
            reactions={displayCardData.reactions}
            userId={user?.uid}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            setShowComments={setShowComments}
            addReaction={addReaction}
            hasUserReactedWithEmoji={hasUserReactedWithEmoji}
            commentCount={Object.keys(displayCardData.comments || {}).length}
            toggleComments={toggleComments}
            emojiPickerPosition={emojiPickerPosition}
            setEmojiPickerPosition={setEmojiPickerPosition}
            disabled={isInteractionDisabled()}
            disabledReason={disabledReason}
            revealMode={revealMode}
            cardsRevealed={cardsRevealed}
          />

          {showComments && (
            <Comments
              comments={displayCardData.comments}
              onAddComment={addComment}
              newComment={newComment}
              onCommentChange={setNewComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
              isCommentAuthor={isCommentAuthor}
              interactionsDisabled={isInteractionDisabled()}
              disabledReason={disabledReason}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Card;
