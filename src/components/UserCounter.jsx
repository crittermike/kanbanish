import React from 'react';
import { Users } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';

/**
 * UserCounter component displays the number of active users viewing the board
 */
function UserCounter() {
  const { activeUsers, boardId } = useBoardContext();

  // Don't show if no board is loaded
  if (!boardId) {
    return null;
  }

  return (
    <div className="user-counter" title={`${activeUsers} ${activeUsers === 1 ? 'user' : 'users'} viewing this board`}>
      <Users size={16} />
      <span className="user-count">{activeUsers}</span>
    </div>
  );
}

export default UserCounter;
