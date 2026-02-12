import React, { useState, useEffect } from 'react';
import { Link, ArrowDown, ChevronDown, Plus, ThumbsUp, FileText, PlusSquare, Settings, Sun, Moon, Heart } from 'react-feather';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import { addColumn } from '../utils/boardUtils';
import { parseUrlSettings } from '../utils/helpers';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import CardCreationIndicator from './CardCreationIndicator';
import Column from './Column';
import ExportBoardModal from './modals/ExportBoardModal';
import NewBoardTemplateModal, { BOARD_TEMPLATES } from './modals/NewBoardTemplateModal';
import PollResults from './PollResults';
import PollVoting from './PollVoting';
import ResultsView from './ResultsView';
import HealthCheckVoting from './HealthCheckVoting';
import HealthCheckResults from './HealthCheckResults';
import TotalVoteCounter from './TotalVoteCounter';
import UserCounter from './UserCounter';
import VoteCounter from './VoteCounter';
import WorkflowControls from './WorkflowControls';
// Import Feather icons

// UI Component for the board header with title input and share button
const BoardHeader = ({ boardTitle, handleBoardTitleChange, handleBoardTitleBlur, copyShareUrl, handleExportBoard }) => (
  <div className="board-title-container">
    <input
      type="text"
      id="board-title"
      placeholder={DEFAULT_BOARD_TITLE}
      value={boardTitle}
      onChange={handleBoardTitleChange}
      onBlur={handleBoardTitleBlur}
      className="header-input"
    />
    <div className="action-buttons">
      <UserCounter />
      <VoteCounter />
      <TotalVoteCounter />
      <button
        id="copy-share-url"
        className="btn secondary-btn btn-with-icon"
        title="Copy Share URL"
        onClick={copyShareUrl}
      >
        <Link size={16} />
        Share
      </button>
      <button
        id="export-board"
        className="btn secondary-btn btn-with-icon"
        onClick={handleExportBoard}
      >
        <FileText size={16} />
        Export
      </button>
    </div>

  </div>
);

