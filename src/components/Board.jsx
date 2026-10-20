import { useState, useEffect, useCallback } from 'react';
import { Search } from 'react-feather';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { getBackgroundById } from '../data/boardBackgrounds';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { addColumn } from '../utils/boardUtils';
import { parseUrlSettings } from '../utils/urlSettings';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import BoardHeader from './BoardHeader';
import CardCreationIndicator from './CardCreationIndicator';
import ColumnsContainer from './ColumnsContainer';
import DisplayNamePrompt from './DisplayNamePrompt';
import HealthCheckResults from './HealthCheckResults';
import HealthCheckVoting from './HealthCheckVoting';
import CardDetailModal from './modals/CardDetailModal';
import ExportBoardModal from './modals/ExportBoardModal';
import LinkPreviousBoardModal from './modals/LinkPreviousBoardModal';
import PollResults from './PollResults';
import PollVoting from './PollVoting';
import ProfileButton from './ProfileButton';
import ResultsView from './ResultsView';
import SearchFilterBar from './SearchFilterBar';
import SettingsPanel from './SettingsPanel';
import StepBanner from './StepBanner';
import StepSwitcher from './StepSwitcher';

/**
 * Main Board component responsible for rendering and managing the kanban board.
 * Orchestrates board initialization, URL settings, and layout of header, columns, and modals.
 */
