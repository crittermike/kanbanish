import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, Star, Trash2, Sun, Moon } from 'react-feather';
import BOARD_TEMPLATES from '../data/boardTemplates';
import { useRecentBoards } from '../hooks/useRecentBoards';
import { createBoardFromTemplate } from '../utils/boardUtils';
import { database, auth, signInAnonymously, get, ref } from '../utils/firebase';
import { getLastTemplateId, getTemplateBoardOptions, setLastTemplateId } from '../utils/templateUtils';
import NewBoardTemplateModal from './modals/NewBoardTemplateModal';
import TemplateLink from './TemplateLink';

const FEATURED_TEMPLATE_IDS = ['default', 'retro', 'lean-coffee', 'start-stop-continue'];
const QUICK_TEMPLATE_COUNT = 4;

/**
 * Templates shown as quick-create tiles: last-used first, then the featured ones.
 * @param {string|null} lastTemplateId
 * @returns {Array} Template objects
 */
function getQuickTemplates(lastTemplateId) {
  const ids = [...new Set([lastTemplateId, ...FEATURED_TEMPLATE_IDS].filter(Boolean))];
  return ids
    .map(id => BOARD_TEMPLATES.find(t => t.id === id))
    .filter(Boolean)
    .slice(0, QUICK_TEMPLATE_COUNT);
}

const TILE_COLORS = ['var(--accent)', 'var(--success-color)', 'var(--warning-color)', 'var(--accent-alt)'];

/**
 * Stable per-template tile color. A non-featured last-used template displaces the last
 * featured tile, so it takes that tile's color and the row stays distinct.
 * @param {Object} template
 * @returns {string} CSS color
 */
function getTileColor(template) {
  const featuredIndex = FEATURED_TEMPLATE_IDS.indexOf(template.id);
  return TILE_COLORS[featuredIndex === -1 ? TILE_COLORS.length - 1 : featuredIndex];
}

/**
 * Miniature board showing a template's column layout, so each tile previews what it creates.
 * Card stubs vary per template so tiles with the same column count still differ.
 */
function TemplatePreview({ template }) {
  const seed = [...template.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span className="dashboard-template-preview" aria-hidden="true">
      {template.columns.slice(0, 4).map((_, i) => (
        <span key={i} className="dashboard-template-preview-col">
          <span className="dashboard-template-preview-title" />
          {Array.from({ length: ((seed + i * 5) % 3) + 1 }, (_, j) => (
            <span key={j} className="dashboard-template-preview-card" />
          ))}
        </span>
      ))}
    </span>
  );
}

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
 * Displays recent/pinned boards, one-click board creation from templates, and joining by ID.
 *
 * @param {Object} props
 * @param {Function} props.onOpenBoard - Called with boardId to navigate to a board
 * @param {boolean} props.darkMode - Current dark mode state
 * @param {Function} props.onToggleDarkMode - Toggle dark mode callback
 */
function Dashboard({ onOpenBoard, darkMode, onToggleDarkMode }) {
  const { recentBoards, removeBoard, togglePin, updateBoardMeta, clearAll } = useRecentBoards();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const quickTemplates = useMemo(() => getQuickTemplates(getLastTemplateId()), []);
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

  // Create a board from a template in one step and open it
  const handleCreateFromTemplate = useCallback(template => {
    if (isCreating) return;
    setIsCreating(true);

    const userPromise = user
      ? Promise.resolve(user)
      : signInAnonymously(auth).then(result => result.user);

    userPromise
      .then(currentUser => createBoardFromTemplate({
        ...getTemplateBoardOptions(template),
        user: currentUser,
        queryString: window.location.search
      }))
      .then(newBoardId => {
        setLastTemplateId(template.id);
        setIsTemplateModalOpen(false);
        onOpenBoard(newBoardId);
      })
      .catch(error => {
        console.error('Error creating board:', error);
        setIsCreating(false);
      });
  }, [isCreating, user, onOpenBoard]);

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

  const pinnedBoards = recentBoards.filter(b => b.pinned);
  const unpinnedBoards = recentBoards.filter(b => !b.pinned);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Kanbanish</h1>
        <div className="dashboard-header-right">
          <form
            className="dashboard-join-section"
            onSubmit={e => { e.preventDefault(); handleJoinBoard(); }}
          >
            <input
              type="text"
              className="dashboard-join-input"
              placeholder="Board link or ID"
              value={joinBoardId}
              onChange={e => setJoinBoardId(e.target.value)}
              aria-label="Board ID or URL"
            />
            <button
              type="submit"
              className="dashboard-join-btn"
              disabled={!joinBoardId.trim()}
            >
              Join
            </button>
          </form>
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
        <section className="dashboard-section dashboard-new">
          <div className="dashboard-section-header">
            <h2>New board</h2>
          </div>
          <div className="dashboard-template-tiles">
            {quickTemplates.map(template => (
              <TemplateLink
                key={template.id}
                template={template}
                onSelect={handleCreateFromTemplate}
                disabled={isCreating}
                className="dashboard-template-tile"
                style={{ '--tile-color': getTileColor(template) }}
                title={template.description}
              >
                <TemplatePreview template={template} />
                <span className="dashboard-template-footer">
                  <span className="dashboard-template-name">{template.name}</span>
                </span>
              </TemplateLink>
            ))}
            <button
              type="button"
              className="dashboard-template-tile dashboard-template-tile-all"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              <span className="dashboard-template-preview" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="dashboard-template-mini" />
                ))}
              </span>
              <span className="dashboard-template-footer">
                <span className="dashboard-template-name">All templates</span>
                <ArrowRight size={14} className="dashboard-template-arrow" aria-hidden="true" />
              </span>
            </button>
          </div>
        </section>

        {/* Pinned Boards */}
        {pinnedBoards.length > 0 && (
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Pinned</h2>
            </div>
            <div className="dashboard-board-list">
              {pinnedBoards.map(board => (
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
        {unpinnedBoards.length > 0 && (
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Recent</h2>
              <button className="dashboard-section-action dashboard-clear-all" onClick={() => { if (window.confirm('Clear all recent boards from your list?')) clearAll(); }}>
                Clear all
              </button>
            </div>
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
          </div>
        )}
      </div>

      <NewBoardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleCreateFromTemplate}
        disabled={isCreating}
      />
    </div>
  );
}

export default Dashboard;
