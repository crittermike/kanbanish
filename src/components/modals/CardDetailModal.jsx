import { ref, remove, set } from 'firebase/database';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  X, CheckSquare, Tag,
  AlignLeft, MessageSquare,
  Plus, Sliders
} from 'react-feather';
import { useBoardContext } from '../../context/BoardContext';
import { useCardOperations } from '../../hooks/useCardOperations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { getInitials } from '../../utils/avatarColors';
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
import '../../styles/components/card-detail-modal.css';

const CardDetailModal = ({
  isOpen,
  onClose,
  cardId,
  columnId,
  onNavigateCard,
  cardList = null,
  contextLabel = '',
  inline = false
}) => {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, isOpen && !inline, { onClose });

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
    updateBoardSettings,
    showDisplayNames
  } = useBoardContext();

  const columnData = columns?.[columnId];
  const cardData = columnData?.cards?.[cardId];
  const columnTitle = columnData?.title || '';

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
    setCardTags,
    deleteCard
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

  // Local state
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const [tagPickerPosition, setTagPickerPosition] = useState({ top: 0, left: 0 });
  const [description, setDescription] = useState('');
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

  // Pager data (keyboard navigation)
  const allCardsList = useMemo(() => {
    if (cardList?.length) {
      return cardList.filter(({ cardId: listedCardId, columnId: listedColumnId }) =>
        columns?.[listedColumnId]?.cards?.[listedCardId]
      );
    }
    if (!columns) return [];
    const list = [];
    const sortedCols = Object.entries(columns).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [colId, colData] of sortedCols) {
      if (!colData.cards) continue;
      const ungrouped = Object.entries(colData.cards)
        .filter(([_id, data]) => !data.groupId)
        .map(([id, data]) => ({ id, colId, ...data }));
      const groups = colData.groups
        ? Object.entries(colData.groups).map(([id, data]) => ({ id, colId, ...data, _isGroup: true }))
        : [];
      const items = [];
      if (sortByVotes) {
        items.push(...[...ungrouped.map(c => ({ type: 'card', data: c })), ...groups.map(g => ({ type: 'group', data: g }))].sort((a, b) => (b.data.votes || 0) - (a.data.votes || 0)));
      } else {
        items.push(...[...groups.map(g => ({ type: 'group', data: g })), ...ungrouped.map(c => ({ type: 'card', data: c }))].sort((a, b) => (b.data.created || 0) - (a.data.created || 0)));
      }
      for (const item of items) {
        if (item.type === 'card') {
          list.push({ cardId: item.data.id, columnId: colId });
        } else {
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
  const reviewCardListSize = allCardsList.length;
  const showNavigationHints = reviewCardListSize > 1 && !detailNavigationHintsDismissed;

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

  const handleDescriptionSave = useCallback(() => {
    const trimmed = description.trim();
    const original = cardData?.description || '';
    if (trimmed === original) return;
    const descRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/description`);
    if (trimmed) {
      set(descRef, trimmed);
    } else {
      remove(descRef);
    }
  }, [description, cardData?.description, boardId, columnId, cardId]);

  useEffect(() => {
    setIsEditingContent(false);
    setEditContent('');
    setShowEmojiPicker(false);
    setShowColorPicker(false);
    setShowTagPicker(false);
    setDescription(cardData?.description || '');
  }, [cardId, columnId, setShowEmojiPicker, cardData?.description]);

  const handleKeyDown = useCallback((e) => {
    const isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
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
    } else if (e.key === 'ArrowLeft' && !isEditingContent && !isInInput) {
      if (hasPrev) handleNavigate(-1);
    } else if (e.key === 'ArrowRight' && !isEditingContent && !isInInput) {
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
    if (!metadataEditingAllowed || !colorButtonRef.current) return;
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
    if (!metadataEditingAllowed || !tagButtonRef.current) return;
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

  const handleConvertToActionItem = () => {
    if (!createActionItem || !cardData) return;
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

  const headerContent = (
    <div className="card-detail-header">
      <div className="card-detail-header-meta">
        <span className="card-detail-column-badge">{contextLabel || columnTitle}</span>
      </div>
      {!inline && (
        <div className="card-detail-header-actions">
          <button className="close-button" onClick={onClose} aria-label="Close" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );

  const popovers = (
    <>
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
    </>
  );

  const bodyContent = (
    <div className="card-detail-body">
      {/* Left: main content */}
      <div className="card-detail-main">
        {showNavigationHints && (
          <div className="card-detail-nav-hints">
            <span>Use ← and → to review cards</span>
            <button
              onClick={dismissNavigationHints}
              aria-label="Dismiss review tips"
              title="Dismiss review tips for this board"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Title */}
        <div
          className="card-detail-title-section"
          style={{ '--card-color': displayCardData.color || undefined }}
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
                <button className="btn danger-btn" onClick={() => { deleteCard(); if (onClose) onClose(); }}>Delete</button>
                <button className="btn secondary-btn" onClick={handleEditCancel}>Cancel</button>
                <button
                  className="btn success-btn"
                  onClick={handleEditSave}
                  disabled={!editContent.trim()}
                >
                  Save
                </button>
                <span className="card-detail-edit-hint">
                  {editContent.length} chars • Ctrl+Enter to save
                </span>
              </div>
            </div>
          ) : (
            <>
              <h2
                id="card-detail-title"
                className="card-detail-title"
                onClick={handleEditStart}
                title={editingDisabled ? disabledReason || 'Editing disabled' : 'Click to edit'}
                style={{ cursor: editingDisabled ? 'default' : 'pointer' }}
              >
                {showObfuscated ? (
                  <span className="obfuscated">Content hidden</span>
                ) : (
                  <MarkdownContent content={displayCardData.content} />
                )}
              </h2>
              <p className="card-detail-subtitle">
                In list <span className="card-detail-column-link">{columnTitle}</span>
              </p>
            </>
          )}
        </div>

        {displayCardData.tags && displayCardData.tags.length > 0 && (
          <div className="card-detail-tags">
            {displayCardData.tags.map(tag => (
              <span key={tag} className="card-detail-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="card-detail-description-section">
          <div className="card-detail-section-header">
            <AlignLeft size={18} />
            <h3>Description</h3>
          </div>
          <textarea
            className="card-detail-description-input"
            placeholder="Add a more detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            disabled={editingDisabled}
          />
        </div>

        {/* Activity */}
        <div className="card-detail-activity-section">
          <div className="card-detail-section-header">
            <MessageSquare size={18} />
            <h3>Activity</h3>
          </div>

          <div className="card-detail-comment-area">
            {showDisplayNames && (
              <div
                className="card-detail-user-avatar"
                style={{ backgroundColor: userColor || 'var(--accent, #58a6ff)' }}
              >
                {getInitials(displayName || 'Anonymous')}
              </div>
            )}
            <div className="card-detail-comment-input-wrapper">
              <input
                type="text"
                className="card-detail-comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    e.preventDefault();
                    e.stopPropagation();
                    addComment();
                  }
                }}
                disabled={!commentsAllowed}
              />
            </div>
          </div>

          {reviewToolsVisible && (
            <div className="card-detail-comments">
              <Comments
                comments={displayCardData.comments}
                onAddComment={addComment}
                newComment=""
                onCommentChange={() => {}}
                onEditComment={editComment}
                onDeleteComment={deleteComment}
                isCommentAuthor={isCommentAuthor}
                interactionsDisabled={!commentsAllowed}
                disabledReason={!commentsAllowed ? 'cards-not-revealed' : null}
                presenceData={presenceData}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: sidebar */}
      <div className="card-detail-sidebar">
        {actionItemsEnabled && (
          <button
            className={`card-detail-convert-btn ${hasActionItem ? 'active' : ''}`}
            onClick={hasActionItem ? handleRemoveActionItem : handleConvertToActionItem}
            disabled={!metadataEditingAllowed}
          >
            <CheckSquare size={18} />
            {hasActionItem ? 'Action Item ✓' : 'Convert to Action'}
          </button>
        )}

        {/* Timer */}
        <div className="card-detail-sidebar-section">
          <h4 className="card-detail-sidebar-label">ACTIVE TIMER</h4>
          <div className="card-detail-timer-card">
            <CardTimerControls
              boardId={boardId}
              columnId={columnId}
              cardId={cardId}
              timerData={cardData.timer}
              user={user}
              className="card-detail-timer-sidebar"
            />
          </div>
        </div>

        {/* Reactions */}
        {reactionsVisible && (
          <div className="card-detail-sidebar-section">
            <h4 className="card-detail-sidebar-label">REACTIONS</h4>
            <div className="card-detail-sidebar-reactions">
              <CardReactions
                reactions={displayCardData.reactions}
                userId={user?.uid}
                addReaction={addReaction}
                disabled={reactionsDisabled}
                disabledReason={reactionDisabledReason}
              />
              {!reactionsDisabled && (
                <button
                  className="card-detail-add-reaction-circle"
                  onClick={toggleEmojiPicker}
                  aria-label="Add reaction"
                  title="Add reaction"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Votes */}
        {votingEnabled && interactionsVisible && (
          <div className="card-detail-sidebar-votes-row">
            <span className="card-detail-sidebar-votes-label">Votes</span>
            <div className="card-detail-sidebar-votes-controls">
              <button
                className="card-detail-vote-btn"
                onClick={interactionsDisabled ? undefined : upvoteCard}
                disabled={interactionsDisabled}
                aria-label="Upvote"
                title={interactionsDisabled ? disabledReason : 'Upvote'}
              >
                ▲
              </button>
              <span className="card-detail-sidebar-vote-count">{displayCardData.votes || 0}</span>
              {downvotingEnabled && (
                <button
                  className="card-detail-vote-btn"
                  onClick={interactionsDisabled ? undefined : downvoteCard}
                  disabled={interactionsDisabled}
                  aria-label="Downvote"
                  title={interactionsDisabled ? disabledReason : 'Downvote'}
                >
                  ▼
                </button>
              )}
            </div>
          </div>
        )}

        <div className="card-detail-sidebar-divider" />

        <button
          className="card-detail-sidebar-menu-item"
          onClick={openTagPicker}
          ref={tagButtonRef}
          disabled={!metadataEditingAllowed}
        >
          <Tag size={18} /> Labels
        </button>
        <button
          className="card-detail-sidebar-menu-item"
          onClick={openColorPicker}
          ref={colorButtonRef}
          disabled={!metadataEditingAllowed}
        >
          <Sliders size={18} /> Color
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div
        ref={modalRef}
        className="card-detail-inline"
        onKeyDown={handleKeyDown}
      >
        {headerContent}
        {bodyContent}
        {popovers}
      </div>
    );
  }

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
        {headerContent}
        {bodyContent}
      </div>
      {popovers}
    </div>
  );
};

export default CardDetailModal;
