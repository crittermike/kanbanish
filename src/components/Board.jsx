import { useState, useEffect } from 'react';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { addColumn } from '../utils/boardUtils';
import { parseUrlSettings } from '../utils/urlSettings';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import BoardHeader from './BoardHeader';
import CardCreationIndicator from './CardCreationIndicator';
import ColumnsContainer from './ColumnsContainer';
import HealthCheckVoting from './HealthCheckVoting';
import ExportBoardModal from './modals/ExportBoardModal';
import NewBoardTemplateModal, { BOARD_TEMPLATES } from './modals/NewBoardTemplateModal';
import PollResults from './PollResults';
import PollVoting from './PollVoting';
import ResultsView from './ResultsView';
import SettingsPanel from './SettingsPanel';
import WorkflowControls from './WorkflowControls';

/**
 * Main Board component responsible for rendering and managing the kanban board.
 * Orchestrates board initialization, URL settings, and layout of header, columns, and modals.
 */
function Board() {
  const { showNotification } = useNotification();
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
    user,
    darkMode,
    updateDarkMode,
    workflowPhase,
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
          <SettingsPanel
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
