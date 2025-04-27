import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Column from './Column';
import { generateId } from '../utils/helpers';
import ExportBoardModal from './modals/ExportBoardModal';
import NewBoardTemplateModal from './modals/NewBoardTemplateModal';
// Import Feather icons
import { Link, ArrowDown, ChevronDown, PlusCircle, Plus, ThumbsUp, BarChart2, FileText, PlusSquare } from 'react-feather';

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
        <Link size={16} />
        Share Board
      </button>
    </div>
  </div>
);

// UI Component for the action buttons in the header
const ActionButtons = ({ handleCreateNewBoard, sortByVotes, setSortByVotes, sortDropdownOpen, setSortDropdownOpen, handleExportBoard }) => {
  // Handle clicking outside the dropdown
  const dropdownRef = React.useRef(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setSortDropdownOpen]);
  
  return (
    <div className="action-buttons">
      <button 
        id="create-board" 
        className="btn" 
        onClick={handleCreateNewBoard}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <PlusSquare size={16} />
        New Board
      </button>
      <button 
        id="export-board" 
        className="btn secondary-btn" 
        onClick={handleExportBoard}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <FileText size={16} />
        Export Board
      </button>
      
      <div className="sort-dropdown-container" ref={dropdownRef}>
        <button 
          id="sort-dropdown-button" 
          className="btn sort-dropdown-button" 
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          aria-expanded={sortDropdownOpen}
          aria-haspopup="true"
        >
          <BarChart2 size={16} />
          Sort
          <ChevronDown 
            size={12} 
            className={sortDropdownOpen ? 'dropdown-arrow rotated' : 'dropdown-arrow'} 
          />
        </button>
        
        {sortDropdownOpen && (
          <div className="sort-dropdown-menu">
            <button 
              className={`sort-option ${!sortByVotes ? 'selected' : ''}`} 
              onClick={() => { setSortByVotes(false); setSortDropdownOpen(false); }}
            >
              <ArrowDown size={14} />
              Chronological
              {!sortByVotes && <span className="checkmark">✓</span>}
            </button>
            <button 
              className={`sort-option ${sortByVotes ? 'selected' : ''}`} 
              onClick={() => { setSortByVotes(true); setSortDropdownOpen(false); }}
            >
              <ThumbsUp size={14} />
              By Votes
              {sortByVotes && <span className="checkmark">✓</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// UI Component for the columns container including the add column button
const ColumnsContainer = ({ columns, sortByVotes, showNotification, addNewColumn }) => {
  // Function to sort columns in the correct workflow order
  const getSortedColumns = () => {
    const entries = Object.entries(columns || {});
    
    // Sort columns by title to ensure workflow order
    return entries.sort((a, b) => {
      // Define the order of standard column titles for various templates
      const columnOrder = {
        // Default template
        'To Do': 1,
        'In Progress': 2,
        'Done': 3,
        
        // Lean Coffee template
        'Topics': 1,
        'Discussing': 2,
        // 'Done': 3, (Already included)
        
        // Retrospective template
        'Went Well': 1,
        'Could Improve': 2,
        'Action Items': 3,
        
        // Feelings / Improvements template
        'Feelings': 1,
        'Improvements': 2,
        
        // DAKI template
        'Drop': 1,
        'Add': 2,
        'Keep': 3,
        'Improve': 4,
        
        // Glad Sad Mad template
        'Glad': 1,
        'Sad': 2,
        'Mad': 3,
        
        // Start Stop Continue template
        'Start': 1,
        'Stop': 2,
        'Continue': 3,
        
        // 4 Ls template
        'Liked': 1,
        'Learned': 2,
        'Lacked': 3,
        'Longed For': 4,
        
        // SWOT template
        'Strengths': 1,
        'Weaknesses': 2,
        'Opportunities': 3,
        'Threats': 4,
        
        // Six Thinking Hats
        'Facts': 1,
        'Emotions': 2,
        'Critical': 3,
        'Optimistic': 4,
        'Creative': 5,
        'Process': 6,
        
        // MoSCoW
        'Must Have': 1,
        'Should Have': 2,
        'Could Have': 3,
        'Won\'t Have': 4,
        
        // Five Whys
        'Problem': 1,
        'Why 1': 2,
        'Why 2': 3,
        'Why 3': 4,
        'Why 4': 5,
        'Why 5': 6,
        'Root Cause': 7,
        
        // Eisenhower
        'Urgent & Important': 1,
        'Important & Not Urgent': 2,
        'Urgent & Not Important': 3,
        'Neither': 4,
        
        // Sailboat
        'Wind (Helps)': 1,
        'Anchors (Hinders)': 2,
        'Rocks (Risks)': 3,
        'Island (Goals)': 4,
        
        // Fishbone
        'People': 1,
        'Process': 2,
        'Equipment': 3,
        'Materials': 4,
        'Environment': 5,
        'Management': 6,
        
        // Feedback Grid
        'What Went Well': 1,
        'What Could Be Improved': 2,
        'Questions': 3,
        'Ideas': 4,
        
        // Starfish
        'Keep Doing': 1,
        'Less Of': 2,
        'More Of': 3,
        'Start Doing': 4,
        'Stop Doing': 5,
        
        // KPT
        'Keep': 1,
        'Problem': 2,
        'Try': 3,
        
        // Pros & Cons
        'Pros': 1,
        'Cons': 2,
        'Decisions': 3
      };
      
      // Get the order for each column, defaulting to a high number for custom columns
      const orderA = columnOrder[a[1].title] || 100;
      const orderB = columnOrder[b[1].title] || 100;
      
      // Sort by the defined order
      return orderA - orderB;
    });
  };

  return (
    <div className="board-container">
      <div id="board" className="board">
        {/* Render columns in sorted order */}
        {getSortedColumns().map(([columnId, columnData]) => (
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
            <Plus size={16} />
            Add Column
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Board component responsible for rendering and managing the kanban board
 */
function Board({ showNotification }) {
  // State for modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
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
  
  // State for dropdown menu
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
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
      // Show template selection instead of immediately creating a board
      setIsTemplateModalOpen(true);
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
  
  // Show template modal for creating a new board
  const handleCreateNewBoard = () => {
    setIsTemplateModalOpen(true);
  };
  
  // Create a new board with the selected template
  const handleTemplateSelected = (templateColumns, templateName = null) => {
    // Create a title based on the template
    const boardTitle = templateName ? `${templateName} Board` : 'Untitled Board';
    
    const newBoardId = createNewBoard(templateColumns, boardTitle);
    
    // Only update URL and show notification if we got a valid board ID
    if (newBoardId) {
      window.history.pushState({}, '', `?board=${newBoardId}`);
      showNotification('New board created');
      setIsTemplateModalOpen(false);
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
  
  // We no longer need toggleSortByVotes since we directly set the sort type from dropdown
  
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
            sortByVotes={sortByVotes}
            setSortByVotes={setSortByVotes}
            sortDropdownOpen={sortDropdownOpen}
            setSortDropdownOpen={setSortDropdownOpen}
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
      
      {/* Template Selection Modal */}
      <NewBoardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          // If the user already has a board open, just close the modal
          // Otherwise (app just loaded without a board), create a default board
          if (boardId) {
            setIsTemplateModalOpen(false);
          } else if (user) {
            handleTemplateSelected(['To Do', 'In Progress', 'Done'], 'Default');
          }
        }}
        onSelectTemplate={handleTemplateSelected}
      />
    </>
  );
}

export default Board;
