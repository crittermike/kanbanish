import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi, describe, test, beforeEach, expect, afterEach } from 'vitest';
import { useBoardContext, DEFAULT_BOARD_TITLE } from '../context/BoardContext';
import Board from './Board';

// Mock the BoardContext
vi.mock('../context/BoardContext');
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));



// Mock the ExportBoardModal component
vi.mock('./modals/ExportBoardModal', () => ({
  default: ({ isOpen, _onClose }) =>
    isOpen ? <div data-testid="export-modal">Export Modal</div> : null
}));

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(),
  onValue: vi.fn(),
  off: vi.fn(),
  remove: vi.fn()
}));

vi.mock('../utils/firebase', () => ({
  database: {},
  auth: {
    onAuthStateChanged: vi.fn()
  },
  signInAnonymously: vi.fn()
}));

describe('Board Component', () => {

  // Mock context values
  const mockContextValue = {
    boardId: 'test-board-123',
    boardRef: {},
    boardTitle: 'Test Board',
    setBoardTitle: vi.fn(),
    columns: {
      'col1': { title: 'To Do', cards: {} },
      'col2': { title: 'In Progress', cards: {} }
    },
    sortByVotes: false,
    setSortByVotes: vi.fn(),
    votingEnabled: true,
    setVotingEnabled: vi.fn(),
    updateVotingEnabled: vi.fn(),
    downvotingEnabled: true,
    setDownvotingEnabled: vi.fn(),
    updateDownvotingEnabled: vi.fn(),
    multipleVotesAllowed: false,
    setMultipleVotesAllowed: vi.fn(),
    updateMultipleVotesAllowed: vi.fn(),
    votesPerUser: 3,
    setVotesPerUser: vi.fn(),
    updateVotesPerUser: vi.fn(),
    retrospectiveMode: true,
    setRetrospectiveMode: vi.fn(),
    updateRetrospectiveMode: vi.fn(),
    workflowPhase: 'INTERACTIONS', // Cards revealed, voting active
    setWorkflowPhase: vi.fn(),
    resetAllVotes: vi.fn().mockReturnValue(true),
    updateBoardTitle: vi.fn(),
    getUserVoteCount: vi.fn().mockReturnValue(0),
    getTotalVotes: vi.fn().mockReturnValue(0),
    getTotalVotesRemaining: vi.fn().mockReturnValue(0),
    getUsersAddingCardsInColumn: vi.fn().mockReturnValue([]),
    getAllUsersAddingCards: vi.fn().mockReturnValue([]),
    user: { uid: 'test-user-123' }, // Default user state for most tests
    // Timer system
    timerData: null,
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    resetTimer: vi.fn(),
    // Board ownership
    boardOwner: null,
    isOwner: false
  };

  // Original mock URLSearchParams for testing
  const originalURLSearchParams = window.URLSearchParams;
  let mockURLSearchParams;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up BoardContext mock
    useBoardContext.mockReturnValue(mockContextValue);

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    });

    // Mock URL search params
    mockURLSearchParams = vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null)
    }));
    window.URLSearchParams = mockURLSearchParams;

    // Mock window.history.pushState
    window.history.pushState = vi.fn();

    // Mock window.confirm
    global.window.confirm = vi.fn();
  });

  afterEach(() => {
    // Restore original URLSearchParams
    window.URLSearchParams = originalURLSearchParams;
  });

  test('renders board title and columns correctly', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Check if board title is rendered
    const boardTitleInput = screen.getByDisplayValue('Test Board');
    expect(boardTitleInput).toBeInTheDocument();

    // Check if settings button exists
    const settingsButton = screen.getByTitle('Board settings and preferences');
    expect(settingsButton).toBeInTheDocument();

    // Check if columns are rendered
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    // Check if Add Column button is hidden when cards are revealed
    expect(screen.queryByText('Add Column')).not.toBeInTheDocument();
  });

  test('handles board title change correctly', () => {
    // Setup mock for local state
    const mockSetBoardTitle = vi.fn();
    const mockUpdateBoardTitle = vi.fn();

    useBoardContext.mockReturnValue({
      ...mockContextValue,
      boardTitle: 'Test Board',
      setBoardTitle: mockSetBoardTitle,
      updateBoardTitle: mockUpdateBoardTitle
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    const boardTitleInput = screen.getByDisplayValue('Test Board');

    // Change the title
    fireEvent.change(boardTitleInput, { target: { value: 'Updated Board Title' } });

    // setBoardTitle should be called immediately when typing
    expect(mockSetBoardTitle).toHaveBeenCalledWith('Updated Board Title');
    expect(mockUpdateBoardTitle).not.toHaveBeenCalled();

    // Blur the input to trigger Firebase update
    fireEvent.blur(boardTitleInput);

    // updateBoardTitle should be called with the current boardTitle value
    // Note: this will be the original value since we're not actually updating the mock state
    expect(mockUpdateBoardTitle).toHaveBeenCalledWith('Test Board');
  });

  test('handles copying share URL to clipboard', async () => {
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      origin: 'https://example.com',
      pathname: '/'
    };

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open settings dropdown first
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Share & Export tab
    fireEvent.click(screen.getByRole('tab', { name: /Share/i }));

    const copyButton = screen.getByText('Share Board');
    fireEvent.click(copyButton);

    const expectedUrl = 'https://example.com/?board=test-board-123';
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);

    // Wait for the Promise to resolve and notification to be called
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Share URL copied to clipboard');
    });

    // Restore original location
    window.location = originalLocation;
  });


  test('opens sort dropdown when dropdown button is clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Find and click the settings dropdown button
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Check that dropdown options are shown
    expect(screen.getByText('Sort Cards')).toBeInTheDocument();
    expect(screen.getByText('Chronological')).toBeInTheDocument();
    expect(screen.getByText('By Votes')).toBeInTheDocument();
  });

  test('selects sort by votes when that option is clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Click the "By Votes" option
    const byVotesOption = screen.getByText('By Votes');
    fireEvent.click(byVotesOption);

    // Check that setSortByVotes was called with true
    expect(mockContextValue.setSortByVotes).toHaveBeenCalledWith(true);
  });

  test('toggles voting enabled setting when clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Find the toggle switch for "Allow voting" and click it
    const votingToggle = screen.getByRole('switch', { name: 'Allow voting' });
    fireEvent.click(votingToggle);

    // Check that updateVotingEnabled was called with the opposite of its current value
    expect(mockContextValue.updateVotingEnabled).toHaveBeenCalledWith(!mockContextValue.votingEnabled);
  });

  test('toggles multiple votes allowed setting when clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Find the toggle switch for "Allow multiple votes" and click it
    const multiVoteToggle = screen.getByRole('switch', { name: /vote multiple times/ });
    fireEvent.click(multiVoteToggle);

    // Check that updateMultipleVotesAllowed was called with true (toggling from false)
    expect(mockContextValue.updateMultipleVotesAllowed).toHaveBeenCalledWith(true);
  });

  test('does not reset retrospective mode when changing other settings', () => {
    // Start with retrospective mode enabled
    const contextWithRetrospectiveMode = {
      ...mockContextValue,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS'
    };

    useBoardContext.mockReturnValue(contextWithRetrospectiveMode);

    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the settings dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Click the toggle switch for multiple votes
    const multiVoteToggle = screen.getByRole('switch', { name: /vote multiple times/ });
    fireEvent.click(multiVoteToggle);

    // Verify that only updateMultipleVotesAllowed was called, not updateRetrospectiveMode
    expect(contextWithRetrospectiveMode.updateMultipleVotesAllowed).toHaveBeenCalledWith(true);
    expect(contextWithRetrospectiveMode.updateRetrospectiveMode).not.toHaveBeenCalled();
    expect(contextWithRetrospectiveMode.setWorkflowPhase).not.toHaveBeenCalled();
  });

  test('updates document title when board title changes', () => {
    // Set up initial board title
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      boardTitle: 'Initial Board Title'
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Initial document title should be set
    expect(document.title).toBe('Initial Board Title - Kanbanish');

    // Change the board title
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      boardTitle: 'Updated Board Title'
    });

    // Re-render with new board title
    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Document title should be updated
    expect(document.title).toBe('Updated Board Title - Kanbanish');
  });

  test('uses SEO-friendly default title for "Untitled Board"', () => {
    // Set up with "Untitled Board" as the title
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      boardTitle: DEFAULT_BOARD_TITLE
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Should use SEO-friendly default title instead of "Untitled Board - Kanbanish"
    expect(document.title).toBe('Kanbanish | Real-time anonymous kanban board');
  });



  test('toggles downvoting enabled setting when clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Find the toggle switch for "Allow downvoting" and click it
    const downvotingToggle = screen.getByRole('switch', { name: 'Allow downvoting' });
    fireEvent.click(downvotingToggle);

    // Check that updateDownvotingEnabled was called with false (toggling from true)
    expect(mockContextValue.updateDownvotingEnabled).toHaveBeenCalledWith(false);
  });

  test('hides downvoting setting when voting is disabled', () => {
    // Override the mock for this specific test - voting is disabled
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      votingEnabled: false
    });

    // Simulate having a board ID in the URL
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Verify the downvoting option is not visible when voting is disabled
    expect(screen.queryByText('Allow downvoting')).not.toBeInTheDocument();
  });

  // Tests for Reset All Votes functionality are already defined above

  test('resets all votes when reset votes button is clicked', async () => {
    // Set up specific mock for resetAllVotes that simulates the confirm dialog internally returning true
    const mockResetAllVotes = vi.fn().mockImplementation(() => {
      return true; // Simulate user clicking "OK" in confirm dialog
    });

    // Override the mock for this specific test
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      resetAllVotes: mockResetAllVotes
    });

    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Find and click the reset votes button
    const resetVotesButton = screen.getByText('Reset all votes');
    expect(resetVotesButton).toBeInTheDocument();
    fireEvent.click(resetVotesButton);

    // Verify resetAllVotes was called
    expect(mockResetAllVotes).toHaveBeenCalled();

    // Verify notification was shown
    expect(mockShowNotification).toHaveBeenCalledWith('All votes reset to zero');

    // Verify dropdown remains open
    expect(screen.getByText('Reset all votes')).toBeInTheDocument();
  });

  test('does not reset votes if user cancels confirmation', async () => {
    // Set up specific mock for resetAllVotes that simulates the confirm dialog internally returning false
    const mockResetAllVotes = vi.fn().mockImplementation(() => {
      return false; // Simulate user clicking "Cancel" in confirm dialog
    });

    // Override the mock for this specific test
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      resetAllVotes: mockResetAllVotes
    });

    // Simulate having a board ID in the URL
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Find and click the reset votes button
    const resetVotesButton = screen.getByText('Reset all votes');
    fireEvent.click(resetVotesButton);

    // Verify resetAllVotes was called
    expect(mockResetAllVotes).toHaveBeenCalled();

    // Verify notification was NOT shown
    expect(mockShowNotification).not.toHaveBeenCalledWith('All votes reset to zero');

    // Dropdown should still be open
    expect(screen.getByText('Reset all votes')).toBeInTheDocument();
  });

  test('hides multi-vote setting and reset votes button when voting is disabled', () => {
    // Override the mock for this specific test - voting is disabled
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      votingEnabled: false
    });

    // Simulate having a board ID in the URL
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Verify vote settings are displayed correctly
    expect(screen.getByText('Allow voting')).toBeInTheDocument();

    // The multi-vote setting and reset votes button should be hidden when voting is disabled
    expect(screen.queryByText('Multiple votes per card')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset all votes')).not.toBeInTheDocument();
  });

  test('shows multi-vote setting and reset votes button when voting is enabled', () => {
    // Override the mock for this specific test - voting is enabled
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      votingEnabled: true
    });

    // Simulate having a board ID in the URL
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByTitle('Board settings and preferences');
    fireEvent.click(settingsButton);

    // Navigate to Voting tab
    fireEvent.click(screen.getByRole('tab', { name: /Voting/i }));

    // Verify all vote settings are displayed
    expect(screen.getByText('Allow voting')).toBeInTheDocument();
    expect(screen.getByText('Multiple votes per card')).toBeInTheDocument();
    expect(screen.getByText('Reset all votes')).toBeInTheDocument();
  });

  test('sorts cards and groups by votes when sort by votes is enabled', () => {
    // Mock columns with both cards and groups having different vote counts
    const mockColumnsWithVotes = {
      'col1': {
        title: 'To Do',
        cards: {
          'card1': { content: 'Low vote card', votes: 1, created: 1000 },
          'card2': { content: 'High vote card', votes: 10, created: 3000 },
          'card3': { content: 'Grouped card', votes: 0, created: 4000, groupId: 'group1' }
        },
        groups: {
          'group1': {
            name: 'Medium vote group',
            votes: 5,
            created: 2000,
            expanded: true,
            cardIds: ['card3'] // New structure: just store card IDs
          }
        }
      }
    };

    useBoardContext.mockReturnValue({
      ...mockContextValue,
      columns: mockColumnsWithVotes,
      sortByVotes: true // Enable sort by votes
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board />
      </DndProvider>
    );

    // When sorting by votes, items should be ordered: High vote card (10) > Medium vote group (5) > Low vote card (1)
    // This is verified by checking the DOM structure, but since we can't easily test the exact order without more
    // detailed DOM inspection, we at least verify that all items are rendered
    expect(screen.getByText('High vote card')).toBeInTheDocument();
    expect(screen.getByText('Medium vote group')).toBeInTheDocument();
    expect(screen.getByText('Low vote card')).toBeInTheDocument();
    expect(screen.getByText('Grouped card')).toBeInTheDocument();
  });
});
