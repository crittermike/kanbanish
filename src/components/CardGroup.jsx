import { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ChevronDown, ChevronRight, Layers, Edit2, MessageSquare } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useGroupOperations } from '../hooks/useGroupOperations';
import { areInteractionsVisible, areOthersInteractionsVisible, areInteractionsAllowed, isGroupingAllowed } from '../utils/workflowUtils';
import Card from './Card';
import Comments from './Comments';
import EmojiPicker from './EmojiPicker';
import VotingControls from './VotingControls';

/**
 * CardGroup component renders a group of cards with expand/collapse functionality
 */
function CardGroup({
  groupId,
  groupData,
  columnId,
  columnData, // Add columnData to access all cards
  showNotification,
  sortByVotes
}) {
  const {
    boardId,
    user,
    moveCard,
    ungroupCards,
    updateGroupName,
    votingEnabled,
    downvotingEnabled,
    upvoteGroup,
    downvoteGroup,
    retrospectiveMode,
    workflowPhase
  } = useBoardContext();

  // Initialize group operations hook
  const groupOperations = useGroupOperations({
    boardId,
    columnId,
    groupId,
    groupData,
    user,
    showNotification,
    retrospectiveMode,
    workflowPhase
  });

  const [isExpanded, setIsExpanded] = useState(groupData.expanded !== false); // Default to expanded
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupData.name || 'Unnamed Group');
  const groupRef = useRef(null);

  // When retrospective mode is enabled, hide others' interactions based on workflow phase
  const shouldHideOthersInteractions = retrospectiveMode && !areOthersInteractionsVisible(workflowPhase, retrospectiveMode);

  // Create filtered group data for display
  const displayGroupData = shouldHideOthersInteractions ? {
    ...groupData,
    // Filter votes to only show user's own vote count
    votes: groupData.voters && user?.uid && groupData.voters[user.uid] ? Math.abs(groupData.voters[user.uid]) : 0,
    voters: groupData.voters && user?.uid ? { [user.uid]: groupData.voters[user.uid] } : {},
    // Filter reactions to only show user's own reactions
    reactions: groupData.reactions ? Object.fromEntries(
      Object.entries(groupData.reactions).filter(([_emoji, reactionData]) => 
        reactionData.users && user?.uid && reactionData.users[user.uid]
      ).map(([emoji, _reactionData]) => [
        emoji,
        {
          count: 1, // Only show count of 1 for user's own reactions
          users: { [user.uid]: true }
        }
      ])
    ) : {},
    // Filter comments to only show user's own comments
    comments: groupData.comments ? Object.fromEntries(
      Object.entries(groupData.comments).filter(([_commentId, comment]) => 
        comment.createdBy === user?.uid
      )
    ) : {}
  } : groupData;

  // Set up drop target for cards to be added to this group
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: item => {
      // Allow dropping cards from any column, as long as the card is not already in this group
      if (!groupData.cardIds?.includes(item.cardId) && item.groupId !== groupId) {
        moveCard(item.cardId, item.columnId, columnId, groupId);
        showNotification('Card added to group');
        return { handled: true }; // Signal that this drop was handled
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver()
    })
  }), [columnId, groupId, groupData.cardIds, moveCard, showNotification]);

  // Apply the drop ref to group element
  drop(groupRef);

  // Voting handlers
  const handleUpvoteGroup = e => {
    e.stopPropagation();
    upvoteGroup(columnId, groupId, groupData.votes || 0, showNotification);
  };

  const handleDownvoteGroup = e => {
    e.stopPropagation();
    downvoteGroup(columnId, groupId, groupData.votes || 0, showNotification);
  };

  // Sort cards within the group
  const sortedCards = () => {
    if (!groupData.cardIds || !columnData.cards) {
      return [];
    }

    // Get actual card data from column for cards in this group
    const cardsArray = groupData.cardIds
      .map(cardId => {
        const cardData = columnData.cards[cardId];
        return cardData ? { id: cardId, ...cardData } : null;
      })
      .filter(Boolean); // Remove null entries

    if (sortByVotes) {
      return cardsArray.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      return cardsArray.sort((a, b) => (a.created || 0) - (b.created || 0));
    }
  };

  // Handle group name editing
  const handleNameChange = e => {
    setEditedName(e.target.value);
  };

  const saveGroupName = () => {
    if (boardId && editedName.trim()) {
      updateGroupName(columnId, groupId, editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      saveGroupName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(groupData.name || 'Unnamed Group');
    }
  };

  // Handle ungrouping
  const handleUngroup = () => {
    if (window.confirm('Are you sure you want to ungroup these cards?')) {
      ungroupCards(columnId, groupId);
      showNotification('Cards ungrouped');
    }
  };

  const cardCount = groupData.cardIds ? groupData.cardIds.length : 0;

  return (
    <div
      ref={groupRef}
      className={`card-group ${isOver ? 'drag-over' : ''}`}
    >
      <div className="card-group-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="card-group-title-section">
          {isExpanded ? (
            <ChevronDown size={16} className="expand-icon" />
          ) : (
            <ChevronRight size={16} className="expand-icon" />
          )}

          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={handleNameChange}
              onBlur={saveGroupName}
              onKeyDown={handleKeyPress}
              className="group-name-input"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="group-name-container">
              <h3
                className={`card-group-name ${!isGroupingAllowed(workflowPhase, retrospectiveMode) ? 'non-editable' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  if (isGroupingAllowed(workflowPhase, retrospectiveMode)) {
                    setIsEditingName(true);
                  }
                }}
              >
                {groupData.name || 'Unnamed Group'}
              </h3>
              {isGroupingAllowed(workflowPhase, retrospectiveMode) && (
                <button
                  className="edit-group-name-btn"
                  onClick={e => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  title="Edit group name"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card-group-actions">
          {votingEnabled && areInteractionsVisible(workflowPhase, retrospectiveMode) && (
            <VotingControls
              votes={displayGroupData.votes || 0}
              onUpvote={handleUpvoteGroup}
              onDownvote={handleDownvoteGroup}
              showDownvoteButton={downvotingEnabled}
              disabled={!areInteractionsAllowed(workflowPhase, retrospectiveMode)}
            />
          )}

          <div className="card-group-info">
            <span className="card-count-badge" title={`${cardCount} card${cardCount !== 1 ? 's' : ''}`}>
              {cardCount}
            </span>
            {areInteractionsAllowed(workflowPhase, retrospectiveMode) && (
              <button
                className="group-action-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleUngroup();
                }}
                title="Ungroup cards"
              >
                <Layers size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Interactions Section - Comments and Reactions buttons */}
      {areInteractionsVisible(workflowPhase, retrospectiveMode) && (
        <div className="group-interactions-section">
          <div className="group-interactions-left">
            {/* Existing Group Reactions - inline like cards */}
            {displayGroupData.reactions && Object.entries(displayGroupData.reactions).map(([emoji, reactionData]) => {
              if (reactionData.count <= 0) return null;
              const hasUserReacted = reactionData.users && reactionData.users[user?.uid];
              return (
                <span 
                  key={emoji} 
                  className={`reaction-item ${hasUserReacted ? 'user-reacted' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    if (hasUserReacted) {
                      groupOperations.addReaction(e, emoji); // This will remove it
                    } else {
                      groupOperations.addReaction(e, emoji);
                    }
                  }}
                >
                  {emoji} {reactionData.count}
                </span>
              );
            })}
            
            {/* Group Reactions Button - add button like cards */}
            <button
              className="interaction-btn reactions-btn"
              onClick={e => {
                e.stopPropagation();
                if (groupOperations.emojiButtonRef?.current) {
                  const buttonRect = groupOperations.emojiButtonRef.current.getBoundingClientRect();
                  groupOperations.setEmojiPickerPosition({
                    top: buttonRect.bottom + window.scrollY + 5,
                    left: buttonRect.left + window.scrollX
                  });
                }
                groupOperations.setShowEmojiPicker(!groupOperations.showEmojiPicker);
              }}
              title="Add reaction"
              ref={groupOperations.emojiButtonRef}
            >
              +
            </button>
          </div>
          <div className="group-interactions-right">
            {/* Group Comments Button - right aligned like cards */}
            <button
              className="interaction-btn comments-btn"
              onClick={e => {
                e.stopPropagation();
                groupOperations.toggleComments();
              }}
              title="Toggle comments"
            >
              <MessageSquare size={16} />
              {Object.keys(displayGroupData.comments || {}).length > 0 && (
                <span className="interaction-count">{Object.keys(displayGroupData.comments || {}).length}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {groupOperations.showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={groupOperations.addReaction}
          position={groupOperations.emojiPickerPosition}
          onClose={() => groupOperations.setShowEmojiPicker(false)}
          hasUserReactedWithEmoji={groupOperations.hasUserReactedWithEmoji}
        />
      )}

      {/* Group Comments Section - only show when comments are toggled on */}
      {areInteractionsVisible(workflowPhase, retrospectiveMode) && groupOperations.showComments && (
        <div className="group-comments-section">
          <Comments
            comments={displayGroupData.comments}
            onAddComment={groupOperations.addComment}
            newComment={groupOperations.newComment}
            onCommentChange={groupOperations.setNewComment}
            onEditComment={groupOperations.editComment}
            onDeleteComment={groupOperations.deleteComment}
            isCommentAuthor={groupOperations.isCommentAuthor}
            interactionsDisabled={!areInteractionsAllowed(workflowPhase, retrospectiveMode)}
          />
        </div>
      )}

      {isExpanded && (
        <div className="card-group-content">
          {sortedCards().length === 0 ? (
            <div className="empty-group-placeholder">
              <span>No cards in this group</span>
              <span>Drag cards here to add them</span>
            </div>
          ) : (
            sortedCards().map(card => (
              <Card
                key={card.id}
                cardId={card.id}
                cardData={card}
                columnId={columnId}
                groupId={groupId}
                showNotification={showNotification}
              />
            ))
          )}
        </div>
      )}

      {!isExpanded && cardCount > 0 && (
        <div className="card-group-preview">
          {/* Main card with multiple box-shadows to simulate stack */}
          <div 
            className={`card-preview main-card ${cardCount > 1 ? 'with-stack-shadow' : ''}`}
            style={{
              boxShadow: cardCount > 1 ? 
                `0 2px 8px rgba(0, 0, 0, 0.15), 
                 0 1px 3px rgba(0, 0, 0, 0.1),
                 ${Array.from({ length: Math.min(cardCount - 1, 5) }, (_, i) => {
                   const offset = (i + 1) * 3;
                   return `${offset}px ${offset}px 0 0 var(--card-bg), ${offset}px ${offset}px 0 1px var(--border-color)`;
                 }).join(', ')}` : 
                '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="card-preview-content">
              {sortedCards()[0]?.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardGroup;
