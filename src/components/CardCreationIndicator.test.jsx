import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CardCreationIndicator from './CardCreationIndicator';

// Mock the BoardContext for integration test
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

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

  it('shows simple text indicator when another user is adding a card', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    expect(screen.getByText('Someone is adding a card')).toBeInTheDocument();
    expect(document.querySelector('.card-creation-indicator')).toBeInTheDocument();
    expect(document.querySelector('.typing-text')).toBeInTheDocument();
  });

  it('shows count when multiple other users are adding cards', () => {
    const usersAddingCards = [
      { userId: 'user1', columnId: 'col1', lastUpdated: Date.now() }, // current user - should be filtered out
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    expect(screen.getByText('2 people are adding cards')).toBeInTheDocument();
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
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    // Should show count of 5 other users
    expect(screen.getByText('5 people are adding cards')).toBeInTheDocument();
  });

  it('displays typing dots animation', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    // Check for typing dots
    expect(document.querySelector('.typing-dots')).toBeInTheDocument();
    expect(document.querySelectorAll('.typing-dots span')).toHaveLength(3);
  });
});
