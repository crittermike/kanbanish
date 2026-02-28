import { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from './components/Board';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import { BoardProvider, useBoardContext } from './context/BoardContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import BOARD_TEMPLATES from './data/boardTemplates';
import { useRecentBoards } from './hooks/useRecentBoards';
import { createBoardFromTemplate } from './utils/boardUtils';
import { auth, signInAnonymously } from './utils/firebase';

/**
 * Reads the ?board= parameter from the current URL.
 * @returns {string|null} Board ID or null
 */
function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('board') || null;
}

/**
 * Reads the ?template= parameter from the current URL.
 * @returns {string|null} Template ID/slug or null
 */
function getTemplateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('template') || null;
}

/**
 * Finds a template by ID (exact match).
 * @param {string} slug - The template ID to look up
 * @returns {Object|null} The matching template or null
 */
function findTemplateBySlug(slug) {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  return BOARD_TEMPLATES.find(t => t.id === normalized) || null;
}

/**
 * Inner content component that gates between Dashboard and Board views.
 * Renders Dashboard when no ?board= param, Board otherwise.
 */
function AppContent() {
  const { notification, handleAction } = useNotification();
  const [activeBoardId, setActiveBoardId] = useState(() => getBoardIdFromUrl());
  const { addBoard } = useRecentBoards();

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveBoardId(getBoardIdFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate to a board: update URL and state
  const handleOpenBoard = useCallback((boardId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('board', boardId);
    // Remove template param so it doesn't re-trigger on navigation
    url.searchParams.delete('template');
    window.history.pushState({}, '', url.toString());
    setActiveBoardId(boardId);

    // Track this board visit in recent boards
    addBoard({ id: boardId });
  }, [addBoard]);

  // Navigate back to dashboard: remove ?board= param
  const handleGoHome = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('board');
    window.history.pushState({}, '', url.toString());
    setActiveBoardId(null);
  }, []);

  // Handle ?template=X URL param: auto-create board from template and redirect
  const templateProcessed = useRef(false);
  useEffect(() => {
    if (activeBoardId || templateProcessed.current) return;

    const templateSlug = getTemplateFromUrl();
    if (!templateSlug) return;

    const template = findTemplateBySlug(templateSlug);
    if (!template) return;

    templateProcessed.current = true;

    // Ensure user is authenticated before creating board
    const unsubscribe = auth.onAuthStateChanged(authedUser => {
      const doCreate = (user) => {
        createBoardFromTemplate({
          columns: template.columns,
          templateName: template.name,
          user,
          queryString: window.location.search
        })
          .then(newBoardId => {
            handleOpenBoard(newBoardId);
          })
          .catch(error => {
            console.error('Error creating board from template URL:', error);
            templateProcessed.current = false;
          });
      };

      if (authedUser) {
        doCreate(authedUser);
      } else {
        signInAnonymously(auth)
          .then(result => doCreate(result.user))
          .catch(error => {
            console.error('Error signing in for template creation:', error);
            templateProcessed.current = false;
          });
      }
      unsubscribe();
    });

    return () => unsubscribe();
  }, [activeBoardId, handleOpenBoard]);


  return (
    <div className="App" data-testid="app-container">
      {activeBoardId && (
        <a href="#board-content" className="skip-to-content">
          Skip to board content
        </a>
      )}
      {activeBoardId ? (
        <BoardGate boardId={activeBoardId} onGoHome={handleGoHome} />
      ) : (
        <DashboardGate onOpenBoard={handleOpenBoard} />
      )}

      {/* Success Notification */}
      <div id="notification" className={`notification ${notification.show ? 'show' : ''}`} role="status" aria-live="polite">
        <span id="notification-message">{notification.message}</span>
        {notification.actionLabel && (
          <button
            className="notification-action"
            onClick={handleAction}
          >
            {notification.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Wraps the Board in a BoardProvider and passes the boardId + goHome handler.
 * BoardProvider handles Firebase subscription; Board handles rendering.
 */
function BoardGate({ boardId, onGoHome }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <BoardProvider initialBoardId={boardId}>
        <BoardWithTracking onGoHome={onGoHome} />
      </BoardProvider>
    </DndProvider>
  );
}

/**
 * Wrapper that tracks board visits in localStorage once board data loads.
 */
function BoardWithTracking({ onGoHome }) {
  const { boardId, boardTitle, columns } = useBoardContext();
  const { addBoard } = useRecentBoards();

  // Track board visit with metadata when board data loads
  useEffect(() => {
    if (boardId && boardTitle && columns) {
      const cardCount = Object.values(columns).reduce(
        (total, col) => total + Object.keys(col.cards || {}).length,
        0
      );
      addBoard({ id: boardId, title: boardTitle, cardCount });
    }
  }, [boardId, boardTitle, columns, addBoard]);

  return <Board onGoHome={onGoHome} />;
}

/**
 * Wraps Dashboard with dark mode state from context or localStorage.
 */
function DashboardGate({ onOpenBoard }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Check document class (may have been set by a previous board session)
    return !document.documentElement.classList.contains('light-mode');
  });

  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light-mode');
      } else {
        document.documentElement.classList.add('light-mode');
      }
      return next;
    });
  }, []);

  return (
    <Dashboard
      onOpenBoard={onOpenBoard}
      darkMode={darkMode}
      onToggleDarkMode={handleToggleDarkMode}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <OfflineIndicator />
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
