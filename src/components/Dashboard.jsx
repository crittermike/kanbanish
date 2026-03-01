import { useState, useEffect, useCallback } from 'react';
import { Clock, Layout, Plus, Star, Trash2, Sun, Moon, Users, Zap, Globe } from 'react-feather';
import { useRecentBoards } from '../hooks/useRecentBoards';
import { createBoardFromTemplate } from '../utils/boardUtils';
import { database, auth, signInAnonymously, get, ref } from '../utils/firebase';
import BoardSetupWizard from './modals/BoardSetupWizard';
import NewBoardTemplateModal from './modals/NewBoardTemplateModal';

/**
 * Format a timestamp into a human-readable relative time string.
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string (e.g., "just now", "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Count total cards across all columns in a board snapshot.
 * @param {Object} columns - Board columns object from Firebase
 * @returns {number} Total card count
 */
function countCards(columns) {
  if (!columns) return 0;
  return Object.values(columns).reduce(
    (total, col) => total + Object.keys(col.cards || {}).length,
    0
  );
}

/**
 * Dashboard component — landing page shown when no board is active.
 * Displays recent/pinned boards, allows creating new boards and joining by ID.
 *
 * @param {Object} props
 * @param {Function} props.onOpenBoard - Called with boardId to navigate to a board
 * @param {boolean} props.darkMode - Current dark mode state
 * @param {Function} props.onToggleDarkMode - Toggle dark mode callback
 */