// UI Component for the action buttons in the header
const ActionButtons = ({
  handleCreateNewBoard,
  handleStartHealthCheck,
  sortByVotes,
  setSortByVotes,
  votingEnabled,
  updateVotingEnabled,
  downvotingEnabled,
  updateDownvotingEnabled,
  multipleVotesAllowed,
  updateMultipleVotesAllowed,
  retrospectiveMode,
  updateRetrospectiveMode,
  sortDropdownOpen,
  setSortDropdownOpen,
  resetAllVotes,
  showNotification,
  darkMode,
  updateDarkMode
}) => {
  // Handle clicking outside the dropdown
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = event => {
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
        className="btn btn-with-icon"
        onClick={handleCreateNewBoard}
      >
        <PlusSquare size={16} />
        New Board
      </button>
      <button
        id="start-health-check"
        className="btn btn-with-icon"
        onClick={handleStartHealthCheck}
      >
        <Heart size={16} />
        Health Check
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
                onClick={() => {
                  setSortByVotes(false);
                }}
              >
                <ArrowDown size={14} />
                Chronological
                {!sortByVotes && <span className="checkmark">✓</span>}
              </button>
              <button
                className={`sort-option ${sortByVotes ? 'selected' : ''}`}
                onClick={() => {
                  setSortByVotes(true);
                }}
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
                  onClick={() => {
                    updateVotingEnabled(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className={`boolean-option ${!votingEnabled ? 'selected' : ''}`}
                  onClick={() => {
                    updateVotingEnabled(false);
                  }}
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
                      onClick={() => {
                        updateDownvotingEnabled(true);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!downvotingEnabled ? 'selected' : ''}`}
                      onClick={() => {
                        updateDownvotingEnabled(false);
                      }}
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
                      onClick={() => {
                        updateMultipleVotesAllowed(true);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!multipleVotesAllowed ? 'selected' : ''}`}
                      onClick={() => {
                        updateMultipleVotesAllowed(false);
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Retrospective Mode</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${retrospectiveMode ? 'selected' : ''}`}
                      onClick={() => {
                        updateRetrospectiveMode(true);
                      }}
                    >
                      On
                    </button>
                    <button
                      className={`boolean-option ${!retrospectiveMode ? 'selected' : ''}`}
                      onClick={() => {
                        updateRetrospectiveMode(false);
                      }}
                    >
                      Off
                    </button>
                  </div>
                  <p className="settings-hint">
                    When enabled, new cards appear with hidden text until revealed
                  </p>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section settings-section-padded">
                  <button
                    className="btn danger-btn settings-full-width-btn"
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
      <button
        id="theme-toggle"
        className="btn icon-btn"
        onClick={() => {
          updateDarkMode(!darkMode);
        }}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
};

// UI Component for the columns container including the add column button
const ColumnsContainer = ({ columns, sortByVotes, showNotification, addNewColumn }) => {
  const { retrospectiveMode, workflowPhase } = useBoardContext();

  // Get columns sorted by their IDs to maintain consistent order
  const getSortedColumns = () => {
    // The column IDs are prefixed with alphabet characters (a_, b_, etc.)
    // to ensure they maintain their original order regardless of title changes
    return Object.entries(columns || {}).sort((a, b) => {
      return a[0].localeCompare(b[0]); // Sort by column ID
    });
  };

  // Hide add column button during reveal phases when board structure should be stable
  const shouldShowAddColumn = !retrospectiveMode || workflowPhase === WORKFLOW_PHASES.CREATION;

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

        {/* Add column button - hidden during interaction/results phases */}
        {shouldShowAddColumn && (
          <div className="add-column-container">
            <button id="add-column" className="add-column" onClick={addNewColumn}>
              <Plus size={16} />
              Add Column
            </button>
          </div>
        )}
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
    retrospectiveMode,
    updateRetrospectiveMode,
    createNewBoard,
    openExistingBoard,
    resetAllVotes,
    updateBoardTitle,
    user, // Include user from context
    darkMode,
    updateDarkMode,
    workflowPhase, // Add workflow phase
    getAllUsersAddingCards,
    startHealthCheckPhase
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
  // Parse URL settings and apply theme preference immediately (persisted in user prefs)
  const parsed = parseUrlSettings(window.location.search);
  if (parsed.uiPrefs && parsed.uiPrefs.darkMode !== undefined) {
    updateDarkMode(parsed.uiPrefs.darkMode);
  }

  if (boardIdFromUrl) {
      openExistingBoard(boardIdFromUrl);
    } else if (user) {
      // If a template is provided via URL, create board immediately
      const templateId = urlParams.get('template');
      if (templateId) {
        const template = BOARD_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          const newBoardId = createNewBoard(template.columns, `${template.name} Board`, parsed.boardSettings);
          if (newBoardId) {
            // Clean up URL and add board id
            cleanUpUrlAfterCreation(newBoardId);
            // Do not open template modal
          } else {
            setIsTemplateModalOpen(true);
          }
        } else {
          // Unknown template id, show template selector
          setIsTemplateModalOpen(true);
        }
      } else {
        // Show template selection instead of immediately creating a board
        setIsTemplateModalOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depend on user so this effect reruns when user authentication completes

  // Update document title when board title changes
  useEffect(() => {
    // Don't set document.title to "Untitled Board" for SEO purposes
    // Keep the default HTML title instead when board is untitled
    document.title = boardTitle && boardTitle !== DEFAULT_BOARD_TITLE ? `${boardTitle} - Kanbanish` : 'Kanbanish | Real-time anonymous kanban board';
  }, [boardTitle]);

  /**
   * BOARD MANAGEMENT HANDLERS
   */

  // Handle board title change (update local state only)
  const handleBoardTitleChange = e => {
    const newTitle = e.target.value;
    setBoardTitle(newTitle);
  };

  // Handle board title blur (update Firebase)
  const handleBoardTitleBlur = () => {
    updateBoardTitle(boardTitle);
  };

  // Show template modal for creating a new board
  const handleCreateNewBoard = () => {
    setIsTemplateModalOpen(true);
  };

  // Create a new board with the selected template
  const handleTemplateSelected = (templateColumns, templateName = null) => {
    // Create a title based on the template
    const boardTitle = templateName ? `${templateName} Board` : DEFAULT_BOARD_TITLE;

    // Pass URL-derived board settings so they persist on new board
  const parsed = parseUrlSettings(window.location.search);
  // sortByVotes (from URL sort=) lives in boardSettings now and will be persisted on creation
  const newBoardId = createNewBoard(templateColumns, boardTitle, parsed.boardSettings);

    // Only update URL and show notification if we got a valid board ID
    if (newBoardId) {
      // Build a clean URL: preserve non-setting params, add board=id, drop applied settings
      cleanUpUrlAfterCreation(newBoardId);
      showNotification('New board created');
      setIsTemplateModalOpen(false);
    } else {
      // Silent fallback when user authentication is not ready
    }
  };

  // This function was removed as part of removing the "Open Board" functionality

  /**
   * COLUMN MANAGEMENT
   */

  // Add a new column
  const addNewColumn = () => {
    if (!boardRef || !boardId) {
      return;
    }

    addColumn(boardId)
      .then(() => {
        showNotification('Column added');
      })
      .catch(() => {
        // Error adding column - notification system will handle user feedback
      });
  };

  /**
   * UTILITY FUNCTIONS
   */

  // We no longer need toggleSortByVotes since we directly set the sort type from dropdown

  // Clean up URL params after board creation and set board id
  const cleanUpUrlAfterCreation = (newBoardId) => {
    try {
      const removeKeys = ['voting', 'downvotes', 'multivote', 'votes', 'retro', 'sort', 'theme', 'template'];
      const currentUrl = new URL(window.location.href);
      const qs = currentUrl.searchParams;
      removeKeys.forEach(k => qs.delete(k));
      if (newBoardId) qs.set('board', newBoardId);
      currentUrl.search = qs.toString();
      window.history.pushState({}, '', currentUrl.toString());
    } catch {
      // no-op if URL manipulation fails
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (boardId) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?board=${boardId}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          showNotification('Share URL copied to clipboard');
        })
        .catch(() => {
          // Could not copy text - silent fallback
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
            handleBoardTitleBlur={handleBoardTitleBlur}
            copyShareUrl={copyShareUrl}
            handleExportBoard={handleExportBoard}
          />
          <ActionButtons
            handleCreateNewBoard={handleCreateNewBoard}
            handleStartHealthCheck={() => {
              startHealthCheckPhase();
              showNotification('Health check started');
            }}
            sortByVotes={sortByVotes}
            setSortByVotes={setSortByVotes}
            votingEnabled={votingEnabled}
            updateVotingEnabled={updateVotingEnabled}
            downvotingEnabled={downvotingEnabled}
            updateDownvotingEnabled={updateDownvotingEnabled}
            multipleVotesAllowed={multipleVotesAllowed}
            updateMultipleVotesAllowed={updateMultipleVotesAllowed}
            retrospectiveMode={retrospectiveMode}
            updateRetrospectiveMode={updateRetrospectiveMode}
            sortDropdownOpen={settingsDropdownOpen}
            setSortDropdownOpen={setSettingsDropdownOpen}
            resetAllVotes={resetAllVotes}
            showNotification={showNotification}
            darkMode={darkMode}
            updateDarkMode={updateDarkMode}
          />
        </div>
      </header>

      {/* Global Card Creation Indicator */}
      <CardCreationIndicator 
        usersAddingCards={getAllUsersAddingCards()} 
        currentUserId={user?.uid}
      />

      {/* Workflow Controls - Show when retrospective mode is enabled or during health check phases */}
      {(retrospectiveMode || workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK || workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK_RESULTS) && (
        <WorkflowControls showNotification={showNotification} />
      )}

      <main>
        {workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK ? (
          <HealthCheckVoting />
        ) : workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK_RESULTS ? (
          <HealthCheckResults />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.RESULTS ? (
          <ResultsView showNotification={showNotification} />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.POLL ? (
          <PollVoting />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.POLL_RESULTS ? (
          <PollResults />
        ) : (
          <ColumnsContainer
            columns={columns}
            sortByVotes={sortByVotes}
            showNotification={showNotification}
            addNewColumn={addNewColumn}
          />
        )}
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
