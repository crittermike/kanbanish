import { memo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MessageSquare, CheckSquare, Clock } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useCardOperations } from '../hooks/useCardOperations';
import useEmojiAutocomplete from '../hooks/useEmojiAutocomplete';
import { getInitials } from '../utils/avatarColors';
import {
  filterVisibleInteractionData,
  getDisabledReason
} from '../utils/retrospectiveModeUtils';
import {
  areCommentsAllowed,
  isGroupingAllowed,
  areInteractionsAllowed,
  areInteractionsVisible,
  areReactionsAllowed,
  areReactionsVisible,
  areOthersInteractionsVisible,
  areReviewToolsVisible,
  shouldObfuscateCards,
  isCardEditingAllowed,
  isCardDraggingAllowed,
  WORKFLOW_PHASES
} from '../utils/workflowUtils';
// Import modularized components
import CardHoverActions from './CardHoverActions';
import CardReactions from './CardReactions';
import Comments from './Comments';
import EmojiAutocomplete from './EmojiAutocomplete';
import MarkdownContent from './MarkdownContent';
import VotingControls from './VotingControls';

// Card Editor component for editing mode
const CardEditor = ({
  editedContent,
  setEditedContent,
  handleKeyPress,
  saveCardChanges,
  toggleEditMode,
  deleteCard
}) => {
  const textareaRef = useRef(null);
  const emojiAC = useEmojiAutocomplete(editedContent, setEditedContent, textareaRef);

  const onKeyDown = (e) => {
    if (emojiAC.isOpen) {
      emojiAC.onKeyDown(e);
      if (e.defaultPrevented) return;
    }
    handleKeyPress(e);
  };

  const onChangeHandler = (e) => {
    setEditedContent(e.target.value);
    emojiAC.onChange();
  };

  return (
    <div className="card-edit" onClick={e => e.stopPropagation()}>
      <textarea
        ref={textareaRef}
        value={editedContent}
        onChange={onChangeHandler}
        onKeyDown={onKeyDown}
        className="card-edit-textarea"
        autoFocus
      />
      <EmojiAutocomplete
        suggestions={emojiAC.suggestions}
        selectedIndex={emojiAC.selectedIndex}
        onSelect={emojiAC.onSelect}
        inputRef={textareaRef}
      />
      <div className="card-edit-actions">
        <button className="btn danger-btn" onClick={deleteCard}>Delete</button>
        <button className="btn secondary-btn" onClick={toggleEditMode}>Cancel</button>
        <button className="btn success-btn" onClick={saveCardChanges}>Save</button>
      </div>
    </div>
  );
};

