import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Card from './Card';

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(),
  remove: vi.fn().mockResolvedValue(),
  getDatabase: vi.fn().mockReturnValue({})
}));

// Mock react-dnd
vi.mock('react-dnd', () => ({
  useDrag: vi.fn().mockReturnValue([{ isDragging: false }, vi.fn()]),
  useDrop: vi.fn().mockReturnValue([{ isOver: false }, vi.fn()])
}));

// Mock ReactDOM.createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: element => element
}));

// Mock BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('Card URL linking', () => {
  const mockBoardContext = {
    boardId: 'board123',
    user: { uid: 'user123' },
    votingEnabled: true,
    downvotingEnabled: true,
    multipleVotesAllowed: false,
    workflowPhase: 'INTERACTIONS',
    retrospectiveMode: false
  };

  beforeEach(() => {
    useBoardContext.mockReturnValue(mockBoardContext);
  });

  test('renders URLs as clickable links in card content', () => {
    const cardData = {
      content: 'Check out https://example.com for documentation\nAlso visit http://github.com',
      votes: 0,
      reactions: {},
      comments: {}
    };

    const mockProps = {
      cardId: 'card123',
      cardData,
      columnId: 'column1',
      showNotification: vi.fn()
    };

    render(<Card {...mockProps} />);

    // Check for the first URL
    const firstLink = screen.getByRole('link', { name: 'https://example.com' });
    expect(firstLink).toBeInTheDocument();
    expect(firstLink).toHaveAttribute('href', 'https://example.com');
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(firstLink).toHaveClass('auto-link');

    // Check for the second URL
    const secondLink = screen.getByRole('link', { name: 'http://github.com' });
    expect(secondLink).toBeInTheDocument();
    expect(secondLink).toHaveAttribute('href', 'http://github.com');

    // Verify surrounding text is preserved
    expect(screen.getByText('Check out', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('for documentation', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Also visit', { exact: false })).toBeInTheDocument();
  });

  test('handles card content without URLs correctly', () => {
    const cardData = {
      content: 'This is just plain text without any links',
      votes: 0,
      reactions: {},
      comments: {}
    };

    const mockProps = {
      cardId: 'card123',
      cardData,
      columnId: 'column1',
      showNotification: vi.fn()
    };

    render(<Card {...mockProps} />);

    // Should display plain text
    expect(screen.getByText('This is just plain text without any links')).toBeInTheDocument();
    
    // Should not have any links
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('handles complex URLs with query parameters and fragments', () => {
    const cardData = {
      content: 'API endpoint: https://api.example.com/v1/users?limit=10&sort=name#results',
      votes: 0,
      reactions: {},
      comments: {}
    };

    const mockProps = {
      cardId: 'card123',
      cardData,
      columnId: 'column1',
      showNotification: vi.fn()
    };

    render(<Card {...mockProps} />);

    const link = screen.getByRole('link', { name: 'https://api.example.com/v1/users?limit=10&sort=name#results' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://api.example.com/v1/users?limit=10&sort=name#results');
  });
});