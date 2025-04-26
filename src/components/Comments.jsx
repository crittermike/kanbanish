import React from 'react';

const Comments = React.memo(({ 
  comments, 
  onAddComment, 
  newComment, 
  onCommentChange 
}) => {
  return (
    <div className="comments-section">
      <h4>Comments</h4>
      {comments && Object.entries(comments).length > 0 ? (
        Object.entries(comments).map(([commentId, comment]) => (
          <div key={commentId} className="comment">
            <div className="comment-content">{comment.content}</div>
          </div>
        ))
      ) : (
        <p className="no-comments">No comments yet</p>
      )}

      <div className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          className="comment-input"
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && newComment.trim()) {
              e.preventDefault();
              onAddComment();
            }
          }}
        />
      </div>
    </div>
  );
});

export default Comments;