function Board({ onNavigateToBoard }) {
  const { showNotification } = useNotification();
  // State for modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLinkPreviousModalOpen, setIsLinkPreviousModalOpen] = useState(false);

  // State for card detail modal
  const [expandedCard, setExpandedCard] = useState(null);

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
    resetAllVotes,
    updateBoardTitle,
    user,
    darkMode,
    updateDarkMode,
    showDisplayNames,
    updateShowDisplayNames,
    workflowPhase,
    getAllUsersAddingCards,
    votesPerUser,
    updateVotesPerUser,
    displayName,
    userColor,
    updateDisplayName,
    updateUserColor,
    boardTags,
    backgroundId,
    customBackgroundCss,
    setBoardBackground,
    setCustomBackground,
    customBackgroundSize,
    setCustomBackgroundSize,
    previousBoardId,
    nextBoardId,
    startNextBoard,
    linkToPreviousBoard,
    unlinkFromSeries
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
      .catch(() => {
        // Error adding column - silent fallback
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
  };

  // Create the next board in the series and navigate to it
  const handleStartNextBoard = useCallback(async () => {
    if (nextBoardId) {
      const proceed = window.confirm(
        'This board already links to a next board. Starting a new one will replace that link. Continue?'
      );
      if (!proceed) return;
    }
    try {
      const newBoardId = await startNextBoard();
      if (newBoardId && onNavigateToBoard) {
        onNavigateToBoard(newBoardId);
      }
    } catch {
      showNotification('Could not start the next board');
    }
  }, [nextBoardId, startNextBoard, onNavigateToBoard, showNotification]);

  // Detach this board from its series
  const handleUnlinkSeries = useCallback(async () => {
    const proceed = window.confirm('Remove this board from its series? Its neighbouring boards will stay linked to each other.');
    if (!proceed) return;
    try {
      await unlinkFromSeries();
    } catch {
      showNotification('Could not update the series');
    }
  }, [unlinkFromSeries, showNotification]);

  // Handle card expand for card detail modal
  const handleExpandCard = useCallback((cardId, columnId, options = {}) => {
    setExpandedCard({ cardId, columnId, ...options });
  }, []);

  // Resolve background CSS
  const bgDef = getBackgroundById(backgroundId);
  const backgroundCss = backgroundId === 'custom' ? customBackgroundCss : bgDef?.css || '';
  const hasBackground = backgroundId && backgroundId !== 'none' && backgroundCss;

  const backgroundStyle = { background: backgroundCss };
  if (backgroundId === 'custom') {
    if (customBackgroundSize === 'tile') {
      backgroundStyle.backgroundSize = 'auto';
      backgroundStyle.backgroundRepeat = 'repeat';
      backgroundStyle.backgroundPosition = 'top left';
    } else if (customBackgroundSize === 'stretch') {
      backgroundStyle.backgroundSize = '100% 100%';
      backgroundStyle.backgroundRepeat = 'no-repeat';
      backgroundStyle.backgroundPosition = 'center';
    } else {
      // 'cover' (default)
      backgroundStyle.backgroundSize = 'cover';
      backgroundStyle.backgroundRepeat = 'no-repeat';
      backgroundStyle.backgroundPosition = 'center';
    }
  }

  return (
    <div className={hasBackground ? 'board-layout board-has-background' : 'board-layout'}>
      {hasBackground && <div className="board-background-layer" style={backgroundStyle} />}

      <header>
        <div className="header-content">
          <BoardHeader
            boardTitle={boardTitle}
            handleBoardTitleChange={handleBoardTitleChange}
            handleBoardTitleBlur={handleBoardTitleBlur}
            previousBoardId={previousBoardId}
            nextBoardId={nextBoardId}
            onNavigateToBoard={onNavigateToBoard}
          />
          <StepSwitcher />
          <SettingsPanel
            leading={!searchFilter.isOpen && (
              <button
                className="search-trigger-btn"
                onClick={searchFilter.openSearch}
                title="Search cards (Ctrl+F)"
                aria-label="Search cards"
              >
                <Search size={16} />
              </button>
            )}
            copyShareUrl={copyShareUrl}
            handleExportBoard={handleExportBoard}
            votingEnabled={votingEnabled}
            updateVotingEnabled={updateVotingEnabled}
            downvotingEnabled={downvotingEnabled}
            updateDownvotingEnabled={updateDownvotingEnabled}
            multipleVotesAllowed={multipleVotesAllowed}
            updateMultipleVotesAllowed={updateMultipleVotesAllowed}
            retrospectiveMode={retrospectiveMode}
            sortDropdownOpen={settingsDropdownOpen}
            setSortDropdownOpen={setSettingsDropdownOpen}
            showSort={!!(votingEnabled || retrospectiveMode || sortByVotes)}
            sortByVotes={sortByVotes}
            setSortByVotes={setSortByVotes}
            resetAllVotes={resetAllVotes}
            darkMode={darkMode}
            updateDarkMode={updateDarkMode}
            showDisplayNames={showDisplayNames}
            updateShowDisplayNames={updateShowDisplayNames}
            votesPerUser={votesPerUser}
            updateVotesPerUser={updateVotesPerUser}
            backgroundId={backgroundId}
            setBoardBackground={setBoardBackground}
            customBackgroundCss={customBackgroundCss}
            setCustomBackground={setCustomBackground}
            customBackgroundSize={customBackgroundSize}
            setCustomBackgroundSize={setCustomBackgroundSize}
            previousBoardId={previousBoardId}
            nextBoardId={nextBoardId}
            onStartNextBoard={handleStartNextBoard}
            onOpenLinkPrevious={() => setIsLinkPreviousModalOpen(true)}
            onUnlinkSeries={handleUnlinkSeries}
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

      <StepBanner />

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
        showDisplayNames={showDisplayNames}
      />

      <main id="board-content">
        {workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK ? (
          <HealthCheckVoting />
        ) : workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK_RESULTS ? (
          <HealthCheckResults />
        ) : retrospectiveMode && workflowPhase === WORKFLOW_PHASES.RESULTS ? (
          <ResultsView onExpandCard={handleExpandCard} />
        ) : workflowPhase === WORKFLOW_PHASES.POLL ? (
          <PollVoting />
        ) : workflowPhase === WORKFLOW_PHASES.POLL_RESULTS ? (
          <PollResults />
        ) : (
          <ColumnsContainer
            columns={columns}
            sortByVotes={sortByVotes}
            addNewColumn={addNewColumn}
            isFiltering={searchFilter.isFiltering}
            matchingCardIds={searchFilter.matchingCardIds}
            matchingGroupIds={searchFilter.matchingGroupIds}
            onExpandCard={handleExpandCard}
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

      <LinkPreviousBoardModal
        isOpen={isLinkPreviousModalOpen}
        onClose={() => setIsLinkPreviousModalOpen(false)}
        currentBoardId={boardId}
        onLink={linkToPreviousBoard}
      />

      {/* Card Detail Modal */}
      {expandedCard && (
        <CardDetailModal
          isOpen={true}
          onClose={() => setExpandedCard(null)}
          cardId={expandedCard.cardId}
          columnId={expandedCard.columnId}
          cardList={expandedCard.cardList}
          contextLabel={expandedCard.contextLabel}
          onNavigateCard={(cardId, columnId) => setExpandedCard(current => ({
            ...current,
            cardId,
            columnId
          }))}
        />
      )}

      <DisplayNamePrompt />

    </div>
  );
}

export default Board;
