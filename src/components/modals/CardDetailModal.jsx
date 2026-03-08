import { ref, set } from 'firebase/database';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { X, Clock, Smile, ChevronLeft, ChevronRight, Droplet, Tag, CheckSquare } from 'react-feather';
import { useBoardContext } from '../../context/BoardContext';
import { useCardOperations } from '../../hooks/useCardOperations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { database } from '../../utils/firebase';
import {
  filterVisibleInteractionData,
  getDisabledReason
} from '../../utils/retrospectiveModeUtils';
import {
  areCommentsAllowed,
  areInteractionsAllowed,
  areInteractionsVisible,
  areOthersInteractionsVisible,
  areReactionsAllowed,
  areReactionsVisible,
  areReviewToolsVisible,
  isCardMetadataEditingAllowed,
  isCardEditingAllowed,
  shouldObfuscateCards
} from '../../utils/workflowUtils';
import CardColorPicker from '../CardColorPicker';
import CardReactions from '../CardReactions';
import CardTagPicker from '../CardTagPicker';
import CardTimerControls from '../CardTimerControls';
import Comments from '../Comments';
import EmojiPicker from '../EmojiPicker';
import MarkdownContent from '../MarkdownContent';
import VotingControls from '../VotingControls';
import '../../styles/components/card-detail-modal.css';

