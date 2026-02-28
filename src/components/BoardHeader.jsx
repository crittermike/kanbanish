import { Home, Search, CheckSquare } from 'react-feather';
import { DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import UserCounter from './UserCounter';
/**
 * Board header with title input, user/vote counters, and share/export buttons.
 *
 * @param {Object} props
 * @param {string} props.boardTitle - Current board title
 * @param {Function} props.handleBoardTitleChange - Called on title input change
 * @param {Function} props.handleBoardTitleBlur - Called on title input blur (persists to Firebase)
 */
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleBoardTitleBlur, onGoHome, onSearchOpen, isSearchOpen, onActionItemsOpen, actionItemCount }) => (
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
      <button
        className="action-items-header-btn"
        onClick={onActionItemsOpen}
        title="Action Items"
        aria-label={`Action Items${actionItemCount > 0 ? ` (${actionItemCount} open)` : ''}`}
      >
        <CheckSquare size={16} />
        {actionItemCount > 0 && <span className="action-items-badge">{actionItemCount}</span>}
      </button>
    </div>

  </div>
);

export default BoardHeader;
