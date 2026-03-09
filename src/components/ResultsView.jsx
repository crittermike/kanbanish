import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Maximize2 } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import Card from './Card';
import CardGroup from './CardGroup';
import CardTimerControls from './CardTimerControls';

const ResultsView = ({ onExpandCard = null }) => {
  const {
    boardId,
    user,
    workflowPhase,
    resultsViewIndex,
    navigateResults,
    getSortedItemsForResults,
    columns,
    getTotalVotes
  } = useBoardContext();
  const [showTimer, setShowTimer] = useState(false);

  if (workflowPhase !== WORKFLOW_PHASES.RESULTS) {
    return null;
  }

  const sortedItems = getSortedItemsForResults();
  const currentItem = sortedItems[resultsViewIndex];
  const totalItems = sortedItems.length;

  if (totalItems === 0) {
    return (
      <div className="results-view">
        <div className="results-header">
          <h2>Results</h2>
        </div>
        <div className="results-content">
          <div className="no-results">
            <p>No cards or groups to display in results.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="results-view">
        <div className="results-header">
          <h2>Results</h2>
        </div>
        <div className="results-content">
          <div className="no-results">
            <p>Invalid result index.</p>
          </div>
        </div>
      </div>
    );
  }

  const columnData = columns[currentItem.columnId];
  const reviewCardList = sortedItems.flatMap(item => {
    if (item.type === 'card') {
      return [{ cardId: item.id, columnId: item.columnId }];
    }

    return (item.data.cardIds || [])
      .filter(cardId => columns[item.columnId]?.cards?.[cardId])
      .map(cardId => ({ cardId, columnId: item.columnId }));
  });

  const handleExpandResultCard = (nextCardId, nextColumnId) => {
    if (!onExpandCard) {
      return;
    }

    onExpandCard(nextCardId, nextColumnId, {
      cardList: reviewCardList,
      contextLabel: 'Retro review'
    });
  };

  const primaryResultCardId = currentItem.type === 'group'
    ? currentItem.data.cardIds?.find(cardId => columns[currentItem.columnId]?.cards?.[cardId])
    : currentItem.id;
  const primaryResultCard = primaryResultCardId
    ? columns[currentItem.columnId]?.cards?.[primaryResultCardId]
    : null;

  return (
    <div className="results-view">
      <div className="results-header">
        <h2>Results</h2>
        <p className="results-subtitle">
          Review the board one item at a time with quick timer access, then open detail view whenever you want labels or discussion.
        </p>
      </div>

      <div className="results-navigation">
        <button
          className="btn navigation-btn"
          onClick={() => navigateResults('prev')}
          disabled={resultsViewIndex === 0}
          title="Previous result"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="results-counter">
          <span className="current-position">{resultsViewIndex + 1}</span>
          <span className="divider"> / </span>
          <span className="total-count">{totalItems}</span>
        </div>

        <button
          className="btn navigation-btn"
          onClick={() => navigateResults('next')}
          disabled={resultsViewIndex === totalItems - 1}
          title="Next result"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="results-content">
        <div className="result-item">
          <div className="result-meta">
            <div className="result-type">
              {currentItem.type === 'group' ? 'Group' : 'Card'}
            </div>
            <div className="result-votes">
              {currentItem.votes} out of {getTotalVotes()} total vote{getTotalVotes() !== 1 ? 's' : ''}
            </div>
            <div className="result-column">
              from {columnData?.title || 'Unknown Column'}
            </div>
          </div>

          {primaryResultCardId && (
            <div className="result-review-actions">
              {onExpandCard && (
                <button
                  className="btn secondary-btn result-detail-btn"
                  onClick={() => handleExpandResultCard(primaryResultCardId, currentItem.columnId)}
                >
                  <Maximize2 size={16} />
                  {currentItem.type === 'group' ? 'Review cards in detail' : 'Open detail view'}
                </button>
              )}
              <button
                className="btn secondary-btn result-timer-btn"
                onClick={() => setShowTimer(isOpen => !isOpen)}
                aria-expanded={showTimer}
              >
                <Clock size={16} />
                {showTimer ? 'Hide timer' : 'Timer'}
              </button>
            </div>
          )}

          {showTimer && primaryResultCard && (
            <div className="result-inline-timer">
              <CardTimerControls
                boardId={boardId}
                columnId={currentItem.columnId}
                cardId={primaryResultCardId}
                timerData={primaryResultCard.timer}
                user={user}
                className="result-card-timer"
              />
            </div>
          )}

          <div className="result-display">
            {currentItem.type === 'group' ? (
              <CardGroup
                key={currentItem.id}
                groupId={currentItem.id}
                groupData={currentItem.data}
                columnId={currentItem.columnId}
                columnData={columnData}
                sortByVotes={true}
                onExpandCard={handleExpandResultCard}
              />
            ) : (
              <Card
                key={currentItem.id}
                cardId={currentItem.id}
                cardData={currentItem.data}
                columnId={currentItem.columnId}
                onExpandCard={handleExpandResultCard}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
