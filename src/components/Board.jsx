import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { useBoardContext } from '../context/BoardContext';
import { database } from '../utils/firebase';
import Column from './Column';
import { generateId } from '../utils/helpers';
import ExportBoardModal from './modals/ExportBoardModal';
import NewBoardTemplateModal from './modals/NewBoardTemplateModal';
// Import Feather icons
import { Link, ArrowDown, ChevronDown, PlusCircle, Plus, ThumbsUp, BarChart2, FileText, PlusSquare, Settings, Pause, Play } from 'react-feather';

// UI Component for the board header with title input and share button
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleExportBoard, copyShareUrl, boardFrozen, toggleBoardFrozen }) => (
  <div className="board-title-container">
    <input
      type="text"
      id="board-title"
      placeholder="Untitled Board"
      value={boardTitle}
      onChange={handleBoardTitleChange}
      className="header-input"
    />
    <div className="action-buttons">
      <button
        id="freeze-board"
        className="btn secondary-btn"
        title={boardFrozen ? "Unfreeze board" : "Freeze board"}
        onClick={toggleBoardFrozen}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
      >
        {boardFrozen ? <Play size={16} /> : <Pause size={16} />}
        {boardFrozen ? 'Unfreeze' : 'Freeze'}
      </button>
      <button
        id="copy-share-url"
        className="btn secondary-btn"
        title="Copy Share URL"
        onClick={copyShareUrl}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
      >
        <Link size={16} />
        Share
      </button>
      <button
        id="export-board"
        className="btn secondary-btn"
        onClick={handleExportBoard}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
      >
        <FileText size={16} />
        Export
      </button>
    </div>

  </div>
);

// UI Component for the action buttons in the header
const ActionButtons = ({ handleCreateNewBoard, sortByVotes, setSortByVotes, votingEnabled, updateVotingEnabled, downvotingEnabled, updateDownvotingEnabled, multipleVotesAllowed, updateMultipleVotesAllowed, sortDropdownOpen, setSortDropdownOpen, resetAllVotes, showNotification }) => {
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
      <div className="sort-dropdown-container" ref={dropdownRef}>
        <button
          id="settings-dropdown-button"
          className="btn sort-dropdown-button"
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          aria-expanded={sortDropdownOpen}
          aria-haspopup="true"
          title="Board settings and preferences"
        >
          <Settings size={16} />
          Settings
          <ChevronDown
            size={12}
            className={sortDropdownOpen ? 'dropdown-arrow rotated' : 'dropdown-arrow'}
          />
        </button>

        {sortDropdownOpen && (
          <div className="sort-dropdown-menu">
            <div className="settings-section">
              <h4 className="settings-section-title">Sort Cards</h4>
              <button
                className={`sort-option ${!sortByVotes ? 'selected' : ''}`}
                onClick={() => { setSortByVotes(false); }}
              >
                <ArrowDown size={14} />
                Chronological
                {!sortByVotes && <span className="checkmark">✓</span>}
              </button>
              <button
                className={`sort-option ${sortByVotes ? 'selected' : ''}`}
                onClick={() => { setSortByVotes(true); }}
              >
                <ThumbsUp size={14} />
                By Votes
                {sortByVotes && <span className="checkmark">✓</span>}
              </button>
            </div>
            <div className="settings-divider"></div>
            <div className="settings-section">
              <h4 className="settings-section-title">Allow voting?</h4>
              <div className="settings-boolean-option">
                <button
                  className={`boolean-option ${votingEnabled ? 'selected' : ''}`}
                  onClick={() => { updateVotingEnabled(true); }}
                >
                  Yes
                </button>
                <button
                  className={`boolean-option ${!votingEnabled ? 'selected' : ''}`}
                  onClick={() => { updateVotingEnabled(false); }}
                >
                  No
                </button>
              </div>
            </div>
            {votingEnabled && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Allow downvoting?</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${downvotingEnabled ? 'selected' : ''}`}
                      onClick={() => { updateDownvotingEnabled(true); }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!downvotingEnabled ? 'selected' : ''}`}
                      onClick={() => { updateDownvotingEnabled(false); }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Allow users to vote multiple times on the same card?</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${multipleVotesAllowed ? 'selected' : ''}`}
                      onClick={() => { updateMultipleVotesAllowed(true); }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!multipleVotesAllowed ? 'selected' : ''}`}
                      onClick={() => { updateMultipleVotesAllowed(false); }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section" style={{ padding: '0 var(--space-sm)' }}>
                  <button
                    className="btn danger-btn"
                    style={{ width: '100%', margin: 'var(--space-xs) 0' }}
                    onClick={() => {
                      if (resetAllVotes()) {
                        showNotification('All votes reset to zero');
                        // Keep dropdown open after resetting votes
                      }
                    }}
                  >
                    Reset all votes
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// UI Component for the columns container including the add column button
const ColumnsContainer = ({ columns, sortByVotes, showNotification, addNewColumn }) => {
  // Get columns sorted by their IDs to maintain consistent order
  const getSortedColumns = () => {
    // The column IDs are prefixed with alphabet characters (a_, b_, etc.)
    // to ensure they maintain their original order regardless of title changes
    return Object.entries(columns || {}).sort((a, b) => {
      return a[0].localeCompare(b[0]); // Sort by column ID
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
    votingEnabled,
    updateVotingEnabled,
    downvotingEnabled,
    updateDownvotingEnabled,
    multipleVotesAllowed,
    updateMultipleVotesAllowed,
    boardFrozen,
    updateBoardFrozen,
    createNewBoard,
    openExistingBoard,
    resetAllVotes,
    user // Include user from context
  } = useBoardContext();

  // State for settings dropdown menu
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

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

  // Toggle board frozen state
  const toggleBoardFrozen = () => {
    const newFrozenState = !boardFrozen;
    updateBoardFrozen(newFrozenState);
    showNotification(newFrozenState ? 'Board frozen' : 'Board unfrozen');
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
            handleExportBoard={handleExportBoard}
            boardFrozen={boardFrozen}
            toggleBoardFrozen={toggleBoardFrozen}
          />
          <ActionButtons
            handleCreateNewBoard={handleCreateNewBoard}
            sortByVotes={sortByVotes}
            setSortByVotes={setSortByVotes}
            votingEnabled={votingEnabled}
            updateVotingEnabled={updateVotingEnabled}
            downvotingEnabled={downvotingEnabled}
            updateDownvotingEnabled={updateDownvotingEnabled}
            multipleVotesAllowed={multipleVotesAllowed}
            updateMultipleVotesAllowed={updateMultipleVotesAllowed}
            sortDropdownOpen={settingsDropdownOpen}
            setSortDropdownOpen={setSettingsDropdownOpen}
            resetAllVotes={resetAllVotes}
            showNotification={showNotification}
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
