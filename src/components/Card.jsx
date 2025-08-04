import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useBoardContext } from '../context/BoardContext';
import { useCardOperations } from '../hooks/useCardOperations';
import {
  getDisabledReason
} from '../utils/retrospectiveModeUtils';
import {
  isGroupingAllowed,
  areInteractionsAllowed,
  areInteractionsVisible,
  areOthersInteractionsVisible,
  shouldObfuscateCards,
  isCardEditingAllowed,
  isCardDraggingAllowed
} from '../utils/workflowUtils';
// Import modularized components
import CardReactions from './CardReactions';
import Comments from './Comments';
import VotingControls from './VotingControls';

// Card Editor component for editing mode
const CardEditor = ({
  editedContent,
  setEditedContent,
  handleKeyPress,
  saveCardChanges,
  toggleEditMode,
  deleteCard
}) => (
  <div className="card-edit" onClick={e => e.stopPropagation()}>
    <textarea
      value={editedContent}
      onChange={e => setEditedContent(e.target.value)}
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
  retrospectiveMode,
  groupId,
  workflowPhase = 'CREATION',
  user,
  disabledReason
}) => {
  // Determine if we should show the downvote button:
  // 1. Always show if downvotingEnabled is true
  // 2. Only show if user has upvoted and downvotingEnabled is false
  const userVotes = cardData.voters && userId ? cardData.voters[userId] || 0 : 0;
  const showDownvoteButton = downvotingEnabled || userVotes > 0;

  // Generate obfuscated text that matches the length of the original content
  const generateObfuscatedText = text => {
    if (!text) {
      return '';
    }

    // Replace each character with appropriate obfuscation
    return text.split('').map(char => {
      if (char === ' ') {
        return ' ';
      }
      if (char === '\n') {
        return '\n';
      }
      return '█';
    }).join('');
  };

  // Determine what content to show
  const isCreator = cardData.createdBy && userId && cardData.createdBy === userId;
  // During CREATION phase, only obfuscate for non-creators; creators should see their own cards
  const showObfuscatedText = shouldObfuscateCards(workflowPhase, retrospectiveMode) && !isCreator;

  // Determine if interactions are disabled based on workflow phase
  const interactionsDisabled = !areInteractionsAllowed(workflowPhase, retrospectiveMode);

  // Determine if interactions should be visible
  const interactionsVisible = areInteractionsVisible(workflowPhase, retrospectiveMode);

  const displayContent = showObfuscatedText ?
    generateObfuscatedText(cardData.content) :
    formatContentWithEmojis(cardData.content);

  return (
    <div className="card-header">
      {votingEnabled && !groupId && !(retrospectiveMode && workflowPhase === 'CREATION' && user) && interactionsVisible && (
        <VotingControls
          votes={cardData.votes}
          onUpvote={interactionsDisabled ? () => { } : upvoteCard}
          onDownvote={interactionsDisabled ? () => { } : downvoteCard}
          showDownvoteButton={showDownvoteButton}
          disabled={interactionsDisabled}
          disabledReason={disabledReason}
        />
      )}
      <div className={`card-content ${!votingEnabled || groupId || !interactionsVisible || (retrospectiveMode && workflowPhase === 'CREATION' && user) ? 'full-width' : ''} ${showObfuscatedText ? 'obfuscated' : ''}`} data-testid="card-content">
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
  const { boardId, user, votingEnabled, downvotingEnabled, multipleVotesAllowed, retrospectiveMode, workflowPhase = 'CREATION' } = useBoardContext();
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
    multipleVotesAllowed,
    retrospectiveMode,
    workflowPhase
  });

  // Calculate disabled reason for interactions
  const disabledReason = getDisabledReason(retrospectiveMode, workflowPhase);

  // Determine if editing should be disabled for this user
  const isCreator = isCardAuthor();

  // Use the utility function to determine editing permissions
  let editingDisabled = false;

  // Only restrict editing when we have explicit workflow management
  if (workflowPhase && user) { // Only apply restrictions when we have a user context
    // Use the workflow utility function for consistent logic
    const editingAllowed = isCardEditingAllowed(workflowPhase, retrospectiveMode);

    if (workflowPhase === 'CREATION') {
      // During CREATION phase, only creators can edit their cards (regardless of editingAllowed)
      editingDisabled = !isCreator;
    } else if (workflowPhase === 'GROUPING') {
      // During GROUPING phase, check if editing is allowed
      editingDisabled = !editingAllowed;
    } else if (!editingAllowed) {
      // In other phases where editing is not allowed
      editingDisabled = true;
    }
  }

  // When retrospective mode is enabled, hide others' interactions based on workflow phase
  const shouldHideOthersInteractions = retrospectiveMode && !areOthersInteractionsVisible(workflowPhase, retrospectiveMode);

  // Create filtered card data for display
  const displayCardData = shouldHideOthersInteractions ? {
    ...cardData,
    // Filter votes to only show user's own vote count
    votes: cardData.voters && user?.uid && cardData.voters[user.uid] ? Math.abs(cardData.voters[user.uid]) : 0,
    voters: cardData.voters && user?.uid ? { [user.uid]: cardData.voters[user.uid] } : {},
    // Filter reactions to only show user's own
    reactions: cardData.reactions ? Object.fromEntries(
      Object.entries(cardData.reactions).filter(([_emoji, data]) =>
        data.users && user?.uid && data.users[user.uid]
      ).map(([emoji, _data]) => [emoji, { count: 1, users: { [user.uid]: true } }])
    ) : {},
    // Filter comments to only show user's own when interactions are hidden
    comments: cardData.comments ? Object.fromEntries(
      Object.entries(cardData.comments).filter(([_commentId, comment]) =>
        comment.createdBy === user?.uid
      )
    ) : {}
  } : cardData;

  // Determine if dragging should be disabled and if grouping is allowed
  const dragDisabled = !isCardDraggingAllowed(workflowPhase, retrospectiveMode);
  const canDropOnCard = isGroupingAllowed(workflowPhase, retrospectiveMode);

  // Configure drag functionality - allow drag for normal column movement or grouping after reveal
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { cardId, columnId, cardData, groupId },
    canDrag: !dragDisabled || canDropOnCard, // Allow drag when not obfuscated OR when grouping is available
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  }), [cardId, columnId, cardData, dragDisabled, groupId, canDropOnCard]);

  // Configure drop functionality - allow cards to be dropped on this card after "Reveal All Cards" is clicked
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: item => {
      if (canDropOnCard && onCardDropOnCard && item.cardId !== cardId) {
        onCardDropOnCard(item.cardId, cardId);
      }
    },
    canDrop: () => canDropOnCard,
    collect: monitor => ({
      isOver: !!monitor.isOver() && !!monitor.canDrop()
    })
  }), [canDropOnCard, onCardDropOnCard, cardId]);

  // Handle card click - enter edit mode when appropriate
  const handleCardClick = () => {
    if (!isEditing && !canDropOnCard) {
      // Always allow toggleEditMode to handle authorship check and show notifications
      // The toggleEditMode function will handle both authorship and workflow restrictions
      toggleEditMode();
    }
  };

  // Combine drag and drop refs
  const combinedRef = element => {
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

    if (isDragging) {
      classes.push('dragging');
    }
    if (editingDisabled) {
      classes.push('editing-disabled');
    }
    if (dragDisabled && !canDropOnCard) {
      classes.push('drag-disabled');
    }
    if (isOver) {
      classes.push('drop-target');
    }
    if (canDropOnCard) {
      classes.push('groupable');
    }
    if (isCardAuthor()) {
      classes.push('author-editable');
    }

    // Cursor classes - prioritize based on user capabilities
    if (canDropOnCard) {
      // Grouping mode - show grab cursor
      classes.push('cursor-grab');
    } else if (isEditing) {
      // Currently editing - show default cursor
      classes.push('cursor-default');
    } else if (!editingDisabled) {
      // Can edit - show pointer cursor (this covers CREATION phase for creators)
      classes.push('cursor-pointer');
    } else {
      // Cannot edit - show not-allowed cursor
      classes.push('cursor-not-allowed');
    }

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
            retrospectiveMode={retrospectiveMode}
            groupId={groupId}
            workflowPhase={workflowPhase}
            user={user}
            disabledReason={disabledReason}
          />          {!(retrospectiveMode && workflowPhase === 'CREATION' && user) && areInteractionsVisible(workflowPhase, retrospectiveMode) && !groupId && (
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
              disabled={!areInteractionsAllowed(workflowPhase, retrospectiveMode)}
              disabledReason={disabledReason}
              retrospectiveMode={retrospectiveMode}
              workflowPhase={workflowPhase}
            />
          )}

          {!(retrospectiveMode && workflowPhase === 'CREATION' && user) && areInteractionsVisible(workflowPhase, retrospectiveMode) && !groupId && showComments && (
            <Comments
              comments={displayCardData.comments}
              onAddComment={addComment}
              newComment={newComment}
              onCommentChange={setNewComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
              isCommentAuthor={isCommentAuthor}
              interactionsDisabled={!areInteractionsAllowed(workflowPhase, retrospectiveMode)}
              disabledReason={disabledReason}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Card;
