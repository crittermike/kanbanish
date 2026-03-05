import { ref, set } from 'firebase/database';
import { useRef, useState, useCallback } from 'react';
import { X, Clock, Play, Pause, Square, Smile } from 'react-feather';
import { useBoardContext } from '../../context/BoardContext';
import { useCardOperations } from '../../hooks/useCardOperations';
import { useCardTimer } from '../../hooks/useCardTimer';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { database } from '../../utils/firebase';
import {
  getDisabledReason
} from '../../utils/retrospectiveModeUtils';
import {
  areInteractionsAllowed,
  areInteractionsVisible,
  isCardEditingAllowed,
  shouldObfuscateCards
} from '../../utils/workflowUtils';
import CardReactions from '../CardReactions';
import Comments from '../Comments';
import EmojiPicker from '../EmojiPicker';
import MarkdownContent from '../MarkdownContent';
import VotingControls from '../VotingControls';
import '../../styles/components/card-detail-modal.css';

const formatTime = (seconds) => {
  if (seconds == null) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const CardDetailModal = ({
  isOpen,
  onClose,
  cardId,
  columnId
}) => {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, isOpen, { onClose });

  const {
    boardId,
    user,
    columns,
    votingEnabled,
    downvotingEnabled,
    multipleVotesAllowed,
    votesPerUser,
    getUserVoteCount,
    retrospectiveMode,
    workflowPhase,
    recordAction,
    undo,
    _boardTags,
    actionItems,
    actionItemsEnabled,
    _createActionItem,
    _deleteActionItem,
    presenceData,
    displayName,
    userColor,
    _showDisplayNames
  } = useBoardContext();

  // Look up card data from columns
  const columnData = columns?.[columnId];
  const cardData = columnData?.cards?.[cardId];
  const columnTitle = columnData?.title || '';

  // Card operations hook (same as Card.jsx uses)
  const {
    isEditing: _isEditing,
    editedContent: _editedContent,
    showEmojiPicker,
    newComment,
    emojiPickerPosition,
    setEditedContent: _setEditedContent,
    setShowEmojiPicker,
    setNewComment,
    setEmojiPickerPosition,
    upvoteCard,
    downvoteCard,
    hasUserReactedWithEmoji,
    addReaction,
    addComment,
    editComment,
    deleteComment,
    isCardAuthor,
    isCommentAuthor,
    setCardColor: _setCardColor,
    setCardTags: _setCardTags,
    saveCardChanges: _saveCardChanges,
    deleteCard: _deleteCard
  } = useCardOperations({
    boardId,
    columnId,
    cardId,
    cardData: cardData || {},
    user,
    multipleVotesAllowed,
    retrospectiveMode,
    workflowPhase,
    votesPerUser,
    getUserVoteCount,
    recordAction,
    undo,
    displayName,
    userColor
  });

  // Card timer hook
  const cardTimer = useCardTimer({
    boardId,
    columnId,
    cardId,
    timerData: cardData?.timer,
    user
  });

  // Local editing state for the modal (independent from Card.jsx inline editing)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');

  const disabledReason = getDisabledReason(retrospectiveMode, workflowPhase);
  const interactionsDisabled = !areInteractionsAllowed(workflowPhase, retrospectiveMode);
  const interactionsVisible = areInteractionsVisible(workflowPhase, retrospectiveMode);

  // Determine editing disabled state
  const isCreator = isCardAuthor();
  let editingDisabled = false;
  if (workflowPhase && user) {
    const editingAllowed = isCardEditingAllowed(workflowPhase, retrospectiveMode);
    if (workflowPhase === 'CREATION') {
      editingDisabled = !isCreator;
    } else if (workflowPhase === 'GROUPING') {
      editingDisabled = !editingAllowed;
    } else if (!editingAllowed) {
      editingDisabled = true;
    }
  }

  const handleEditStart = useCallback(() => {
    if (editingDisabled) return;
    setIsEditingContent(true);
    setEditContent(cardData?.content || '');
  }, [cardData?.content, editingDisabled]);

  const handleEditSave = useCallback(() => {
    if (!editContent.trim()) return;
    const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);
    set(cardRef, {
      ...cardData,
      content: editContent.trim(),
      displayName: displayName || cardData.displayName || '',
      userColor: userColor || cardData.userColor || ''
    }).catch(error => {
      console.error('Error saving card:', error);
    });
    setIsEditingContent(false);
  }, [editContent, boardId, columnId, cardId, cardData, displayName, userColor]);

  const handleEditCancel = useCallback(() => {
    setIsEditingContent(false);
    setEditContent('');
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isEditingContent) {
        e.stopPropagation();
        handleEditCancel();
      } else {
        onClose();
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (isEditingContent) {
        e.stopPropagation();
        handleEditSave();
      }
    }
  }, [isEditingContent, handleEditCancel, handleEditSave, onClose]);

  const toggleEmojiPicker = (e) => {
    if (interactionsDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiPickerPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX - 100
    });
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (_e, emoji) => {
    addReaction(null, emoji);
    setShowEmojiPicker(false);
  };

  if (!isOpen || !cardData) return null;

  // Timer derived values
  const { startCardTimer, pauseCardTimer, resumeCardTimer, resetCardTimer, remainingSeconds, isRunning, isPaused, hasTimer } = cardTimer;
  const timerClass = [hasTimer && isRunning ? 'active' : '', hasTimer && remainingSeconds !== null && remainingSeconds <= 30 && remainingSeconds > 0 ? 'warning' : remainingSeconds === 0 ? 'expired' : ''].filter(Boolean).join(' ');
  const totalDuration = cardData.timer?.duration || 0;
  const progressPercent = totalDuration > 0 && remainingSeconds !== null
    ? Math.max(0, 100 - (remainingSeconds / totalDuration) * 100)
    : 0;

  // Action items
  const actionItemEntry = actionItemsEnabled && actionItems && Object.entries(actionItems).find(
    ([_id, item]) => item.sourceCardId === cardId && item.sourceColumnId === columnId
  );
  const _hasActionItem = !!actionItemEntry;
  const _actionItemId = actionItemEntry ? actionItemEntry[0] : null;

  // Obfuscation check
  const showObfuscated = shouldObfuscateCards(workflowPhase, retrospectiveMode) && !isCreator;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="modal-container card-detail-modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-title"
      >
        <div className="card-detail-header">
          <div className="card-detail-column-badge">{columnTitle}</div>
          <button className="close-button" onClick={onClose} aria-label="Close" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <div className="card-detail-body">
          <div className="card-detail-main">
            {/* Main Content Area */}
          <section className="card-detail-section">
            <h3 id="card-detail-title" className="visually-hidden">Card Details</h3>

            <div
              className="card-detail-content"
              style={{ '--card-color': cardData.color || 'var(--accent, #0052cc)' }}
            >
              {isEditingContent ? (
                <div className="card-detail-edit-container">
                  <textarea
                    className="card-detail-content-edit"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                    placeholder="Enter card content..."
                  />
                  <div className="card-detail-edit-actions">
                    <button
                      className="btn success-btn"
                      onClick={handleEditSave}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </button>
                    <button className="btn secondary-btn" onClick={handleEditCancel}>
                      Cancel
                    </button>
                    <span className="card-detail-edit-hint">
                      {editContent.length} chars • Ctrl+Enter to save
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="card-detail-content-display"
                  onClick={handleEditStart}
                  title={editingDisabled ? disabledReason || 'Editing disabled' : 'Click to edit'}
                  style={{ cursor: editingDisabled ? 'default' : 'pointer' }}
                >
                  {showObfuscated ? (
                    <span className="obfuscated">Content hidden</span>
                  ) : (
                    <MarkdownContent content={cardData.content} />
                  )}
                </div>
              )}
            </div>

          </section>
          {/* Comments Section */}
          <section className="card-detail-section">
            <h4 className="card-detail-section-title">Comments ({cardData.comments ? Object.keys(cardData.comments).length : 0})</h4>
            <div className="card-detail-comments">
              <Comments
                comments={cardData.comments}
                onAddComment={addComment}
                newComment={newComment}
                onCommentChange={setNewComment}
                onEditComment={editComment}
                onDeleteComment={deleteComment}
                isCommentAuthor={isCommentAuthor}
                interactionsDisabled={interactionsDisabled}
                disabledReason={disabledReason}
                presenceData={presenceData}
              />
            </div>
          </section>
        </div>

        <div className="card-detail-sidebar">
          {/* Timer Section */}
          <section className="card-detail-section">
            <h4 className="card-detail-section-title"><Clock size={14} /> Timer</h4>
            <div className="card-detail-timer">
              <div className="card-detail-timer-display-wrapper">
                <div className={`card-detail-timer-display ${timerClass}`}>
                  {formatTime(remainingSeconds)}
                </div>

                <div className="card-detail-timer-presets">
                  <button className="card-detail-timer-btn" onClick={() => startCardTimer(60)} disabled={isRunning && !isPaused}>1m</button>
                  <button className="card-detail-timer-btn" onClick={() => startCardTimer(180)} disabled={isRunning && !isPaused}>3m</button>
                  <button className="card-detail-timer-btn" onClick={() => startCardTimer(300)} disabled={isRunning && !isPaused}>5m</button>
                  <button className="card-detail-timer-btn" onClick={() => startCardTimer(600)} disabled={isRunning && !isPaused}>10m</button>
                </div>
              </div>

              <div className="card-detail-timer-controls">
                {hasTimer && isRunning && (
                  <button className="card-detail-timer-btn icon-only" onClick={pauseCardTimer} title="Pause">
                    <Pause size={16} />
                  </button>
                )}
                {hasTimer && isPaused && (
                  <button className="card-detail-timer-btn icon-only" onClick={resumeCardTimer} title="Resume">
                    <Play size={16} />
                  </button>
                )}
                {hasTimer && (
                  <button className="card-detail-timer-btn icon-only" onClick={resetCardTimer} title="Reset">
                    <Square size={16} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {hasTimer && (
                <div className="card-detail-timer-progress">
                  <div
                    className={`card-detail-timer-progress-bar ${timerClass}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Voting & Reactions */}
          <section className="card-detail-section card-detail-interactions">
            {votingEnabled && (
              <div className="card-detail-votes">
                <h4 className="card-detail-section-title">Votes</h4>
                <VotingControls
                  votes={cardData.votes}
                  onUpvote={upvoteCard}
                  onDownvote={downvoteCard}
                  showDownvoteButton={downvotingEnabled}
                  disabled={interactionsDisabled}
                  disabledReason={disabledReason}
                />
              </div>
            )}

            <div className="card-detail-reactions-container">
              <h4 className="card-detail-section-title">Reactions</h4>
              {interactionsVisible ? (
                <div className="card-detail-reactions-row">
                  <CardReactions
                    reactions={cardData.reactions}
                    userId={user?.uid}
                    addReaction={addReaction}
                    disabled={interactionsDisabled}
                    disabledReason={disabledReason}
                  />
                  {!cardData.reactions && (
                    <span className="card-detail-reactions-empty">No reactions yet</span>
                  )}
                  {!interactionsDisabled && (
                    <button
                      className="card-detail-add-reaction-btn"
                      onClick={toggleEmojiPicker}
                      title="Add reaction"
                    >
                      <Smile size={14} /> Add
                    </button>
                  )}
                </div>
              ) : (
                <div className="card-detail-hidden-notice">
                  Reactions hidden in this phase
                </div>
              )}
            </div>
          </section>

          {/* Tags */}
          {cardData.tags && cardData.tags.length > 0 && (
            <section className="card-detail-section">
              <h4 className="card-detail-section-title">Tags</h4>
              <div className="card-detail-tags">
                {cardData.tags.map(tag => (
                  <span key={tag} className="card-detail-tag">{tag}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <EmojiPicker
          position={emojiPickerPosition}
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          hasUserReactedWithEmoji={hasUserReactedWithEmoji}
        />
      )}
    </div>
  );
};

export default CardDetailModal;
