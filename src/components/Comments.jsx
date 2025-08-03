import React, { useState } from 'react';

const CommentEditor = ({ 
  editedComment, 
  setEditedComment, 
  saveComment, 
  cancelEdit, 
  deleteComment 
}) => (
  <div className="comment-edit" onClick={(e) => e.stopPropagation()}>
    <input
      type="text"
      value={editedComment}
      onChange={(e) => setEditedComment(e.target.value)}
      className="comment-edit-input"
      autoFocus
      onKeyPress={(e) => {
        if (e.key === 'Enter' && editedComment.trim()) {
          saveComment();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      }}
    />
    <div className="comment-edit-actions">
      <button className="btn primary-btn btn-sm" onClick={saveComment}>Save</button>
      <button className="btn secondary-btn btn-sm" onClick={cancelEdit}>Cancel</button>
      <button className="btn danger-btn btn-sm" onClick={deleteComment}>Delete</button>
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
  disabledReason = null
}) => {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  
  const startEditing = (commentId, content) => {
    // Don't allow editing if interactions are disabled
    if (interactionsDisabled) {
      // Only show message if not in frozen state (Phase 3)
      if (disabledReason !== 'frozen') {
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
  const getCommentDisabledMessage = () => {
    if (!interactionsDisabled) return null;
    // Don't show frozen message in Phase 3
    return disabledReason === 'frozen' 
      ? null
      : 'Comments are disabled until cards are revealed';
  };

  const handleAddComment = () => {
    if (interactionsDisabled) {
      // Only show alert if not in frozen state
      if (disabledReason !== 'frozen') {
        alert(getCommentDisabledMessage());
      }
      return;
    }
    if (newComment.trim()) {
      onAddComment();
    }
  };

  const confirmDelete = (commentId) => {
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
              <div 
                className={`comment-content ${isCommentAuthor(comment) && !interactionsDisabled ? 'editable' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCommentAuthor(comment)) {
                    startEditing(commentId, comment.content);
                  }
                }}
                title={
                  interactionsDisabled && disabledReason !== 'frozen'
                    ? getCommentDisabledMessage()
                    : (isCommentAuthor(comment) ? 'Click to edit' : 'Only the author can edit this comment')
                }
              >
                {comment.content}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="no-comments">No comments yet</p>
      )}

      {/* Hide comment form when interactions are frozen */}
      {disabledReason !== 'frozen' && (
        <div className="comment-form">
          <input
            type="text"
            placeholder={
              interactionsDisabled && disabledReason !== 'frozen' 
                ? getCommentDisabledMessage() 
                : "Add a comment..."
            }
            className="comment-input"
            value={newComment}
            onChange={(e) => onCommentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newComment.trim()) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            disabled={interactionsDisabled}
            title={
              interactionsDisabled && disabledReason !== 'frozen' 
                ? getCommentDisabledMessage() 
                : ""
            }
          />
        </div>
      )}
    </div>
  );
});

export default Comments;
