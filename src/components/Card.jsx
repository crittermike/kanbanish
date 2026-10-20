import { memo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MessageSquare } from 'react-feather';
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
  isCardFromCurrentRun,
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

// Skeleton line widths (in %) that roughly match the hidden card's length without revealing it
const SKELETON_CHARS_PER_LINE = 36;
const SKELETON_MAX_LINES = 4;
const getSkeletonLineWidths = text => {
  const length = (text || '').trim().length;
  const lineCount = Math.min(SKELETON_MAX_LINES, Math.max(1, Math.ceil(length / SKELETON_CHARS_PER_LINE)));
  const remainder = length % SKELETON_CHARS_PER_LINE || SKELETON_CHARS_PER_LINE;
  const lastWidth = lineCount === SKELETON_MAX_LINES
    ? 60
    : Math.max(30, Math.round((remainder / SKELETON_CHARS_PER_LINE) * 100));
  return Array.from({ length: lineCount }, (_, i) => (i === lineCount - 1 ? lastWidth : 100));
};

// Card Content component for display mode
const CardContent = ({
  cardData,
  userId,
  retrospectiveMode,
  workflowPhase = 'CREATION',
  flowStartedAt = null,
  children
}) => {
  // During Add, hide other people's cards added in this run; cards from before stay visible
  const isCreator = cardData.createdBy && userId && cardData.createdBy === userId;
  const showObfuscatedText = shouldObfuscateCards(workflowPhase, retrospectiveMode) && !isCreator &&
    isCardFromCurrentRun(cardData, flowStartedAt);

  return (
    <div className="card-header">
      {showObfuscatedText ? (
        <div className="card-content obfuscated" data-testid="card-content" role="img" aria-label="Hidden card">
          {getSkeletonLineWidths(cardData.content).map((width, index) => (
            <span key={index} className="card-skeleton-line" style={{ width: `${width}%` }} />
          ))}
        </div>
      ) : (
        <div className="card-content" data-testid="card-content">
          <MarkdownContent content={cardData.content} />
        </div>
      )}
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
    flowStartedAt,
    recordAction,
    undo,
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

  const commentCount = Object.keys(displayCardData.comments || {}).length;
  const reviewToolsVisible = !groupId && areReviewToolsVisible(workflowPhase, retrospectiveMode);
  const commentsAllowed = !groupId && areCommentsAllowed(workflowPhase, retrospectiveMode);
  const reactionsVisible = !groupId && areReactionsVisible(workflowPhase, retrospectiveMode);
  const reactionsDisabled = !areReactionsAllowed(workflowPhase, retrospectiveMode);
  const reactionDisabledReason = reactionsDisabled ? 'cards-not-revealed' : null;
  const showCommentBadge = !groupId && commentCount > 0 && reviewToolsVisible;
  const votesVisible = votingEnabled && !groupId && areInteractionsVisible(workflowPhase, retrospectiveMode);
  const votingDisabled = !areInteractionsAllowed(workflowPhase, retrospectiveMode);
  const userVotes = (user?.uid && cardData.voters?.[user.uid]) || 0;
  const voteLimitReached = votesVisible && votesPerUser > 0 && !!user?.uid &&
    getUserVoteCount(user.uid) >= votesPerUser && (multipleVotesAllowed || userVotes === 0);

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
    // Only show author indicator during creation phase, and never on anonymous boards
    if (isCardAuthor() && workflowPhase === WORKFLOW_PHASES.CREATION && showDisplayNames) {
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
          <div className="card-main">
            {votesVisible && (
              <VotingControls
                votes={displayCardData.votes}
                onUpvote={upvoteCard}
                onDownvote={downvoteCard}
                showDownvoteButton={downvotingEnabled || (multipleVotesAllowed && userVotes > 0)}
                downvoteRemovesVote={!downvotingEnabled}
                disabled={votingDisabled}
                disabledReason={disabledReason}
                userVote={userVotes}
                limitReached={voteLimitReached}
              />
            )}
            <div className="card-body">
              <CardContent
                cardData={displayCardData}
                userId={user?.uid}
                retrospectiveMode={retrospectiveMode}
                workflowPhase={workflowPhase}
                flowStartedAt={flowStartedAt}
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

              {showCommentBadge && (
                <div className="card-inline-badges">
                  <span className="card-inline-badge comment-badge" title={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}>
                    <MessageSquare size={11} /> {commentCount}
                  </span>
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
            </div>
          </div>

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
