import { useState, useEffect } from 'react';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { addColumn } from '../utils/boardUtils';
import { parseUrlSettings } from '../utils/urlSettings';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import BoardHeader from './BoardHeader';
import CardCreationIndicator from './CardCreationIndicator';
import ColumnsContainer from './ColumnsContainer';
import HealthCheckVoting from './HealthCheckVoting';
import ExportBoardModal from './modals/ExportBoardModal';
import PollResults from './PollResults';
import PollVoting from './PollVoting';
import ResultsView from './ResultsView';
import SearchFilterBar from './SearchFilterBar';
import SettingsPanel from './SettingsPanel';
import WorkflowControls from './WorkflowControls';

/**
 * Main Board component responsible for rendering and managing the kanban board.
 * Orchestrates board initialization, URL settings, and layout of header, columns, and modals.
 */
function Board({ onGoHome }) {
  const { showNotification } = useNotification();
  // State for modals
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
    votingEnabled,
    updateVotingEnabled,
    downvotingEnabled,
    updateDownvotingEnabled,
    multipleVotesAllowed,
    updateMultipleVotesAllowed,
    retrospectiveMode,
    updateRetrospectiveMode,
    resetAllVotes,
    updateBoardTitle,
    user,
    darkMode,
    updateDarkMode,
    workflowPhase,
    getAllUsersAddingCards,
    startHealthCheckPhase
  } = useBoardContext();

  // Search state
  const searchFilter = useSearchFilter({ columns });

  // State for settings dropdown menu
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  /**
   * BOARD INITIALIZATION
   */

  // Apply URL-derived theme preference on mount
  useEffect(() => {
    const parsed = parseUrlSettings(window.location.search);
    if (parsed.uiPrefs && parsed.uiPrefs.darkMode !== undefined) {
      updateDarkMode(parsed.uiPrefs.darkMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onGoHome={onGoHome}
            onSearchOpen={searchFilter.openSearch}
            isSearchOpen={searchFilter.isOpen}
          />
          <SettingsPanel
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
            darkMode={darkMode}
            updateDarkMode={updateDarkMode}
          />
        </div>
      </header>

      {/* Search and Filter Bar */}
      {searchFilter.isOpen && (
        <SearchFilterBar
          searchQuery={searchFilter.searchQuery}
          setSearchQuery={searchFilter.setSearchQuery}
          isFiltering={searchFilter.isFiltering}
          matchingCount={searchFilter.matchingCount}
          totalCards={searchFilter.totalCards}
          closeSearch={searchFilter.closeSearch}
          searchInputRef={searchFilter.searchInputRef}
        />
      )}

      {/* Global Card Creation Indicator */}
      <CardCreationIndicator 
        usersAddingCards={getAllUsersAddingCards()} 
        currentUserId={user?.uid}
      />

      {/* Workflow Controls - Show when retrospective mode is enabled or during health check phase */}
      {(retrospectiveMode || workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK) && (
        <WorkflowControls />
      )}


      <main>
        {workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK ? (
          <HealthCheckVoting />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.RESULTS ? (
          <ResultsView />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.POLL ? (
          <PollVoting />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.POLL_RESULTS ? (
          <PollResults />
        ) : (
          <ColumnsContainer
            columns={columns}
            sortByVotes={sortByVotes}
            addNewColumn={addNewColumn}
            isFiltering={searchFilter.isFiltering}
            matchingCardIds={searchFilter.matchingCardIds}
            matchingGroupIds={searchFilter.matchingGroupIds}
          />
        )}
      </main>

      {/* Export Board Modal */}
      <ExportBoardModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
        }}
      />

    </>
  );
}

export default Board;
