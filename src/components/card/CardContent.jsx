import React from 'react';

const CardContent = ({ 
  isEditing, 
  editedContent, 
  setEditedContent, 
  handleKeyPress, 
  saveCardChanges, 
  deleteCard, 
  formatContentWithEmojis, 
  cardData,
  upvoteCard,
  handleDownvote
}) => {
  if (isEditing) {
    return (
      <div className="card-edit" onClick={(e) => e.stopPropagation()}>
        <textarea 
          className="card-edit-textarea"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyPress}
          autoFocus
        />
        <div className="card-edit-actions">
          <button className="btn primary-btn" onClick={saveCardChanges}>Save</button>
          <button className="btn secondary-btn" onClick={() => setEditedContent(cardData.content)}>Cancel</button>
          <button className="btn danger-btn" onClick={deleteCard}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-header">
      <div className="votes">
        <button 
          className="vote-button" 
          onClick={upvoteCard}
          title="Upvote"
        >
          ↑
        </button>
        <span className="vote-count">{cardData.votes || 0}</span>
        <button 
          className="vote-button" 
          onClick={handleDownvote}
          title="Downvote"
        >
          ↓
        </button>
      </div>
      <div className="card-content">
        {formatContentWithEmojis(cardData.content)}
      </div>
    </div>
  );
};

export default CardContent; 