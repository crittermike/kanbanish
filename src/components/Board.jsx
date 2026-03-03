import { useState, useEffect } from 'react';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { getBackgroundById } from '../data/boardBackgrounds';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { addColumn } from '../utils/boardUtils';
import { parseUrlSettings } from '../utils/urlSettings';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import ActionItemsPanel from './ActionItemsPanel';
import BoardHeader from './BoardHeader';
import CardCreationIndicator from './CardCreationIndicator';
import ColumnsContainer from './ColumnsContainer';
import DisplayNamePrompt from './DisplayNamePrompt';
import HealthCheckVoting from './HealthCheckVoting';
import ExportBoardModal from './modals/ExportBoardModal';
import PollResults from './PollResults';
import PollVoting from './PollVoting';
import ProfileButton from './ProfileButton';
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
  const [isActionItemsPanelOpen, setIsActionItemsPanelOpen] = useState(false);

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
    hideCardAuthorship,
    updateHideCardAuthorship,
    showDisplayNames,
    updateShowDisplayNames,
    workflowPhase,
    getAllUsersAddingCards,
    startHealthCheckPhase,
    votesPerUser,
    updateVotesPerUser,
    actionItems,
    actionItemsEnabled,
    updateActionItemsEnabled,
    displayName,
    userColor,
    updateDisplayName,
    updateUserColor,
    boardTags,
    backgroundId,
    customBackgroundCss,
    setBoardBackground
  } = useBoardContext();

  // Search state
  const searchFilter = useSearchFilter({ columns, userId: user?.uid });

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

  const actionItemCount = Object.values(actionItems || {}).filter(i => i.status === 'open').length;

  // Resolve background CSS
  const bgDef = getBackgroundById(backgroundId);
  const backgroundCss = backgroundId === 'custom' ? customBackgroundCss : bgDef?.css || '';
  const hasBackground = backgroundId && backgroundId !== 'none' && backgroundCss;

  return (
    <div className={hasBackground ? 'board-has-background' : ''}>
      {hasBackground && <div className="board-background-layer" style={{ background: backgroundCss }} />}

      <header>
        <div className="header-content">
          <BoardHeader
            boardTitle={boardTitle}
            handleBoardTitleChange={handleBoardTitleChange}
            handleBoardTitleBlur={handleBoardTitleBlur}
            onGoHome={onGoHome}
            onSearchOpen={searchFilter.openSearch}
            isSearchOpen={searchFilter.isOpen}
          />
          <SettingsPanel
            handleStartHealthCheck={() => {
              startHealthCheckPhase();
              showNotification('Health check started');
            }}
            copyShareUrl={copyShareUrl}
            handleExportBoard={handleExportBoard}
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
            hideCardAuthorship={hideCardAuthorship}
            updateHideCardAuthorship={updateHideCardAuthorship}
            showDisplayNames={showDisplayNames}
            updateShowDisplayNames={updateShowDisplayNames}
            votesPerUser={votesPerUser}
            updateVotesPerUser={updateVotesPerUser}
            onOpenActionItems={() => {
              setIsActionItemsPanelOpen(true);
              setSettingsDropdownOpen(false);
            }}
            actionItemCount={actionItemCount}
            actionItemsEnabled={actionItemsEnabled}
            updateActionItemsEnabled={updateActionItemsEnabled}
            backgroundId={backgroundId}
            setBoardBackground={setBoardBackground}
          >
            <ProfileButton
              showDisplayNames={showDisplayNames}
              displayName={displayName}
              userColor={userColor}
              updateDisplayName={updateDisplayName}
              updateUserColor={updateUserColor}
            />
          </SettingsPanel>
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
          isFilterPanelOpen={searchFilter.isFilterPanelOpen}
          toggleFilterPanel={searchFilter.toggleFilterPanel}
          filters={searchFilter.filters}
          hasActiveFilters={searchFilter.hasActiveFilters}
          activeFilterCount={searchFilter.activeFilterCount}
          toggleFilterValue={searchFilter.toggleFilterValue}
          setFilterValue={searchFilter.setFilterValue}
          clearFilters={searchFilter.clearFilters}
          boardTags={boardTags}
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


      <main id="board-content">
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

      <ActionItemsPanel
        isOpen={isActionItemsPanelOpen}
        onClose={() => setIsActionItemsPanelOpen(false)}
      />


      <DisplayNamePrompt />
    </div>
  );
}

export default Board;
