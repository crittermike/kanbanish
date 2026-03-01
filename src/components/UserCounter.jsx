import { useState, useRef, useEffect } from 'react';
import { Users } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { getInitials } from '../utils/avatarColors';
/**
 * UserCounter component displays the number of active users viewing the board
 */
function UserCounter() {
  const { activeUsers, boardId, presenceData } = useBoardContext();
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    }
    
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  // Don't show if no board is loaded
  if (!boardId) {
    return null;
  }

  const usersList = Object.values(presenceData || {});

  return (
    <div 
      className="user-counter" 
      ref={containerRef}
      onClick={() => setShowPopover(!showPopover)}
      title={`${activeUsers} ${activeUsers === 1 ? 'user' : 'users'} viewing this board`}
      style={{ cursor: 'pointer' }}
    >
      <Users size={16} />
      <span className="user-count">{activeUsers}</span>
      
      {showPopover && usersList.length > 0 && (
        <div className="user-counter-popover" onClick={e => e.stopPropagation()}>
          <ul className="user-counter-list">
            {usersList.map((user) => {
              const displayName = user.displayName || 'Anonymous';
              const color = user.color || 'var(--text-muted)';
              const initials = getInitials(displayName);
              
              return (
                <li key={user.uid} className="user-counter-item">
                  <div className="user-counter-avatar" style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                  <span className="user-counter-name">{displayName}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserCounter;