const CardDetailModal = ({
  isOpen,
  onClose,
  cardId,
  columnId,
  onNavigateCard,
  cardList = null,
  contextLabel = ''
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
    boardTags,
    actionItems,
    actionItemsEnabled,
    createActionItem,
    deleteActionItem,
    presenceData,
    displayName,
    userColor,
    sortByVotes,
    detailNavigationHintsDismissed,
    updateBoardSettings
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
    setCardColor,
    setCardTags
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

  // Local editing state for the modal (independent from Card.jsx inline editing)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const [tagPickerPosition, setTagPickerPosition] = useState({ top: 0, left: 0 });
  const colorButtonRef = useRef(null);
  const tagButtonRef = useRef(null);

  const disabledReason = getDisabledReason(retrospectiveMode, workflowPhase);
  const interactionsDisabled = !areInteractionsAllowed(workflowPhase, retrospectiveMode);
  const interactionsVisible = areInteractionsVisible(workflowPhase, retrospectiveMode);
  const reactionsVisible = areReactionsVisible(workflowPhase, retrospectiveMode);
  const reactionsDisabled = !areReactionsAllowed(workflowPhase, retrospectiveMode);
  const reactionDisabledReason = reactionsDisabled ? 'cards-not-revealed' : null;
  const reviewToolsVisible = areReviewToolsVisible(workflowPhase, retrospectiveMode);
  const commentsAllowed = areCommentsAllowed(workflowPhase, retrospectiveMode);
  const metadataEditingAllowed = isCardMetadataEditingAllowed(workflowPhase, retrospectiveMode);

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
  // Pager data
  const allCardsList = useMemo(() => {
    if (cardList?.length) {
      return cardList.filter(({ cardId: listedCardId, columnId: listedColumnId }) =>
        columns?.[listedColumnId]?.cards?.[listedCardId]
      );
    }
    if (!columns) return [];
    const list = [];
    // Sort columns by ID
    const sortedCols = Object.entries(columns).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [colId, colData] of sortedCols) {
      if (!colData.cards) continue;
      // Get ungrouped cards
      const ungrouped = Object.entries(colData.cards)
        .filter(([_id, data]) => !data.groupId)
        .map(([id, data]) => ({ id, colId, ...data }));
      // Get groups
      const groups = colData.groups
        ? Object.entries(colData.groups).map(([id, data]) => ({ id, colId, ...data, _isGroup: true }))
        : [];
      // Combine and sort (same as Column.jsx getSortedItems)
      const items = [];
      if (sortByVotes) {
        items.push(...[...ungrouped.map(c => ({ type: 'card', data: c })), ...groups.map(g => ({ type: 'group', data: g }))].sort((a, b) => (b.data.votes || 0) - (a.data.votes || 0)));
      } else {
        items.push(...[...groups.map(g => ({ type: 'group', data: g })), ...ungrouped.map(c => ({ type: 'card', data: c }))].sort((a, b) => (b.data.created || 0) - (a.data.created || 0)));
      }
      // Flatten: ungrouped cards directly, group cards in cardIds order
      for (const item of items) {
        if (item.type === 'card') {
          list.push({ cardId: item.data.id, columnId: colId });
        } else {
          // Group: iterate cardIds to get cards in group order
          const group = item.data;
          if (group.cardIds && colData.cards) {
            for (const cId of group.cardIds) {
              if (colData.cards[cId]) {
                list.push({ cardId: cId, columnId: colId });
              }
            }
          }
        }
      }
    }
    return list;
  }, [cardList, columns, sortByVotes]);

  const currentIndex = allCardsList.findIndex(c => c.cardId === cardId && c.columnId === columnId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allCardsList.length - 1;
  const pagerIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  const handleNavigate = useCallback((direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < allCardsList.length) {
      onNavigateCard(allCardsList[targetIndex].cardId, allCardsList[targetIndex].columnId);
    }
  }, [currentIndex, allCardsList, onNavigateCard]);

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

  useEffect(() => {
    setIsEditingContent(false);
    setEditContent('');
    setShowEmojiPicker(false);
    setShowColorPicker(false);
    setShowTagPicker(false);
  }, [cardId, columnId, setShowEmojiPicker]);

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
    } else if (e.key === 'ArrowLeft' && !isEditingContent) {
      if (hasPrev) handleNavigate(-1);
    } else if (e.key === 'ArrowRight' && !isEditingContent) {
      if (hasNext) handleNavigate(1);
    }
  }, [isEditingContent, handleEditCancel, handleEditSave, onClose, hasPrev, hasNext, handleNavigate]);

  const toggleEmojiPicker = (e) => {
    if (reactionsDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiPickerPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX - 100
    });
    setShowEmojiPicker(!showEmojiPicker);
  };

  const openColorPicker = useCallback((e) => {
    if (!metadataEditingAllowed || !colorButtonRef.current) {
      return;
    }
    e.stopPropagation();
    const rect = colorButtonRef.current.getBoundingClientRect();
    setColorPickerPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setShowColorPicker(!showColorPicker);
    setShowTagPicker(false);
    setShowEmojiPicker(false);
  }, [metadataEditingAllowed, setShowEmojiPicker, showColorPicker]);

  const openTagPicker = useCallback((e) => {
    if (!metadataEditingAllowed || !tagButtonRef.current) {
      return;
    }
    e.stopPropagation();
    const rect = tagButtonRef.current.getBoundingClientRect();
    setTagPickerPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setShowTagPicker(!showTagPicker);
    setShowColorPicker(false);
    setShowEmojiPicker(false);
  }, [metadataEditingAllowed, setShowEmojiPicker, showTagPicker]);

  const handleEmojiSelect = (_e, emoji) => {
    addReaction(null, emoji);
    setShowEmojiPicker(false);
  };

  const dismissNavigationHints = useCallback((e) => {
    e.stopPropagation();
    updateBoardSettings({ detailNavigationHintsDismissed: true });
  }, [updateBoardSettings]);

  if (!isOpen || !cardData) return null;

  // Action items
  const actionItemEntry = actionItemsEnabled && actionItems && Object.entries(actionItems).find(
    ([_id, item]) => item.sourceCardId === cardId && item.sourceColumnId === columnId
  );
  const hasActionItem = !!actionItemEntry;
  const actionItemId = actionItemEntry ? actionItemEntry[0] : null;

  // Obfuscation check
  const showObfuscated = shouldObfuscateCards(workflowPhase, retrospectiveMode) && !isCreator;
  const shouldHideOthersInteractions = retrospectiveMode && !areOthersInteractionsVisible(workflowPhase, retrospectiveMode);
  const displayCardData = filterVisibleInteractionData(cardData, user?.uid, shouldHideOthersInteractions);
  const reviewCommentCount = Object.keys(displayCardData.comments || {}).length;
  const reviewCardListSize = allCardsList.length;
  const showNavigationHints = reviewCardListSize > 1 && !detailNavigationHintsDismissed;

  const handleConvertToActionItem = () => {
    if (!createActionItem || !cardData) {
      return;
    }
    createActionItem({
      description: cardData.content,
      sourceCardId: cardId,
      sourceColumnId: columnId
    });
  };

  const handleRemoveActionItem = () => {
    if (actionItemId && deleteActionItem) {
      deleteActionItem(actionItemId);
    }
  };


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
          <div className="card-detail-header-meta">
            <div className="card-detail-column-badge">{columnTitle}</div>
            {contextLabel && (
              <div className="card-detail-context-badge">{contextLabel}</div>
            )}
          </div>
          {reviewCardListSize > 1 && (
            <div className="card-detail-pager">
              <button
                className="card-detail-pager-btn"
                onClick={() => handleNavigate(-1)}
                disabled={!hasPrev}
                aria-label="Previous card"
                title="Previous card (←)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="card-detail-pager-count">
                {pagerIndex} / {reviewCardListSize}
              </span>
              <button
                className="card-detail-pager-btn"
                onClick={() => handleNavigate(1)}
                disabled={!hasNext}
                aria-label="Next card"
                title="Next card (→)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button className="close-button" onClick={onClose} aria-label="Close" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <div className="card-detail-body">
          <section className="card-detail-section">
            <h3 id="card-detail-title" className="visually-hidden">Card Details</h3>
            {showNavigationHints && (
              <div className="card-detail-toolbar">
                <span className="card-detail-shortcuts">Use ← and → to review cards</span>
                <button
                  className="card-detail-toolbar-dismiss"
                  onClick={dismissNavigationHints}
                  aria-label="Dismiss review tips"
                  title="Dismiss review tips for this board"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div
              className="card-detail-content"
              style={{ '--card-color': displayCardData.color || 'var(--accent, #0052cc)' }}
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
                    <MarkdownContent content={displayCardData.content} />
                  )}
                </div>
              )}
            </div>

            {displayCardData.tags && displayCardData.tags.length > 0 && (
              <div className="card-detail-tags">
                {displayCardData.tags.map(tag => (
                  <span key={tag} className="card-detail-tag">{tag}</span>
                ))}
              </div>
            )}
          </section>

          {reviewToolsVisible && (
            <section className="card-detail-section">
              <h4 className="card-detail-section-title">Review tools</h4>
              <div className="card-detail-review-actions">
                <button
                  className="card-detail-meta-btn color-action"
                  onClick={openColorPicker}
                  ref={colorButtonRef}
                  disabled={!metadataEditingAllowed}
                  title={metadataEditingAllowed ? 'Set card color' : 'Labels and colors are unavailable until cards are revealed'}
                >
                  <Droplet size={14} />
                  {displayCardData.color ? 'Change color' : 'Add color'}
                </button>
                <button
                  className="card-detail-meta-btn tag-action"
                  onClick={openTagPicker}
                  ref={tagButtonRef}
                  disabled={!metadataEditingAllowed}
                  title={metadataEditingAllowed ? 'Manage labels' : 'Labels and colors are unavailable until cards are revealed'}
                >
                  <Tag size={14} />
                  {displayCardData.tags?.length ? `${displayCardData.tags.length} label${displayCardData.tags.length === 1 ? '' : 's'}` : 'Add labels'}
                </button>
                {actionItemsEnabled && (
                  <button
                    className={`card-detail-meta-btn ${hasActionItem ? 'active' : ''}`}
                    onClick={hasActionItem ? handleRemoveActionItem : handleConvertToActionItem}
                    disabled={!metadataEditingAllowed}
                    title={hasActionItem ? 'Remove action item' : 'Convert to action item'}
                  >
                    <CheckSquare size={14} />
                    {hasActionItem ? 'Action item' : 'Make action item'}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Timer Section */}
          <section className="card-detail-section">
            <h4 className="card-detail-section-title"><Clock size={14} /> Timer</h4>
            <CardTimerControls
              boardId={boardId}
              columnId={columnId}
              cardId={cardId}
              timerData={cardData.timer}
              user={user}
            />
          </section>

          {/* Voting & Reactions */}
          <section className="card-detail-section card-detail-interactions">
            {votingEnabled && interactionsVisible ? (
              <div className="card-detail-votes">
                <h4 className="card-detail-section-title">Votes</h4>
                <VotingControls
                  votes={displayCardData.votes}
                  onUpvote={upvoteCard}
                  onDownvote={downvoteCard}
                  showDownvoteButton={downvotingEnabled}
                  disabled={interactionsDisabled}
                  disabledReason={disabledReason}
                />
              </div>
            ) : votingEnabled ? (
              <div className="card-detail-votes">
                <h4 className="card-detail-section-title">Votes</h4>
                <div className="card-detail-hidden-notice">
                  Voting is hidden until the interaction phase.
                </div>
              </div>
            ) : null}

            {reactionsVisible ? (
              <div className="card-detail-reactions-container">
                <h4 className="card-detail-section-title">Reactions</h4>
                <div className="card-detail-reactions-row">
                  <CardReactions
                    reactions={displayCardData.reactions}
                    userId={user?.uid}
                    addReaction={addReaction}
                    disabled={reactionsDisabled}
                    disabledReason={reactionDisabledReason}
                  />
                  {!displayCardData.reactions || Object.keys(displayCardData.reactions).length === 0 ? (
                    <span className="card-detail-reactions-empty">No reactions yet</span>
                  ) : null}
                  {!reactionsDisabled && (
                    <button
                      className="card-detail-add-reaction-btn"
                      onClick={toggleEmojiPicker}
                      aria-label="Add reaction"
                      title="Add reaction"
                    >
                      <Smile size={14} /> Add
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card-detail-reactions-container">
                <h4 className="card-detail-section-title">Reactions</h4>
                <div className="card-detail-hidden-notice">
                  Reactions are available once cards are revealed.
                </div>
              </div>
            )}
          </section>

          {reviewToolsVisible && (
            <section className="card-detail-section">
              <h4 className="card-detail-section-title">Comments ({reviewCommentCount})</h4>
              <div className="card-detail-comments">
                <Comments
                  comments={displayCardData.comments}
                  onAddComment={addComment}
                  newComment={newComment}
                  onCommentChange={setNewComment}
                  onEditComment={editComment}
                  onDeleteComment={deleteComment}
                  isCommentAuthor={isCommentAuthor}
                  interactionsDisabled={!commentsAllowed}
                  disabledReason={!commentsAllowed ? 'cards-not-revealed' : null}
                  presenceData={presenceData}
                />
              </div>
            </section>
          )}
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
      {showColorPicker && (
        <CardColorPicker
          position={colorPickerPosition}
          onColorSelect={setCardColor}
          onClose={() => setShowColorPicker(false)}
          currentColor={displayCardData.color}
        />
      )}
      {showTagPicker && (
        <CardTagPicker
          position={tagPickerPosition}
          onTagAdd={tag => setCardTags([...(displayCardData.tags || []), tag])}
          onTagRemove={tag => setCardTags((displayCardData.tags || []).filter(existingTag => existingTag !== tag))}
          currentTags={displayCardData.tags || []}
          boardTags={boardTags}
          onClose={() => setShowTagPicker(false)}
        />
      )}
    </div>
  );
};

export default CardDetailModal;
