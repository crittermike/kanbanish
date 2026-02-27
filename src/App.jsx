import { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from './components/Board';
import Dashboard from './components/Dashboard';
import { BoardProvider, useBoardContext } from './context/BoardContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { useRecentBoards } from './hooks/useRecentBoards';

/**
 * Reads the ?board= parameter from the current URL.
 * @returns {string|null} Board ID or null
 */
function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('board') || null;
}

/**
 * Inner content component that gates between Dashboard and Board views.
 * Renders Dashboard when no ?board= param, Board otherwise.
 */
function AppContent() {
  const { notification } = useNotification();
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

  return (
    <div className="App" data-testid="app-container">
      {activeBoardId ? (
        <BoardGate boardId={activeBoardId} onGoHome={handleGoHome} />
      ) : (
        <DashboardGate onOpenBoard={handleOpenBoard} />
      )}

      {/* Success Notification */}
      <div id="notification" className={`notification ${notification.show ? 'show' : ''}`}>
        <span id="notification-message">{notification.message}</span>
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
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