// Card Content component for display mode
const CardContent = ({
  cardData,
  upvoteCard,
  downvoteCard,
  votingEnabled,
  downvotingEnabled,
  userId,
  retrospectiveMode,
  groupId,
  workflowPhase = 'CREATION',
  disabledReason,
  children
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
  const votesVisible = votingEnabled && !groupId && interactionsVisible;

  const displayContent = showObfuscatedText ?
    generateObfuscatedText(cardData.content) :
    cardData.content;

  return (
    <div className="card-header">
      {votesVisible && (
        <VotingControls
          votes={cardData.votes}
          onUpvote={interactionsDisabled ? () => { } : upvoteCard}
          onDownvote={interactionsDisabled ? () => { } : downvoteCard}
          showDownvoteButton={showDownvoteButton}
          disabled={interactionsDisabled}
          disabledReason={disabledReason}
        />
      )}
      <div className={`card-content ${!votesVisible ? 'full-width' : ''} ${showObfuscatedText ? 'obfuscated' : ''}`} data-testid="card-content">
        {showObfuscatedText ? displayContent : <MarkdownContent content={displayContent} />}
      </div>
      {children}
    </div>
  );
};

function Card({
  cardId,
  cardData,
  columnId,
  groupId = null,
  onCardDropOnCard = null,
  dimmed = false,
  onExpandCard = null
}) {
  const { 
    boardId, 
    user, 
    votingEnabled, 
    downvotingEnabled, 
    multipleVotesAllowed, 
    votesPerUser, 
    getUserVoteCount, 
    retrospectiveMode, 
    workflowPhase = 'CREATION',
    hideCardAuthorship,
    recordAction,
    undo,
    actionItems,
    actionItemsEnabled,
    presenceData,
    displayName,
    userColor,
    showDisplayNames
  } = useBoardContext();
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
    multipleVotesAllowed,
    retrospectiveMode,
    workflowPhase,
    votesPerUser,
    getUserVoteCount,
    recordAction,
    undo,
    displayName,
    userColor
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
  const displayCardData = filterVisibleInteractionData(cardData, user?.uid, shouldHideOthersInteractions);

  const actionItemEntry = actionItemsEnabled && actionItems && Object.entries(actionItems).find(
    ([_id, item]) => item.sourceCardId === cardId && item.sourceColumnId === columnId
  );
  const hasActionItem = !!actionItemEntry;

  const commentCount = Object.keys(displayCardData.comments || {}).length;
  const reviewToolsVisible = !groupId && areReviewToolsVisible(workflowPhase, retrospectiveMode);
  const commentsAllowed = !groupId && areCommentsAllowed(workflowPhase, retrospectiveMode);
  const reactionsVisible = !groupId && areReactionsVisible(workflowPhase, retrospectiveMode);
  const reactionsDisabled = !areReactionsAllowed(workflowPhase, retrospectiveMode);
  const reactionDisabledReason = reactionsDisabled ? 'cards-not-revealed' : null;
  const showCommentBadge = !groupId && commentCount > 0 && reviewToolsVisible;

  // Determine if dragging should be disabled and if grouping is allowed
  const dragDisabled = !isCardDraggingAllowed(workflowPhase, retrospectiveMode);
  const canDropOnCard = isGroupingAllowed(workflowPhase, retrospectiveMode);
  
  // In creation mode, allow authors to drag their cards between columns
  const isCreationMode = workflowPhase === 'CREATION';
  const canDragBetweenColumns = !dragDisabled || (isCreationMode && isCreator);

  // Configure drag functionality - allow drag for normal column movement or grouping after reveal
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { cardId, columnId, cardData, groupId },
    canDrag: canDragBetweenColumns || canDropOnCard,
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  }), [cardId, columnId, cardData, dragDisabled, groupId, canDropOnCard, canDragBetweenColumns]);

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

  // Handle card click - open detail modal when appropriate
  const handleCardClick = () => {
    if (!isEditing && !canDropOnCard && onExpandCard) {
      onExpandCard(cardId, columnId);
    }
  };

  // Combine drag and drop refs
  const combinedRef = element => {
    cardElementRef.current = element;
    if (canDragBetweenColumns || canDropOnCard) {
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
    if (!canDragBetweenColumns && !canDropOnCard) {
      classes.push('drag-disabled');
    }
    if (isOver) {
      classes.push('drop-target');
    }
    if (canDropOnCard) {
      classes.push('groupable');
    }
    // Only show author indicator during creation phase to maintain anonymity in later phases
    if (isCardAuthor() && workflowPhase === WORKFLOW_PHASES.CREATION && !hideCardAuthorship) {
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
      // For creation mode, show grab cursor if you're the author (can drag between columns)
      // For non-retrospective mode, always show grab cursor
      const isCreationMode = workflowPhase === 'CREATION';
      const isNonRetrospectiveMode = !retrospectiveMode;
      
      if ((isCreationMode && isCreator) || isNonRetrospectiveMode) {
        classes.push('cursor-grab');
      } else {
        // Show not-allowed cursor for non-authors in creation mode or other retrospective phases
        classes.push('cursor-not-allowed');
      }
    }

    return classes.join(' ');
  };

  return (
    <div
      ref={combinedRef}
      className={`card ${getDynamicClasses()}${dimmed ? ' card-filtered-out' : ''}`}
      style={{ borderLeft: displayCardData.color ? `4px solid ${displayCardData.color}` : undefined }}
      onClick={handleCardClick}
      data-card-id={cardId}
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
            upvoteCard={upvoteCard}
            downvoteCard={downvoteCard}
            votingEnabled={votingEnabled}
            downvotingEnabled={downvotingEnabled}
            userId={user?.uid}
            retrospectiveMode={retrospectiveMode}
            groupId={groupId}
            workflowPhase={workflowPhase}
            disabledReason={disabledReason}
          >
            {reviewToolsVisible && (
              <CardHoverActions
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                setShowComments={setShowComments}
                toggleComments={toggleComments}
                setEmojiPickerPosition={setEmojiPickerPosition}
                emojiPickerPosition={emojiPickerPosition}
                addReaction={addReaction}
                hasUserReactedWithEmoji={hasUserReactedWithEmoji}
                reactionDisabled={reactionsDisabled}
                reactionDisabledReason={reactionDisabledReason}
                showEmojiAction={reactionsVisible}
                onEdit={toggleEditMode}
              />
            )}
          </CardContent>

          {showDisplayNames && (
            <div className="card-author">
              <div 
                className="card-author-avatar" 
                style={{ 
                  backgroundColor: presenceData?.[displayCardData.createdBy]?.color || displayCardData.userColor || 'var(--text-muted)' 
                }}
              >
                {getInitials(presenceData?.[displayCardData.createdBy]?.displayName || displayCardData.displayName || 'Anonymous')}
              </div>
              <span className="card-author-name">
                {presenceData?.[displayCardData.createdBy]?.displayName || displayCardData.displayName || 'Anonymous'}
              </span>
            </div>
          )}

          {displayCardData.tags && displayCardData.tags.length > 0 && (
            <div className="card-tags">
              {displayCardData.tags.map(tag => (
                <span key={tag} className="card-tag-chip">{tag}</span>
              ))}
            </div>
          )}

          {/* Inline badges for action items, timer, and comments */}
          {(hasActionItem || cardData.timer?.isRunning || (!isEditing && showCommentBadge)) && (
            <div className="card-inline-badges">
              {cardData.timer?.isRunning && (
                <span className="card-inline-badge timer-badge" title="Timer running">
                  <Clock size={11} /> Timer
                </span>
              )}
              {hasActionItem && (
                <span className="card-inline-badge action-item-badge" title="Converted to action item">
                  <CheckSquare size={11} /> Action item
                </span>
              )}
              {!isEditing && showCommentBadge && (
                <span className="card-inline-badge comment-badge" title={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}>
                  <MessageSquare size={11} /> {commentCount}
                </span>
              )}
            </div>
          )}

          {reactionsVisible && (
            <CardReactions
              reactions={displayCardData.reactions}
              userId={user?.uid}
              addReaction={addReaction}
              disabled={reactionsDisabled}
              disabledReason={reactionDisabledReason}
            />
          )}

          {reviewToolsVisible && showComments && (
            <Comments
              comments={displayCardData.comments}
              onAddComment={addComment}
              newComment={newComment}
              onCommentChange={setNewComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
              isCommentAuthor={isCommentAuthor}
              interactionsDisabled={!commentsAllowed}
              disabledReason={!commentsAllowed ? 'cards-not-revealed' : null}
              presenceData={presenceData}
            />
          )}
        </>
      )}
    </div>
  );
}

export default memo(Card);
