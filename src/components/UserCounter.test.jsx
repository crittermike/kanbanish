import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserCounter from './UserCounter';
import { useBoardContext } from '../context/BoardContext';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('UserCounter Component', () => {
  it('renders user count when board is loaded', () => {
    useBoardContext.mockReturnValue({
      activeUsers: 3,
      boardId: 'test-board-id'
    });

    render(<UserCounter />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTitle('3 users viewing this board')).toBeInTheDocument();
  });

  it('renders singular form for one user', () => {
    useBoardContext.mockReturnValue({
      activeUsers: 1,
      boardId: 'test-board-id'
    });

    render(<UserCounter />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByTitle('1 user viewing this board')).toBeInTheDocument();
  });

  it('does not render when no board is loaded', () => {
    useBoardContext.mockReturnValue({
      activeUsers: 2,
      boardId: null
    });

    const { container } = render(<UserCounter />);
    
    expect(container.firstChild).toBeNull();
  });

  it('handles zero users', () => {
    useBoardContext.mockReturnValue({
      activeUsers: 0,
      boardId: 'test-board-id'
    });

    render(<UserCounter />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByTitle('0 users viewing this board')).toBeInTheDocument();
  });
});
