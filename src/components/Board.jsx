import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Column from './Column';
import { generateId } from '../utils/helpers';
import ExportBoardModal from './modals/ExportBoardModal';

// UI Component for the board header with title input and share button
const BoardHeader = ({ boardTitle, handleBoardTitleChange, copyShareUrl }) => (
  <div className="board-title-container">
    <input 
      type="text" 
      id="board-title" 
      placeholder="Untitled Board" 
      value={boardTitle} 
      onChange={handleBoardTitleChange}
      className="header-input" 
    />
    <div className="share-container">
      <button 
        id="copy-share-url" 
        className="btn secondary-btn" 
        title="Copy Share URL" 
        onClick={copyShareUrl}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
          <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"/>
        </svg>
        Share Board
      </button>
    </div>
  </div>
);

// UI Component for the action buttons in the header
const ActionButtons = ({ handleCreateNewBoard, toggleSortByVotes, sortByVotes, handleExportBoard }) => (
  <div className="action-buttons">
    <button id="create-board" className="btn" onClick={handleCreateNewBoard}>New Board</button>
    <button id="export-board" className="btn secondary-btn" onClick={handleExportBoard}>Export Board</button>
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
  // State for export modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
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
    openExistingBoard,
    user // Include user from context
  } = useBoardContext();
  
  /**
   * BOARD INITIALIZATION
   */
  
  // Check for board ID in URL on load and handle board initialization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardIdFromUrl = urlParams.get('board');
    
    if (boardIdFromUrl) {
      openExistingBoard(boardIdFromUrl);
    } else if (user) {
      // Only create a new board if user is already authenticated
      handleCreateNewBoard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depend on user so this effect reruns when user authentication completes
  
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
    
    // Only update URL and show notification if we got a valid board ID
    if (newBoardId) {
      window.history.pushState({}, '', `?board=${newBoardId}`);
      showNotification('New board created');
    } else {
      console.error('Failed to create new board - user may not be authenticated yet');
    }
  };
  
  // This function was removed as part of removing the "Open Board" functionality
  
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
  
  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (boardId) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?board=${boardId}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          showNotification('Share URL copied to clipboard');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  };
  
  // Handle export board button click
  const handleExportBoard = () => {
    setIsExportModalOpen(true);
    showNotification('Preparing board export...');
  };
  
  return (
    <>
      <header>
        <div className="header-content">
          <BoardHeader 
            boardTitle={boardTitle} 
            handleBoardTitleChange={handleBoardTitleChange} 
            copyShareUrl={copyShareUrl}
          />
          <ActionButtons 
            handleCreateNewBoard={handleCreateNewBoard}
            toggleSortByVotes={toggleSortByVotes}
            sortByVotes={sortByVotes}
            handleExportBoard={handleExportBoard}
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
      
      {/* Export Board Modal */}
      <ExportBoardModal 
        isOpen={isExportModalOpen} 
        onClose={() => {
          setIsExportModalOpen(false);
        }}
        showNotification={showNotification}
      />
    </>
  );
}

export default Board;
