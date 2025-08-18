import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CardCreationIndicator from './CardCreationIndicator';

describe('CardCreationIndicator', () => {
  it('renders nothing when no users are adding cards', () => {
    const { container } = render(<CardCreationIndicator usersAddingCards={[]} currentUserId="user1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only current user is adding a card', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    const { container } = render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows typing card when another user is adding a card', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    expect(screen.getByText('Someone is adding a card')).toBeInTheDocument();
    expect(document.querySelector('.typing-card')).toBeInTheDocument();
    expect(document.querySelector('.user-avatar')).toBeInTheDocument();
  });

  it('shows multiple typing cards when multiple other users are adding cards', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }, // current user - should be filtered out
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    const typingCards = document.querySelectorAll('.typing-card');
    expect(typingCards).toHaveLength(2); // Only user2 and user3, not user1
  });

  it('shows up to 3 typing cards and overflow indicator for many users (excluding current user)', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }, // current user - should be filtered out
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user5', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user6', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const typingCards = document.querySelectorAll('.typing-card');
    expect(typingCards).toHaveLength(3); // Only 3 cards shown
    
    // Should show +2 more (5 other users - 3 shown = 2 more)
    expect(screen.getByText('+2 more people adding cards...')).toBeInTheDocument();
  });

  it('displays the edit icon and typing animations', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    // Check for edit icon (this will be the SVG element)
    expect(document.querySelector('svg')).toBeInTheDocument();
    
    // Check for typing elements
    expect(document.querySelector('.typing-content')).toBeInTheDocument();
    expect(document.querySelector('.typing-cursor')).toBeInTheDocument();
    expect(document.querySelectorAll('.typing-line')).toHaveLength(3); // Now we have 3 lines
    
    // Check for user avatar and typing dots
    expect(document.querySelector('.user-avatar')).toBeInTheDocument();
    expect(document.querySelector('.typing-dots')).toBeInTheDocument();
  });
});
