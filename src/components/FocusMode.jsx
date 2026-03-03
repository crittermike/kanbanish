import { useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X
} from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import MarkdownContent from './MarkdownContent';

/**
 * Reaction badge for displaying emoji reactions on the focus card.
 */
const FocusReaction = ({ emoji, count, isActive }) => (
  <span className={`focus-reaction${isActive ? ' active' : ''}`}>
    <span className="focus-reaction-emoji">{emoji}</span>
    <span className="focus-reaction-count">{count}</span>
  </span>
);

/**
 * Column breadcrumb pill showing which column the current card belongs to.
 */
const ColumnBadge = ({ title, groupName }) => (
  <div className="focus-breadcrumb">
    <span className="focus-breadcrumb-column">{title}</span>
    {groupName && (
      <>
        <span className="focus-breadcrumb-separator">›</span>
        <span className="focus-breadcrumb-group">{groupName}</span>
      </>
    )}
  </div>
);

/**
 * Progress bar that visually indicates position in the card list.
 */
const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="focus-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      <div className="focus-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

/**
 * Mini-map dots for quick navigation between cards.
 */
const MiniMap = ({ total, current, onSelect }) => {
  // Only show minimap if there are a reasonable number of cards
  if (total > 40) {
    return null;
  }

  return (
    <div className="focus-minimap" aria-label="Card navigation minimap">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`focus-minimap-dot${i === current ? ' active' : ''}${i < current ? ' visited' : ''}`}
          onClick={() => onSelect(i)}
          title={`Go to card ${i + 1}`}
          aria-label={`Go to card ${i + 1}${i === current ? ' (current)' : ''}`}
        />
      ))}
    </div>
  );
};

/**
 * FocusMode — Full-screen presentation overlay for walking through cards.
 *
 * Features:
 * - Large centered card with content, votes, reactions, comments count
 * - Column/group breadcrumb
 * - Progress bar + counter
 * - Prev/Next navigation (buttons + keyboard arrows)
 * - Auto-play with configurable interval
 * - Minimap for quick jumps (≤40 cards)
 * - Escape or X to exit
 */
const FocusMode = ({
  isActive,
  currentIndex,
  currentCard,
  totalCards,
  goNext,
  goPrev,
  goToIndex,
  exit,
  autoPlayActive,
  toggleAutoPlay
}) => {
  const { votingEnabled, user } = useBoardContext();
  const overlayRef = useRef(null);

  // Focus trap: return focus to overlay when active
  useEffect(() => {
    if (isActive && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isActive, currentIndex]);

  if (!isActive || !currentCard) {
    return null;
  }

  const { cardData, columnTitle, groupName } = currentCard;
  const votes = cardData.votes || 0;
  const reactions = cardData.reactions || {};
  const commentCount = Object.keys(cardData.comments || {}).length;
  const tags = cardData.tags || [];
  const hasColor = !!cardData.color;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCards - 1;

  return (
    <div
      className="focus-overlay"
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode — card presentation view"
    >
      {/* Top bar: breadcrumb + counter + close */}
      <div className="focus-topbar">
        <ColumnBadge title={columnTitle} groupName={groupName} />

        <div className="focus-counter">
          <span className="focus-counter-current">{currentIndex + 1}</span>
          <span className="focus-counter-sep">/</span>
          <span className="focus-counter-total">{totalCards}</span>
        </div>

        <div className="focus-topbar-actions">
          <button
            className="focus-btn focus-btn-icon"
            onClick={toggleAutoPlay}
            title={autoPlayActive ? 'Pause auto-play (Space)' : 'Start auto-play (Space)'}
            aria-label={autoPlayActive ? 'Pause auto-play' : 'Start auto-play'}
          >
            {autoPlayActive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="focus-btn focus-btn-icon focus-close-btn"
            onClick={exit}
            title="Exit focus mode (Esc)"
            aria-label="Exit focus mode"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar current={currentIndex} total={totalCards} />

      {/* Main card area */}
      <div className="focus-body">
        {/* Prev button */}
        <button
          className="focus-nav-btn focus-nav-prev"
          onClick={goPrev}
          disabled={isFirst}
          title="Previous card (←)"
          aria-label="Previous card"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Card spotlight */}
        <div className="focus-card-container">
          <div
            className="focus-card"
            style={hasColor ? { borderTop: `4px solid ${cardData.color}` } : undefined}
          >
            {/* Vote badge */}
            {votingEnabled && votes !== 0 && (
              <div className={`focus-vote-badge${votes > 0 ? ' positive' : ' negative'}`}>
                {votes > 0 ? '+' : ''}{votes}
              </div>
            )}

            {/* Card content */}
            <div className="focus-card-content">
              <MarkdownContent content={cardData.content} />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="focus-card-tags">
                {tags.map(tag => (
                  <span key={tag} className="focus-card-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* Reactions */}
            {Object.keys(reactions).length > 0 && (
              <div className="focus-card-reactions">
                {Object.entries(reactions).map(([emoji, data]) => {
                  if (!data || data.count <= 0) {
                    return null;
                  }
                  const isActive = data.users && user?.uid && data.users[user.uid];
                  return (
                    <FocusReaction
                      key={emoji}
                      emoji={emoji}
                      count={data.count}
                      isActive={isActive}
                    />
                  );
                })}
              </div>
            )}

            {/* Comment count */}
            {commentCount > 0 && (
              <div className="focus-card-comments">
                💬 {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Next button */}
        <button
          className="focus-nav-btn focus-nav-next"
          onClick={goNext}
          disabled={isLast}
          title="Next card (→)"
          aria-label="Next card"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Minimap */}
      <div className="focus-footer">
        <MiniMap total={totalCards} current={currentIndex} onSelect={goToIndex} />
        <div className="focus-keyboard-hint">
          ← → navigate &nbsp;·&nbsp; Space auto-play &nbsp;·&nbsp; Esc exit
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
