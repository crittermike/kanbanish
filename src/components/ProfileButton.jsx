import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'react-feather';
import { AVATAR_COLORS, generateRandomName, getInitials } from '../utils/avatarColors';

/**
 * Header button that opens a popover for editing display name and color.
 * Only visible when showDisplayNames is enabled on the board.
 */
const ProfileButton = ({
  showDisplayNames,
  displayName,
  userColor,
  updateDisplayName,
  updateUserColor
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localName, setLocalName] = useState(displayName || '');
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setLocalName(displayName || '');
  }, [displayName]);

  const handleNameBlur = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== displayName) {
      updateDisplayName(trimmed);
    } else if (!trimmed) {
      setLocalName(displayName || '');
    }
  };

  const handleRandomize = () => {
    const newName = generateRandomName();
    setLocalName(newName);
    updateDisplayName(newName);
  };

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!showDisplayNames) return null;

  return (
    <div className="profile-button-wrapper">
      <button
        ref={buttonRef}
        className="btn icon-btn profile-toggle-btn"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Edit your profile"
        aria-label="Edit your profile"
      >
        <User size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div ref={popoverRef} className="profile-popover" role="dialog" aria-label="Edit profile">
          <div className="profile-popover-header">
            <span className="profile-popover-title">Your Profile</span>
          </div>
          <div className="profile-popover-body">
            <div className="profile-popover-preview">
              <div className="avatar-circle profile-popover-avatar" style={{ backgroundColor: userColor || 'var(--accent)' }}>
                {getInitials(localName || displayName || 'A')}
              </div>
            </div>
            <div className="profile-popover-name-row">
              <input
                type="text"
                className="profile-popover-input"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                placeholder="Enter display name"
                maxLength={30}
                aria-label="Display name"
              />
              <button
                className="display-name-randomize-btn"
                onClick={handleRandomize}
                title="Randomize name"
                aria-label="Randomize name"
              >
                🎲
              </button>
            </div>
            <div className="profile-popover-colors">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  className={`display-name-color-swatch ${userColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => updateUserColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;
