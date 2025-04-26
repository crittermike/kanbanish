import React, { useState } from 'react';
import { useBoardContext } from '../../context/BoardContext';

function OpenBoardModal() {
  const [boardIdInput, setBoardIdInput] = useState('');
  const { openExistingBoard } = useBoardContext();
  
  // Handle input change
  const handleBoardIdInputChange = (e) => {
    setBoardIdInput(e.target.value);
  };
  
  // Handle open board
  const handleOpenBoard = () => {
    if (boardIdInput.trim()) {
      openExistingBoard(boardIdInput.trim());
      closeModal();
      window.history.pushState({}, '', `?board=${boardIdInput.trim()}`);
    }
  };
  
  // Close the modal
  const closeModal = () => {
    document.getElementById('open-board-modal').style.display = 'none';
    setBoardIdInput('');
  };
  
  // Handle key press (open board on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleOpenBoard();
    }
  };
  
  return (
    <div id="open-board-modal" className="modal">
      <div className="modal-content">
        <span className="close-modal" onClick={closeModal}>&times;</span>
        <h2>Open Board</h2>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="board-id-input">Enter Board ID:</label>
            <input 
              type="text" 
              id="board-id-input" 
              placeholder="Enter the board ID here" 
              value={boardIdInput}
              onChange={handleBoardIdInputChange}
              onKeyPress={handleKeyPress}
              autoComplete="off"
            />
          </div>
          <button id="open-board-submit" className="btn primary-btn" onClick={handleOpenBoard}>Open</button>
        </div>
      </div>
    </div>
  );
}

export default OpenBoardModal;
