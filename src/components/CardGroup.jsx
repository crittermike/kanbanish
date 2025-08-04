import { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ChevronDown, ChevronRight, Layers, Edit2 } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { areInteractionsVisible, areOthersInteractionsVisible, areInteractionsAllowed, isGroupingAllowed } from '../utils/workflowUtils';
import Card from './Card';
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
    voters: groupData.voters && user?.uid ? { [user.uid]: groupData.voters[user.uid] } : {}
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
            <span className="card-count">{cardCount} card{cardCount !== 1 ? 's' : ''}</span>
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
                 3px 3px 0 0 var(--card-bg),
                 3px 3px 0 1px var(--border-color),
                 6px 6px 0 0 var(--card-bg),
                 6px 6px 0 1px var(--border-color)` : 
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
