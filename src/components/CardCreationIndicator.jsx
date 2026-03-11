import { getInitials } from '../utils/avatarColors';

const CardCreationIndicator = ({ usersAddingCards, currentUserId, showDisplayNames }) => {
  // Filter out the current user - don't show typing animation to the person who's typing
  const otherUsersAddingCards = usersAddingCards?.filter(user => user.userId !== currentUserId) || [];

  if (!otherUsersAddingCards || otherUsersAddingCards.length === 0) {
    return null;
  }

  const count = otherUsersAddingCards.length;
  
  let text = '';
  if (!showDisplayNames) {
    // When display names are disabled, use generic anonymous text
    text = count === 1
      ? 'Someone is adding a card'
      : `${count} people are adding cards`;
  } else if (count === 1) {
    const name = otherUsersAddingCards[0].displayName || 'Someone';
    text = `${name} is adding a card`;
  } else if (count === 2) {
    const name1 = otherUsersAddingCards[0].displayName || 'Someone';
    const name2 = otherUsersAddingCards[1].displayName || 'Someone';
    text = `${name1} and ${name2} are adding cards`;
  } else {
    text = `${count} people are adding cards`;
  }

  return (
    <div className="card-creation-indicator">
      {showDisplayNames && (
        <div className="typing-avatars">
          {otherUsersAddingCards.slice(0, 3).map((user, idx) => {
            const name = user.displayName || 'Anonymous';
            const color = user.color || 'var(--text-muted)';
            return (
              <div 
                key={user.userId || idx} 
                className="typing-avatar" 
                style={{ backgroundColor: color }}
                title={name}
              >
                {getInitials(name)}
              </div>
            );
          })}
          {count > 3 && (
            <div className="typing-avatar" style={{ backgroundColor: 'var(--text-muted)' }}>
              +{count - 3}
            </div>
          )}
        </div>
      )}
      <span className="typing-text">{text}</span>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default CardCreationIndicator;
