import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CardCreationIndicator from './CardCreationIndicator';

// Mock the BoardContext for integration test
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('CardCreationIndicator', () => {
  it('renders nothing when no users are adding cards', () => {
    const { container } = render(<CardCreationIndicator usersAddingCards={[]} currentUserId="user1" showDisplayNames={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only current user is adding a card', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    const { container } = render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows simple text indicator when another user is adding a card', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    expect(screen.getByText('Someone is adding a card')).toBeInTheDocument();
    expect(document.querySelector('.card-creation-indicator')).toBeInTheDocument();
    expect(document.querySelector('.typing-text')).toBeInTheDocument();
  });

  it('shows display name when user has one and showDisplayNames is true', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Alice', color: '#FF6B6B' }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    expect(screen.getByText('Alice is adding a card')).toBeInTheDocument();
    expect(document.querySelector('.typing-avatars')).toBeInTheDocument();
  });

  it('shows names for two users when showDisplayNames is true', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Alice' },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Bob' }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    expect(screen.getByText('Alice and Bob are adding cards')).toBeInTheDocument();
  });

  it('shows count when multiple other users are adding cards without display names', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }, // current user - should be filtered out
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    expect(screen.getByText('Someone and Someone are adding cards')).toBeInTheDocument();
  });

  it('shows count for many users (excluding current user)', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }, // current user - should be filtered out
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user5', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user6', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    
    // Should show count of 5 other users
    expect(screen.getByText('5 people are adding cards')).toBeInTheDocument();
  });

  it('displays typing dots animation', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={true} />);
    
    // Check for typing dots
    expect(document.querySelector('.typing-dots')).toBeInTheDocument();
    expect(document.querySelectorAll('.typing-dots span')).toHaveLength(3);
  });

  describe('when showDisplayNames is false', () => {
    it('hides avatars', () => {
      const usersAddingCards = [
        { userId: 'user2', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Alice', color: '#FF6B6B' }
      ];
      
      render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={false} />);
      expect(document.querySelector('.typing-avatars')).not.toBeInTheDocument();
    });

    it('shows generic text for one user', () => {
      const usersAddingCards = [
        { userId: 'user2', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Alice' }
      ];
      
      render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={false} />);
      expect(screen.getByText('Someone is adding a card')).toBeInTheDocument();
    });

    it('shows count instead of "Someone and Someone" for two users', () => {
      const usersAddingCards = [
        { userId: 'user2', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Alice' },
        { userId: 'user3', columnId: 'col1', lastUpdated: Date.now(), displayName: 'Bob' }
      ];
      
      render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={false} />);
      expect(screen.getByText('2 people are adding cards')).toBeInTheDocument();
    });

    it('shows count for many users', () => {
      const usersAddingCards = [
        { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
        { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
        { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() }
      ];
      
      render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" showDisplayNames={false} />);
      expect(screen.getByText('3 people are adding cards')).toBeInTheDocument();
    });
  });
});
