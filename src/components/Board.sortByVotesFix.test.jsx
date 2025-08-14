import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from './Board';
import { useBoardContext } from '../context/BoardContext';

// Mock the board context
vi.mock('../context/BoardContext');

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {},
  auth: {
    onAuthStateChanged: vi.fn()
  },
  signInAnonymously: vi.fn()
}));

describe('Board Component - Sort By Votes Fix', () => {
  const mockShowNotification = vi.fn();
  
  // Mock a complete context with the setSortByVotes function
  const mockContextValue = {
    boardId: 'test-board-123',
    boardRef: {},
    boardTitle: 'Test Board',
    setBoardTitle: vi.fn(),
    columns: {},
    sortByVotes: false,
    setSortByVotes: vi.fn(), // This now persists to Firebase
    votingEnabled: true,
    updateVotingEnabled: vi.fn(),
    downvotingEnabled: true,
    updateDownvotingEnabled: vi.fn(),
    multipleVotesAllowed: false,
    updateMultipleVotesAllowed: vi.fn(),
    votesPerUser: 3,
    updateVotesPerUser: vi.fn(),
    retrospectiveMode: false, // IMPORTANT: retro mode is OFF - this is when the bug occurred
    updateRetrospectiveMode: vi.fn(),
    workflowPhase: 'CREATION',
    setWorkflowPhase: vi.fn(),
    resetAllVotes: vi.fn().mockReturnValue(true),
    createNewBoard: vi.fn().mockReturnValue('new-board-123'),
    openExistingBoard: vi.fn(),
    updateBoardTitle: vi.fn(),
    getUserVoteCount: vi.fn().mockReturnValue(0),
    getTotalVotes: vi.fn().mockReturnValue(0),
    getTotalVotesRemaining: vi.fn().mockReturnValue(0),
    user: { uid: 'test-user-123' },
    darkMode: false,
    updateDarkMode: vi.fn()
  };

  // Mock URLSearchParams to prevent template modal from opening
  const originalURLSearchParams = window.URLSearchParams;
  
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(mockContextValue);
    
    // Mock URLSearchParams to simulate having a board ID in URL
    window.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));
  });

  afterEach(() => {
    window.URLSearchParams = originalURLSearchParams;
  });

  it('calls setSortByVotes when sort by votes is clicked', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the settings dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Click the "By Votes" option
    const byVotesOption = screen.getByText('By Votes');
    fireEvent.click(byVotesOption);

    // Verify that setSortByVotes was called with true (this persists to Firebase)
    expect(mockContextValue.setSortByVotes).toHaveBeenCalledWith(true);
    
    // Verify that we're NOT relying on just local state
    expect(mockContextValue.setSortByVotes).toHaveBeenCalledTimes(1);
  });

  it('calls setSortByVotes when switching back to chronological', () => {
    // Start with sort by votes enabled
    const contextWithSortByVotes = {
      ...mockContextValue,
      sortByVotes: true
    };
    
    useBoardContext.mockReturnValue(contextWithSortByVotes);

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the settings dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Click the "Chronological" option
    const chronologicalOption = screen.getByText('Chronological');
    fireEvent.click(chronologicalOption);

    // Verify that setSortByVotes was called with false (this persists to Firebase)
    expect(contextWithSortByVotes.setSortByVotes).toHaveBeenCalledWith(false);
  });
});