function Dashboard({ onOpenBoard, darkMode, onToggleDarkMode }) {
  const { recentBoards, removeBoard, togglePin, updateBoardMeta, clearAll } = useRecentBoards();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [joinBoardId, setJoinBoardId] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(new Set());
  const [user, setUser] = useState(null);

  // Ensure anonymous auth so we can create boards
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(authedUser => {
      if (authedUser) {
        setUser(authedUser);
      } else {
        signInAnonymously(auth).catch(error => {
          console.error('Error signing in:', error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch fresh metadata from Firebase for each recent board
  useEffect(() => {
    if (recentBoards.length === 0) return;

    const boardsToFetch = recentBoards.map(b => b.id);
    setLoadingMeta(new Set(boardsToFetch));

    boardsToFetch.forEach(boardId => {
      const boardRef = ref(database, `boards/${boardId}`);
      get(boardRef)
        .then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const title = data.title || undefined;
            const cardCount = countCards(data.columns);
            updateBoardMeta(boardId, { title, cardCount });
          }
        })
        .catch(() => {
          // Board may have been deleted — leave existing cached data
        })
        .finally(() => {
          setLoadingMeta(prev => {
            const next = new Set(prev);
            next.delete(boardId);
            return next;
          });
        });
    });
  }, [recentBoards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a template is selected, store it and open the setup wizard
  const handleTemplateSelected = useCallback((templateColumns, templateName = null, templateTags = []) => {
    setPendingTemplate({ columns: templateColumns, name: templateName, tags: templateTags });
    setIsTemplateModalOpen(false);
    setIsWizardOpen(true);
  }, []);

  // When wizard is confirmed, create the board with the chosen settings
  const handleWizardConfirm = useCallback((wizardSettings) => {
    if (!user || !pendingTemplate) return;

    createBoardFromTemplate({
      columns: pendingTemplate.columns,
      templateName: pendingTemplate.name,
      user,
      queryString: window.location.search,
      settingsOverrides: {
        retrospectiveMode: wizardSettings.retrospectiveMode,
        votingEnabled: wizardSettings.votingEnabled,
        showDisplayNames: wizardSettings.showDisplayNames,
        actionItemsEnabled: wizardSettings.actionItemsEnabled,
      }
    })
      .then(newBoardId => {
        setIsWizardOpen(false);
        setPendingTemplate(null);
        onOpenBoard(newBoardId);
      })
      .catch(error => {
        console.error('Error creating board:', error);
      });
  }, [user, pendingTemplate, onOpenBoard]);

  // Navigate to a board
  const handleOpenBoard = (boardId) => {
    onOpenBoard(boardId);
  };

  // Join a board by pasting its ID or full URL
  const handleJoinBoard = () => {
    const input = joinBoardId.trim();
    if (!input) return;

    // Try to extract board ID from a full URL
    let extractedId = input;
    try {
      const url = new URL(input);
      const boardParam = url.searchParams.get('board');
      if (boardParam) {
        extractedId = boardParam;
      }
    } catch {
      // Not a URL, use as-is (it's a raw board ID)
    }

    if (extractedId) {
      setJoinBoardId('');
      onOpenBoard(extractedId);
    }
  };

  // Handle Enter key in join input
  const handleJoinKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJoinBoard();
    }
  };

  const pinnedBoards = recentBoards.filter(b => b.pinned);
  const unpinnedBoards = recentBoards.filter(b => !b.pinned);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Kanbanish</h1>
        </div>
        <div className="dashboard-header-right">
          <button
            className="dashboard-theme-toggle"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Hero: Create + Join in a card container */}
        <div className="dashboard-hero">
          <div className="dashboard-tagline">
            <h2>Collaborative boards for teams</h2>
            <p>Run retros, brainstorm, or organize work — no sign-up needed.</p>
          </div>
          <div className="dashboard-hero-actions">
            <button
              className="dashboard-new-board-btn"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              <Plus size={20} />
              New Board
            </button>
            <div className="dashboard-hero-divider">or</div>
            <div className="dashboard-join-section">
              <input
                type="text"
                className="dashboard-join-input"
                placeholder="Paste a board URL or ID to join..."
                value={joinBoardId}
                onChange={e => setJoinBoardId(e.target.value)}
                onKeyDown={handleJoinKeyDown}
                aria-label="Board ID or URL"
              />
              <button
                className="dashboard-join-btn"
                onClick={handleJoinBoard}
                disabled={!joinBoardId.trim()}
              >
                Join
              </button>
            </div>
          </div>
          <div className="dashboard-features">
            <div className="dashboard-feature">
              <Zap size={16} />
              <span>Instant setup</span>
            </div>
            <div className="dashboard-feature">
              <Users size={16} />
              <span>Real-time collaboration</span>
            </div>
            <div className="dashboard-feature">
              <Globe size={16} />
              <span>No account needed</span>
            </div>
          </div>
        </div>

        {/* Pinned Boards */}
        {pinnedBoards.length > 0 && (
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2><Star size={14} /> Pinned</h2>
            </div>
            <div className="dashboard-board-list">
              {pinnedBoards.map(board => (
                <div
                  key={board.id}
                  className="dashboard-board-card pinned"
                  onClick={() => handleOpenBoard(board.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenBoard(board.id); } }}
                >
                  <div className="dashboard-board-info">
                    <h3 className="dashboard-board-title">{board.title || 'Untitled Board'}</h3>
                    <div className="dashboard-board-meta">
                      {loadingMeta.has(board.id) ? (
                        <span className="dashboard-board-meta-loading" />
                      ) : (
                        <>
                          <span>{board.cardCount || 0} cards</span>
                          <span className="dashboard-board-meta-separator">·</span>
                          <span>{formatRelativeTime(board.lastVisited)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-board-actions">
                    <button
                      className="pin-active"
                      title="Unpin board"
                      aria-label="Unpin board"
                      onClick={e => { e.stopPropagation(); togglePin(board.id); }}
                    >
                      <Star size={14} />
                    </button>
                    <button
                      className="remove-btn"
                      title="Remove from list"
                      aria-label="Remove board from list"
                      onClick={e => { e.stopPropagation(); if (window.confirm('Remove this board from your list?')) removeBoard(board.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Boards */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2><Clock size={14} /> Recent</h2>
            {recentBoards.length > 0 && (
              <button className="dashboard-clear-all" onClick={() => { if (window.confirm('Clear all recent boards from your list?')) clearAll(); }}>
                Clear all
              </button>
            )}
          </div>
          {unpinnedBoards.length === 0 && pinnedBoards.length === 0 ? (
            <div className="dashboard-empty-state">
              <Layout size={32} />
              <h3>No recent boards</h3>
              <p>Create a new board or join an existing one above.</p>
            </div>
          ) : (
            <div className="dashboard-board-list">
              {unpinnedBoards.map(board => (
                <div
                  key={board.id}
                  className="dashboard-board-card"
                  onClick={() => handleOpenBoard(board.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenBoard(board.id); } }}
                >
                  <div className="dashboard-board-info">
                    <h3 className="dashboard-board-title">{board.title || 'Untitled Board'}</h3>
                    <div className="dashboard-board-meta">
                      {loadingMeta.has(board.id) ? (
                        <span className="dashboard-board-meta-loading" />
                      ) : (
                        <>
                          <span>{board.cardCount || 0} cards</span>
                          <span className="dashboard-board-meta-separator">·</span>
                          <span>{formatRelativeTime(board.lastVisited)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-board-actions">
                    <button
                      title="Pin board"
                      aria-label="Pin board"
                      onClick={e => { e.stopPropagation(); togglePin(board.id); }}
                    >
                      <Star size={14} />
                    </button>
                    <button
                      className="remove-btn"
                      title="Remove from list"
                      aria-label="Remove board from list"
                      onClick={e => { e.stopPropagation(); if (window.confirm('Remove this board from your list?')) removeBoard(board.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Selection Modal */}
      <NewBoardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelected}
      />

      {/* Board Setup Wizard (Step 2) */}
      <BoardSetupWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setIsTemplateModalOpen(true);
        }}
        onConfirm={handleWizardConfirm}
        templateName={pendingTemplate?.name}
        templateTags={pendingTemplate?.tags}
      />
    </div>
  );
}

export default Dashboard;
