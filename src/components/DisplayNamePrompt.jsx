import { useCallback, useEffect, useState } from 'react';
import { useBoardContext } from '../context/BoardContext';
import { AVATAR_COLORS, generateRandomName, getInitials, getRandomColor } from '../utils/avatarColors';

/**
 * Lightweight modal prompt for picking a display name and color when first joining a board.
 * Shows automatically when user has no displayName set.
 */
const DisplayNamePrompt = () => {
  const { displayName, updateDisplayName, updateUserColor, boardId } = useBoardContext();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  // Show prompt when user joins a board without a display name
  useEffect(() => {
    if (boardId && !displayName) {
      const suggested = generateRandomName();
      const suggestedColor = getRandomColor();
      setName(suggested);
      setColor(suggestedColor);
      setIsOpen(true);
    }
  }, [boardId, displayName]);

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      updateDisplayName(trimmed);
      updateUserColor(color);
      setIsOpen(false);
    }
  }, [name, color, updateDisplayName, updateUserColor]);

  const handleRandomize = useCallback(() => {
    setName(generateRandomName());
    setColor(getRandomColor());
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target.classList.contains('modal-overlay')) {
      // Allow dismissing — use current values
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleSubmit();
    }
  }, [handleSubmit, name]);

  if (!isOpen) return null;

  const initials = getInitials(name);

  return (
    <div className="modal-overlay" role="presentation" onClick={handleOverlayClick}>
      <div className="modal-container display-name-modal" role="dialog" aria-modal="true" aria-labelledby="display-name-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="display-name-title">Welcome!</h2>
          <button className="close-button" onClick={handleSubmit} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <p className="display-name-subtitle">Pick a name so others can identify you on this board.</p>

          <div className="display-name-preview">
            <div className="avatar-circle" style={{ backgroundColor: color }}>
              {initials}
            </div>
            <span className="display-name-preview-text">{name || 'Anonymous'}</span>
          </div>

          <div className="display-name-input-row">
            <input
              type="text"
              className="display-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              maxLength={30}
              autoFocus
              aria-label="Display name"
            />
            <button className="display-name-randomize-btn" onClick={handleRandomize} title="Generate random name" aria-label="Generate random name">
              🎲
            </button>
          </div>

          <div className="display-name-color-picker">
            <span className="display-name-color-label">Pick a color</span>
            <div className="display-name-color-options">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  className={`display-name-color-swatch ${c === color ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  aria-pressed={c === color}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary-button" onClick={handleSubmit} disabled={!name.trim()}>
            Join Board
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisplayNamePrompt;
