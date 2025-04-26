import React from 'react';

const CardActions = ({ 
  toggleComments,
  showComments,
  cardData
}) => {
  return (
    <div className="card-actions">
      <button 
        className="comments-btn" 
        onClick={toggleComments}
        title="Toggle comments"
      >
        💬 {cardData.comments ? Object.keys(cardData.comments).length : 0}
      </button>
    </div>
  );
};

export default CardActions; 