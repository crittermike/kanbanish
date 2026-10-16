import { useState } from 'react';
import { Home, MoreHorizontal, Search } from 'react-feather';
import { DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import BoardSeriesPager from './BoardSeriesPager';
import SortMenu from './SortMenu';
import UserCounter from './UserCounter';
import VoteCounter from './VoteCounter';

// On narrow screens, header.css hides secondary header icons until this is expanded.
const HeaderMoreToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <button
      className="header-more-btn"
      onClick={() => setIsOpen(open => !open)}
      aria-expanded={isOpen}
      title="More"
      aria-label="More options"
    >
      <MoreHorizontal size={16} />
    </button>
  );
};

/**
 * Board header with title input, search, sort, and user/vote counters.
 *
 * @param {Object} props
 * @param {string} props.boardTitle - Current board title
 * @param {Function} props.handleBoardTitleChange - Called on title input change
 * @param {Function} props.handleBoardTitleBlur - Called on title input blur (persists to Firebase)
 * @param {boolean} props.showSort - Show the sort menu (when voting is on or cards are sorted by votes)
 */
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleBoardTitleBlur, onGoHome, onSearchOpen, isSearchOpen, previousBoardId, nextBoardId, onNavigateToBoard, showSort, sortByVotes, setSortByVotes }) => (
  <div className="board-title-container">
    {onGoHome && (
      <button
        className="home-btn"
        title="Back to Dashboard"
        aria-label="Back to Dashboard"
        onClick={onGoHome}
      >
        <Home size={16} />
      </button>
    )}
    {onNavigateToBoard && (
      <BoardSeriesPager
        previousBoardId={previousBoardId}
        nextBoardId={nextBoardId}
        onNavigate={onNavigateToBoard}
      />
    )}
    <input
      type="text"
      id="board-title"
      aria-label="Board title"
      placeholder={DEFAULT_BOARD_TITLE}
      value={boardTitle}
      onChange={handleBoardTitleChange}
      onBlur={handleBoardTitleBlur}
      className="header-input"
    />
    <HeaderMoreToggle />
    {showSort && setSortByVotes && (
      <SortMenu sortByVotes={sortByVotes} setSortByVotes={setSortByVotes} />
    )}
    {!isSearchOpen && (
      <button
        className="search-trigger-btn"
        onClick={onSearchOpen}
        title="Search cards (Ctrl+F)"
        aria-label="Search cards"
      >
        <Search size={16} />
      </button>
    )}
    <div className="action-buttons">
      <UserCounter />
      <VoteCounter />
    </div>

  </div>
);

export default BoardHeader;
