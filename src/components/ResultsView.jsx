import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import Card from './Card';
import CardGroup from './CardGroup';

const isTypingTarget = target => {
  if (!target) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

const ResultsView = ({ onExpandCard = null }) => {
  const {
    workflowPhase,
    resultsViewIndex,
    navigateResults,
    getSortedItemsForResults,
    columns
  } = useBoardContext();

  useEffect(() => {
    if (workflowPhase !== WORKFLOW_PHASES.RESULTS) {
      return undefined;
    }

    const handleKeyDown = e => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) {
        return;
      }
      if (document.querySelector('[aria-modal="true"]')) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateResults('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateResults('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workflowPhase, navigateResults]);

  if (workflowPhase !== WORKFLOW_PHASES.RESULTS) {
    return null;
  }

  const sortedItems = getSortedItemsForResults();
  const currentItem = sortedItems[resultsViewIndex];
  const totalItems = sortedItems.length;

  if (totalItems === 0) {
    return (
      <div className="results-view">
        <div className="no-results">
          <p>No cards or groups to display in results.</p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="results-view">
        <div className="no-results">
          <p>Invalid result index.</p>
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

  return (
    <div className="results-view">
      <div className="results-navigation">
        <button
          className="btn navigation-btn"
          onClick={() => navigateResults('prev')}
          disabled={resultsViewIndex === 0}
          title="Previous result (←)"
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
          title="Next result (→)"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

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
  );
};

export default ResultsView;
