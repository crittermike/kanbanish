const CardCreationIndicator = ({ usersAddingCards, currentUserId }) => {
  // Filter out the current user - don't show typing animation to the person who's typing
  const otherUsersAddingCards = usersAddingCards?.filter(user => user.userId !== currentUserId) || [];

  if (!otherUsersAddingCards || otherUsersAddingCards.length === 0) {
    return null;
  }

  const count = otherUsersAddingCards.length;
  const text = count === 1 
    ? 'Someone is adding a card' 
    : `${count} people are adding cards`;

  return (
    <div className="card-creation-indicator">
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
