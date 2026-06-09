import { useMemo, useRef, useState } from 'react';
import { Link2 } from 'react-feather';
import { useNotification } from '../../context/NotificationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useRecentBoards } from '../../hooks/useRecentBoards';
import { extractBoardId } from '../../utils/boardLink';

/**
 * Modal for linking the current board to a previously-created board as the
 * previous entry in a series. Lets the user paste a board link/ID or pick from
 * their recent boards.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.currentBoardId - The current board's ID (excluded from picker)
 * @param {Function} props.onLink - async (previousBoardId) => boolean; resolves true on success
 */
const LinkPreviousBoardModal = ({ isOpen, onClose, currentBoardId, onLink }) => {
  const { recentBoards } = useRecentBoards();
  const { showNotification } = useNotification();
  const modalRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusTrap(modalRef, isOpen, { onClose });

  const candidates = useMemo(
    () => (recentBoards || []).filter(b => b.id !== currentBoardId),
    [recentBoards, currentBoardId]
  );

  if (!isOpen) return null;

  const handleSelectRecent = (id) => {
    setSelectedId(id);
    setInputValue('');
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setSelectedId(null);
  };

  const handleLink = async () => {
    const targetId = extractBoardId(inputValue) || selectedId;
    if (!targetId) {
      showNotification('Enter a board link or pick a recent board');
      return;
    }
    if (targetId === currentBoardId) {
      showNotification("A board can't be linked to itself");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onLink(targetId);
      if (ok) {
        showNotification('Linked to previous board');
        onClose();
      } else {
        showNotification("Couldn't link that board — it may not exist, or linking it would create a loop in the series");
      }
    } catch {
      showNotification('Something went wrong linking the board');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-container link-previous-modal"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-previous-title"
      >
        <div className="modal-header">
          <h2 id="link-previous-title">Link to previous board</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="link-previous-help">
            Connect this board to an earlier one so you can page back to it — handy for
            reviewing the previous board&apos;s commitments.
          </p>

          <label className="link-previous-label" htmlFor="link-previous-input">
            Paste a board link or ID
          </label>
          <input
            id="link-previous-input"
            type="text"
            className="link-previous-input"
            placeholder="https://www.kanbanish.com/?board=…"
            value={inputValue}
            onChange={handleInputChange}
          />

          {candidates.length > 0 && (
            <>
              <div className="link-previous-divider">or pick a recent board</div>
              <div className="link-previous-list">
                {candidates.map(board => (
                  <button
                    key={board.id}
                    type="button"
                    className={`link-previous-item ${selectedId === board.id ? 'selected' : ''}`}
                    onClick={() => handleSelectRecent(board.id)}
                    aria-pressed={selectedId === board.id}
                  >
                    <span className="link-previous-item-title">
                      {board.title || 'Untitled Board'}
                    </span>
                    <span className="link-previous-item-meta">{board.cardCount || 0} cards</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary-btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn primary-btn" onClick={handleLink} disabled={submitting}>
            <Link2 size={16} aria-hidden="true" /> Link board
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkPreviousBoardModal;
