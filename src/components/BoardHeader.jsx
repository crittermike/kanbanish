import { useState } from 'react';
import { MoreHorizontal } from 'react-feather';
import { DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import BoardSeriesPager from './BoardSeriesPager';
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
 * Left side of the board header: people count, series pager, title, and votes left.
 *
 * @param {Object} props
 * @param {string} props.boardTitle - Current board title
 * @param {Function} props.handleBoardTitleChange - Called on title input change
 * @param {Function} props.handleBoardTitleBlur - Called on title input blur (persists to Firebase)
 */
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleBoardTitleBlur, previousBoardId, nextBoardId, onNavigateToBoard }) => (
  <div className="board-title-container">
    <UserCounter />
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
    <VoteCounter />
    <HeaderMoreToggle />
  </div>
);

export default BoardHeader;
