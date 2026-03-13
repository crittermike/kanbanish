import React, { useState, useRef } from 'react';
import { useBoardContext } from '../context/BoardContext';
import useEmojiAutocomplete from '../hooks/useEmojiAutocomplete';
import { getInitials } from '../utils/avatarColors';
import { shouldHideFeature, getCommentDisabledMessage } from '../utils/retrospectiveModeUtils';
import EmojiAutocomplete from './EmojiAutocomplete';
import MarkdownContent from './MarkdownContent';

const CommentEditor = ({
  editedComment,
  setEditedComment,
  saveComment,
  cancelEdit,
  deleteComment
}) => (
  <div className="comment-edit" onClick={e => e.stopPropagation()}>
    <input
      type="text"
      value={editedComment}
      onChange={e => setEditedComment(e.target.value)}
      className="comment-edit-input"
      autoFocus
      aria-label="Edit comment"
      onKeyPress={e => {
        if (e.key === 'Enter' && editedComment.trim()) {
          saveComment();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      }}
    />
    <div className="comment-edit-actions">
      <button className="btn danger-btn btn-sm" onClick={deleteComment}>Delete</button>
      <button className="btn secondary-btn btn-sm" onClick={cancelEdit}>Cancel</button>
      <button className="btn success-btn btn-sm" onClick={saveComment}>Save</button>
    </div>
  </div>
);

const Comments = React.memo(({
  comments,
  onAddComment,
  newComment,
  onCommentChange,
  onEditComment,
  onDeleteComment,
  isCommentAuthor,
  interactionsDisabled = false,
  disabledReason = null,
  presenceData = {}
}) => {
  const { showDisplayNames } = useBoardContext();
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const commentInputRef = useRef(null);

  // Wrapper setter so the hook can call onCommentChange
  const setCommentValue = (val) => onCommentChange(val);
  const emojiAC = useEmojiAutocomplete(newComment, setCommentValue, commentInputRef);

  // Use utility functions for consistent logic
  const shouldShowAlert = !shouldHideFeature(disabledReason);
  const hideCommentForm = shouldHideFeature(disabledReason);

  const startEditing = (commentId, content) => {
    // Don't allow editing if interactions are disabled
    if (interactionsDisabled) {
      // Only show message if not in frozen state (Phase 3)
      if (shouldShowAlert) {
        const message = 'Comment editing is disabled until cards are revealed';
        alert(message);
      }
      return;
    }

    setEditingCommentId(commentId);
    setEditedContent(content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const saveComment = () => {
    if (editedContent.trim()) {
      onEditComment(editingCommentId, editedContent);
      cancelEdit();
    }
  };

  // Get appropriate disabled message for comments
  const commentDisabledMessage = getCommentDisabledMessage(disabledReason);

  const handleAddComment = () => {
    if (interactionsDisabled) {
      // Only show alert if not in frozen state
      if (shouldShowAlert && commentDisabledMessage) {
        alert(commentDisabledMessage);
      }
      return;
    }
    if (newComment.trim()) {
      onAddComment();
    }
  };

  const confirmDelete = commentId => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDeleteComment(commentId);
    }
  };

  return (
    <div className="comments-section">
      <h4>Comments</h4>
      {comments && Object.entries(comments).length > 0 ? (
        Object.entries(comments).map(([commentId, comment]) => (
          <div key={commentId} className="comment">
            {editingCommentId === commentId ? (
              <CommentEditor
                editedComment={editedContent}
                setEditedComment={setEditedContent}
                saveComment={saveComment}
                cancelEdit={cancelEdit}
                deleteComment={() => confirmDelete(commentId)}
              />
            ) : (
              <>
                {showDisplayNames && (
                  <div className="comment-author">
                    <div 
                      className="comment-author-avatar" 
                      style={{ 
                        backgroundColor: presenceData?.[comment.createdBy]?.color || comment.userColor || comment.color || 'var(--text-muted)' 
                      }}
                    >
                      {getInitials(presenceData?.[comment.createdBy]?.displayName || comment.displayName || 'Anonymous')}
                    </div>
                    <span className="comment-author-name">
                      {presenceData?.[comment.createdBy]?.displayName || comment.displayName || 'Anonymous'}
                    </span>
                  </div>
                )}
                <div
                className={`comment-content ${isCommentAuthor(comment) && !interactionsDisabled ? 'editable' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  if (isCommentAuthor(comment)) {
                    startEditing(commentId, comment.content);
                  }
                }}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && isCommentAuthor(comment)) {
                    e.preventDefault();
                    e.stopPropagation();
                    startEditing(commentId, comment.content);
                  }
                }}
                role={isCommentAuthor(comment) && !interactionsDisabled ? 'button' : undefined}
                tabIndex={isCommentAuthor(comment) && !interactionsDisabled ? 0 : undefined}
                title={
                  interactionsDisabled && shouldShowAlert
                    ? commentDisabledMessage
                    : (isCommentAuthor(comment) ? 'Click to edit' : 'Only the author can edit this comment')
                }
                >
                  <MarkdownContent content={comment.content} />
                </div>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="no-comments">No comments yet</p>
      )}

      {/* Hide comment form when interactions are frozen */}
      {!hideCommentForm && (
        <div className="comment-form">
          <input
            ref={commentInputRef}
            type="text"
            placeholder={
              interactionsDisabled && shouldShowAlert
                ? commentDisabledMessage
                : 'Add a comment...'
            }
            className="comment-input"
            aria-label="Add a comment"
            value={newComment}
            onChange={e => {
              onCommentChange(e.target.value);
              emojiAC.onChange();
            }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (emojiAC.isOpen) {
                emojiAC.onKeyDown(e);
                if (e.defaultPrevented) return;
              }
              if (e.key === 'Enter' && newComment.trim()) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            disabled={interactionsDisabled}
            title={
              interactionsDisabled && shouldShowAlert
                ? commentDisabledMessage
                : ''
            }
          />
          <EmojiAutocomplete
            suggestions={emojiAC.suggestions}
            selectedIndex={emojiAC.selectedIndex}
            onSelect={emojiAC.onSelect}
            inputRef={commentInputRef}
          />
        </div>
      )}
    </div>
  );
});

export default Comments;
