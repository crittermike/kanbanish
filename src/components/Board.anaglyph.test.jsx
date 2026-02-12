import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Board from './Board';

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

describe('Board Component - 3D Anaglyph Mode', () => {
  const mockShowNotification = vi.fn();
  const mockUpdateAnaglyphMode = vi.fn();

  const mockContextValue = {
    boardId: 'test-board-123',
    boardRef: {},
    boardTitle: 'Test Board',
    setBoardTitle: vi.fn(),
    columns: {},
    sortByVotes: false,
    setSortByVotes: vi.fn(),
    votingEnabled: true,
    updateVotingEnabled: vi.fn(),
    downvotingEnabled: true,
    updateDownvotingEnabled: vi.fn(),
    multipleVotesAllowed: false,
    updateMultipleVotesAllowed: vi.fn(),
    votesPerUser: 3,
    updateVotesPerUser: vi.fn(),
    retrospectiveMode: false,
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
    getAllUsersAddingCards: vi.fn().mockReturnValue([]),
    user: { uid: 'test-user-123' },
    darkMode: true,
    updateDarkMode: vi.fn(),
    anaglyphMode: false,
    updateAnaglyphMode: mockUpdateAnaglyphMode
  };

  const originalURLSearchParams = window.URLSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(mockContextValue);

    window.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));
  });

  afterEach(() => {
    window.URLSearchParams = originalURLSearchParams;
  });

  it('renders the 3D mode toggle button', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    const toggle = screen.getByTitle('Enable 3D mode');
    expect(toggle).toBeInTheDocument();
  });

  it('calls updateAnaglyphMode(true) when toggling on', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    const toggle = screen.getByTitle('Enable 3D mode');
    fireEvent.click(toggle);

    expect(mockUpdateAnaglyphMode).toHaveBeenCalledWith(true);
  });

  it('calls updateAnaglyphMode(false) when toggling off', () => {
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      anaglyphMode: true,
      updateAnaglyphMode: mockUpdateAnaglyphMode
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    const toggle = screen.getByTitle('Disable 3D mode');
    fireEvent.click(toggle);

    expect(mockUpdateAnaglyphMode).toHaveBeenCalledWith(false);
  });

  it('shows active class when anaglyph mode is on', () => {
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      anaglyphMode: true,
      updateAnaglyphMode: mockUpdateAnaglyphMode
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    const toggle = screen.getByTitle('Disable 3D mode');
    expect(toggle.className).toContain('active');
  });
});
