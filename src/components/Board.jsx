import React, { useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Column from './Column';
import { generateId } from '../utils/helpers';

// UI Component for the board header with title input and ID display
const BoardHeader = ({ boardId, boardTitle, handleBoardTitleChange, copyBoardId }) => (
  <div className="board-title-container">
    <input 
      type="text" 
      id="board-title" 
      placeholder="Untitled Board" 
      value={boardTitle} 
      onChange={handleBoardTitleChange}
      className="header-input" 
    />
    <div className="board-id-container">
      <span>Board ID: </span>
      <code id="board-id">{boardId || '...'}</code>
      <button id="copy-id" className="icon-button" title="Copy Board ID" onClick={copyBoardId}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
      </button>
    </div>
  </div>
);

// UI Component for the action buttons in the header
const ActionButtons = ({ handleCreateNewBoard, handleOpenBoardClick, toggleSortByVotes, sortByVotes }) => (
  <div className="action-buttons">
    <button id="create-board" className="btn" onClick={handleCreateNewBoard}>New Board</button>
    <button id="open-board" className="btn" onClick={handleOpenBoardClick}>Open Board</button>
    <button id="sort-by-votes" className={`sort-button ${sortByVotes ? 'active' : ''}`} onClick={toggleSortByVotes}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
      </svg>
      Sort by Votes
    </button>
  </div>
);

// UI Component for the columns container including the add column button
const ColumnsContainer = ({ columns, sortByVotes, showNotification, addNewColumn }) => (
  <div className="board-container">
    <div id="board" className="board">
      {/* Render columns */}
      {Object.entries(columns || {}).map(([columnId, columnData]) => (
        <Column 
          key={columnId} 
          columnId={columnId} 
          columnData={columnData} 
          sortByVotes={sortByVotes}
          showNotification={showNotification}
        />
      ))}
      
      {/* Add column button */}
      <div className="add-column-container">
        <button id="add-column" className="add-column" onClick={addNewColumn}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Column
        </button>
      </div>
    </div>
  </div>
);

/**
 * Main Board component responsible for rendering and managing the kanban board
 */
function Board({ showNotification }) {
  // Get context values from BoardContext
  const { 
    boardId, 
    boardRef, 
    boardTitle, 
    setBoardTitle, 
    columns,
    sortByVotes,
    setSortByVotes,
    createNewBoard,
    openExistingBoard
  } = useBoardContext();
  
  /**
   * BOARD INITIALIZATION
   */
  
  // Check for board ID in URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardIdFromUrl = urlParams.get('board');
    
    if (boardIdFromUrl) {
      openExistingBoard(boardIdFromUrl);
    } else {
      handleCreateNewBoard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Update document title when board title changes
  useEffect(() => {
    document.title = boardTitle ? `${boardTitle} - Kanbanish` : 'Kanbanish';
  }, [boardTitle]);
  
  /**
   * BOARD MANAGEMENT HANDLERS
   */
  
  // Handle board title change
  const handleBoardTitleChange = (e) => {
    const newTitle = e.target.value;
    setBoardTitle(newTitle);
    
    if (boardId) {
      // Create a direct reference to the title path
      const titleRef = ref(database, `boards/${boardId}/title`);
      
      set(titleRef, newTitle)
        .then(() => {
          console.log('Board title updated');
        })
        .catch((error) => {
          console.error('Error updating board title:', error);
        });
    }
  };
  
  // Handle creating a new board
  const handleCreateNewBoard = () => {
    const newBoardId = createNewBoard();
    window.history.pushState({}, '', `?board=${newBoardId}`);
    showNotification('New board created');
  };
  
  // Handle opening the open board modal
  const handleOpenBoardClick = () => {
    document.getElementById('open-board-modal').style.display = 'flex';
  };
  
  /**
   * COLUMN MANAGEMENT
   */
  
  // Add a new column
  const addNewColumn = () => {
    if (!boardRef || !boardId) return;
    
    const columnId = generateId();
    const columnData = {
      title: 'New Column',
      cards: {}
    };
    
    // Create a direct reference to the column path
    const columnRef = ref(database, `boards/${boardId}/columns/${columnId}`);
    
    set(columnRef, columnData)
      .then(() => {
        showNotification('Column added');
      })
      .catch((error) => {
        console.error('Error adding column:', error);
      });
  };
  
  /**
   * UTILITY FUNCTIONS
   */
  
  // Toggle sort by votes
  const toggleSortByVotes = () => {
    setSortByVotes(!sortByVotes);
  };
  
  // Copy board ID to clipboard
  const copyBoardId = () => {
    if (boardId) {
      navigator.clipboard.writeText(boardId)
        .then(() => {
          showNotification('Board ID copied to clipboard');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  };
  
  return (
    <>
      <header>
        <div className="header-content">
          <BoardHeader 
            boardId={boardId} 
            boardTitle={boardTitle} 
            handleBoardTitleChange={handleBoardTitleChange} 
            copyBoardId={copyBoardId}
          />
          <ActionButtons 
            handleCreateNewBoard={handleCreateNewBoard} 
            handleOpenBoardClick={handleOpenBoardClick}
            toggleSortByVotes={toggleSortByVotes}
            sortByVotes={sortByVotes}
          />
        </div>
      </header>

      <main>
        <ColumnsContainer 
          columns={columns}
          sortByVotes={sortByVotes}
          showNotification={showNotification}
          addNewColumn={addNewColumn}
        />
      </main>
    </>
  );
}

export default Board;
