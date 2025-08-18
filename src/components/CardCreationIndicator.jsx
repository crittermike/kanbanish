import { Edit3, User } from 'react-feather';

const CardCreationIndicator = ({ usersAddingCards, currentUserId }) => {
  // Filter out the current user - don't show typing animation to the person who's typing
  const otherUsersAddingCards = usersAddingCards?.filter(user => user.userId !== currentUserId) || [];

  if (!otherUsersAddingCards || otherUsersAddingCards.length === 0) {
    return null;
  }

  // Array of beautiful colors for random selection
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet  
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];

  // Get a random color for each card
  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="card-creation-indicator">
      {/* Show individual typing cards for each user (up to 3) */}
      {otherUsersAddingCards.slice(0, 3).map((user, index) => {
        const randomColor = getRandomColor();
        return (
          <div 
            key={user.userId} 
            className="typing-card" 
            style={{ 
              animationDelay: `${index * 0.15}s`,
              '--user-color': randomColor
            }}
          >
            <div className="typing-card-header">
              <div className="user-avatar" style={{ backgroundColor: randomColor }}>
                <User size={16} color="white" />
              </div>
              <div className="typing-info">
                <span className="typing-user">Someone is adding a card</span>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <Edit3 size={14} className="edit-icon" />
            </div>
            <div className="typing-content">
              <div className="typing-line">
                <span className="typing-text"></span>
                <span className="typing-cursor">|</span>
              </div>
              <div className="typing-line short">
                <span className="typing-text"></span>
                <span className="typing-cursor">|</span>
              </div>
              <div className="typing-line shorter">
                <span className="typing-text"></span>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Show summary if more than 3 users */}
      {otherUsersAddingCards.length > 3 && (
        <div className="more-users-indicator">
          <User size={14} />
          <span>+{otherUsersAddingCards.length - 3} more people adding cards...</span>
        </div>
      )}
    </div>
  );
};

export default CardCreationIndicator;
