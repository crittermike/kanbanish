import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PollVoting from './PollVoting';
import { useBoardContext } from '../context/BoardContext';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('PollVoting Component', () => {
  const mockSubmitPollVote = vi.fn();

  const defaultMockContext = {
    userPollVote: null,
    submitPollVote: mockSubmitPollVote
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  test('renders poll voting interface', () => {
    render(<PollVoting />);
    
    expect(screen.getByText('How effective was this retrospective?')).toBeInTheDocument();
    expect(screen.getByText('Rate from 1 (not effective) to 5 (extremely effective)')).toBeInTheDocument();
    expect(screen.getByText('Click on a star to submit your rating')).toBeInTheDocument();
  });

  test('renders 5 star buttons', () => {
    render(<PollVoting />);
    
    const starButtons = screen.getAllByRole('button');
    expect(starButtons).toHaveLength(5);
  });

  test('submits vote when star is clicked', () => {
    render(<PollVoting />);
    
    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[2]); // Click the 3rd star (rating 3)
    
    expect(mockSubmitPollVote).toHaveBeenCalledWith(3);
  });

  test('shows rating description on hover', () => {
    render(<PollVoting />);
    
    const starButtons = screen.getAllByRole('button');
    fireEvent.mouseEnter(starButtons[4]); // Hover over 5th star
    
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('Extremely effective')).toBeInTheDocument();
  });

  test('displays submitted vote status', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userPollVote: 4
    });

    render(<PollVoting />);
    
    expect(screen.getByText('✓ Your vote has been submitted: 4/5 stars')).toBeInTheDocument();
    expect(screen.getByText('You can change your vote by clicking a different star rating.')).toBeInTheDocument();
  });

  test('shows correct rating descriptions', () => {
    render(<PollVoting />);
    
    const starButtons = screen.getAllByRole('button');
    
    // Test each rating description
    fireEvent.mouseEnter(starButtons[0]);
    expect(screen.getByText('Not effective at all')).toBeInTheDocument();
    
    fireEvent.mouseEnter(starButtons[1]);
    expect(screen.getByText('Slightly effective')).toBeInTheDocument();
    
    fireEvent.mouseEnter(starButtons[2]);
    expect(screen.getByText('Moderately effective')).toBeInTheDocument();
    
    fireEvent.mouseEnter(starButtons[3]);
    expect(screen.getByText('Very effective')).toBeInTheDocument();
    
    fireEvent.mouseEnter(starButtons[4]);
    expect(screen.getByText('Extremely effective')).toBeInTheDocument();
  });

  test('allows changing vote', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userPollVote: 3
    });

    render(<PollVoting />);
    
    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[4]); // Change vote to 5 stars
    
    expect(mockSubmitPollVote).toHaveBeenCalledWith(5);
  });
});
