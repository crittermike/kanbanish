import { ChevronLeft, ChevronRight } from 'react-feather';

/**
 * Pager for navigating between boards that are linked into a series.
 *
 * Renders a "Previous" and/or "Next" control depending on which links exist.
 * Returns null when the board has no series neighbours, so it takes up no space
 * on standalone boards.
 *
 * @param {Object} props
 * @param {string|null} props.previousBoardId - ID of the previous board, if any
 * @param {string|null} props.nextBoardId - ID of the next board, if any
 * @param {Function} props.onNavigate - Called with a board ID to navigate to it
 */
const BoardSeriesPager = ({ previousBoardId, nextBoardId, onNavigate }) => {
  if (!previousBoardId && !nextBoardId) return null;

  return (
    <div className="board-series-pager" role="group" aria-label="Board series navigation">
      {previousBoardId && (
        <button
          type="button"
          className="board-series-btn board-series-prev"
          onClick={() => onNavigate(previousBoardId)}
          title="Go to previous board in series"
          aria-label="Previous board in series"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="board-series-btn-label">Previous</span>
        </button>
      )}
      {nextBoardId && (
        <button
          type="button"
          className="board-series-btn board-series-next"
          onClick={() => onNavigate(nextBoardId)}
          title="Go to next board in series"
          aria-label="Next board in series"
        >
          <span className="board-series-btn-label">Next</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default BoardSeriesPager;
