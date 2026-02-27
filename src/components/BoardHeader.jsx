import { Link, FileText } from 'react-feather';
import { DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import TotalVoteCounter from './TotalVoteCounter';
import UserCounter from './UserCounter';
import VoteCounter from './VoteCounter';

/**
 * Board header with title input, user/vote counters, and share/export buttons.
 *
 * @param {Object} props
 * @param {string} props.boardTitle - Current board title
 * @param {Function} props.handleBoardTitleChange - Called on title input change
 * @param {Function} props.handleBoardTitleBlur - Called on title input blur (persists to Firebase)
 * @param {Function} props.copyShareUrl - Copies the board share URL to clipboard
 * @param {Function} props.handleExportBoard - Opens the export board modal
 */
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleBoardTitleBlur, copyShareUrl, handleExportBoard }) => (
  <div className="board-title-container">
    <input
      type="text"
      id="board-title"
      placeholder={DEFAULT_BOARD_TITLE}
      value={boardTitle}
      onChange={handleBoardTitleChange}
      onBlur={handleBoardTitleBlur}
      className="header-input"
    />
    <div className="action-buttons">
      <UserCounter />
      <VoteCounter />
      <TotalVoteCounter />
      <button
        id="copy-share-url"
        className="btn secondary-btn btn-with-icon"
        title="Copy Share URL"
        onClick={copyShareUrl}
      >
        <Link size={16} />
        Share
      </button>
      <button
        id="export-board"
        className="btn secondary-btn btn-with-icon"
        onClick={handleExportBoard}
      >
        <FileText size={16} />
        Export
      </button>
    </div>

  </div>
);

export default BoardHeader;
