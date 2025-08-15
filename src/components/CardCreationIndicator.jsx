import { Edit3 } from 'react-feather';

const CardCreationIndicator = ({ usersAddingCards, currentUserId }) => {
  // Filter out the current user - don't show typing animation to the person who's typing
  const otherUsersAddingCards = usersAddingCards?.filter(user => user.userId !== currentUserId) || [];

  if (!otherUsersAddingCards || otherUsersAddingCards.length === 0) {
    return null;
  }

  return (
    <div className="card-creation-indicator">
      {/* Show individual typing cards for each user (up to 3) */}
      {otherUsersAddingCards.slice(0, 3).map((user, index) => (
        <div key={user.userId} className="typing-card" style={{ animationDelay: `${index * 0.2}s` }}>
          <div className="typing-card-header">
            <Edit3 size={12} />
            <span className="typing-user">Adding card...</span>
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
          </div>
        </div>
      ))}
      
      {/* Show summary if more than 3 users */}
      {otherUsersAddingCards.length > 3 && (
        <div className="more-users-indicator">
          <span>+{otherUsersAddingCards.length - 3} more adding cards...</span>
        </div>
      )}
    </div>
  );
};

export default CardCreationIndicator;
