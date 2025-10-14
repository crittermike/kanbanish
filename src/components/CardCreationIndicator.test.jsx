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

  it('applies proper animation delays to multiple typing cards', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const typingCards = document.querySelectorAll('.typing-card');
    expect(typingCards[0].style.animationDelay).toBe('0s');
    expect(typingCards[1].style.animationDelay).toBe('0.15s');
    expect(typingCards[2].style.animationDelay).toBe('0.3s');
  });

  it('assigns random colors to user avatars via CSS variable', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const typingCards = document.querySelectorAll('.typing-card');
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
    
    // Check that each card has a --user-color CSS variable set
    typingCards.forEach(card => {
      const userColor = card.style.getPropertyValue('--user-color');
      expect(userColor).toBeTruthy();
      expect(colors).toContain(userColor);
    });
  });

  it('handles null usersAddingCards prop gracefully', () => {
    const { container } = render(<CardCreationIndicator usersAddingCards={null} currentUserId="user1" />);
    expect(container.firstChild).toBeNull();
  });

  it('handles undefined usersAddingCards prop gracefully', () => {
    const { container } = render(<CardCreationIndicator usersAddingCards={undefined} currentUserId="user1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders typing dots with correct structure (3 span elements)', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const typingDots = document.querySelector('.typing-dots');
    expect(typingDots).toBeInTheDocument();
    
    const spans = typingDots.querySelectorAll('span');
    expect(spans).toHaveLength(3);
  });

  it('shows overflow counter "+1 more" with exactly 4 users', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user5', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(screen.getByText('+1 more people adding cards...')).toBeInTheDocument();
  });

  it('shows overflow counter "+2 more" with exactly 5 users', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user5', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user6', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(screen.getByText('+2 more people adding cards...')).toBeInTheDocument();
  });

  it('shows overflow counter "+7 more" with 10 users', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user5', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user6', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user7', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user8', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user9', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user10', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user11', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(screen.getByText('+7 more people adding cards...')).toBeInTheDocument();
  });

  it('does not show more-users-indicator with exactly 3 users', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user4', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(document.querySelector('.more-users-indicator')).not.toBeInTheDocument();
  });

  it('does not show more-users-indicator with 2 users', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(document.querySelector('.more-users-indicator')).not.toBeInTheDocument();
  });

  it('does not show more-users-indicator with 1 user', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    expect(document.querySelector('.more-users-indicator')).not.toBeInTheDocument();
  });

  it('sets proper background colors on user avatars', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() },
      { userId: 'user3', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const avatars = document.querySelectorAll('.user-avatar');
    const hexColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
    const rgbColors = [
      'rgb(99, 102, 241)', 
      'rgb(139, 92, 246)', 
      'rgb(6, 182, 212)', 
      'rgb(16, 185, 129)', 
      'rgb(245, 158, 11)', 
      'rgb(239, 68, 68)', 
      'rgb(236, 72, 153)', 
      'rgb(132, 204, 22)'
    ];
    
    avatars.forEach(avatar => {
      const bgColor = avatar.style.backgroundColor;
      expect(bgColor).toBeTruthy();
      // Browser may return hex or rgb format
      const isValid = hexColors.includes(bgColor) || rgbColors.includes(bgColor);
      expect(isValid).toBe(true);
    });
  });

  it('renders all typing lines with proper class names', () => {
    const usersAddingCards = [
      { userId: 'user2', columnId: 'col1', lastUpdated: Date.now() }
    ];
    
    render(<CardCreationIndicator usersAddingCards={usersAddingCards} currentUserId="user1" />);
    
    const typingLines = document.querySelectorAll('.typing-line');
    expect(typingLines).toHaveLength(3);
    
    // First line should have just 'typing-line' class
    expect(typingLines[0].classList.contains('typing-line')).toBe(true);
    expect(typingLines[0].classList.contains('short')).toBe(false);
    expect(typingLines[0].classList.contains('shorter')).toBe(false);
    
    // Second line should have 'typing-line short' classes
    expect(typingLines[1].classList.contains('typing-line')).toBe(true);
    expect(typingLines[1].classList.contains('short')).toBe(true);
    
    // Third line should have 'typing-line shorter' classes
    expect(typingLines[2].classList.contains('typing-line')).toBe(true);
    expect(typingLines[2].classList.contains('shorter')).toBe(true);
  });
});
