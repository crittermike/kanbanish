import { ChevronLeft, ChevronRight } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import CardDetailModal from './modals/CardDetailModal';

const ResultsView = () => {
  const {
    workflowPhase,
    resultsViewIndex,
    navigateResults,
    getSortedItemsForResults,
    columns,
    getTotalVotes
  } = useBoardContext();

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

  // For groups, use the first card in the group
  const primaryResultCardId = currentItem.type === 'group'
    ? currentItem.data.cardIds?.find(cardId => columns[currentItem.columnId]?.cards?.[cardId])
    : currentItem.id;

  // Build full card list for keyboard navigation within the inline detail
  const reviewCardList = sortedItems.flatMap(item => {
    if (item.type === 'card') {
      return [{ cardId: item.id, columnId: item.columnId }];
    }
    return (item.data.cardIds || [])
      .filter(cardId => columns[item.columnId]?.cards?.[cardId])
      .map(cardId => ({ cardId, columnId: item.columnId }));
  });

  return (
    <div className="results-view">
      <div className="results-header">
        <h2>Results</h2>
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
          <CardDetailModal
            key={primaryResultCardId}
            isOpen={true}
            cardId={primaryResultCardId}
            columnId={currentItem.columnId}
            contextLabel="Retro review"
            inline={true}
            cardList={reviewCardList}
            onNavigateCard={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default ResultsView;
