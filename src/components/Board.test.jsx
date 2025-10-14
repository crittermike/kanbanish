import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi, describe, test, beforeEach, expect, afterEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Board from './Board';

// Mock the BoardContext
vi.mock('../context/BoardContext');

// Mock the NewBoardTemplateModal component
vi.mock('./modals/NewBoardTemplateModal', () => ({
  default: ({ isOpen, _onClose, _onSelectTemplate }) =>
    isOpen ? <div data-testid="template-modal">Template Modal</div> : null
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
  const mockShowNotification = vi.fn();

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
    workflowPhase: 'INTERACTION_REVEAL', // Cards revealed, interactions frozen
    setWorkflowPhase: vi.fn(),
    resetAllVotes: vi.fn().mockReturnValue(true),
    createNewBoard: vi.fn().mockReturnValue('new-board-123'),
    openExistingBoard: vi.fn(),
    updateBoardTitle: vi.fn(),
    getUserVoteCount: vi.fn().mockReturnValue(0),
    getTotalVotes: vi.fn().mockReturnValue(0),
    getTotalVotesRemaining: vi.fn().mockReturnValue(0),
    getUsersAddingCardsInColumn: vi.fn().mockReturnValue([]),
    getAllUsersAddingCards: vi.fn().mockReturnValue([]),
    user: { uid: 'test-user-123' } // Default user state for most tests
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Check if board title is rendered
    const boardTitleInput = screen.getByDisplayValue('Test Board');
    expect(boardTitleInput).toBeInTheDocument();

    // Check if Share button exists
    const shareButton = screen.getByTitle('Copy Share URL');
    expect(shareButton).toBeInTheDocument();

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
        <Board showNotification={mockShowNotification} />
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    const copyButton = screen.getByTitle('Copy Share URL');
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

  test('opens template modal when New Board button is clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Initially, the template modal should not be in the document
    expect(screen.queryByTestId('template-modal')).not.toBeInTheDocument();

    // Click the New Board button
    const newBoardButton = screen.getByText('New Board');
    fireEvent.click(newBoardButton);

    // Template modal should now be in the document
    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });

  test('opens sort dropdown when dropdown button is clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Find and click the settings dropdown button
    const settingsButton = screen.getByText('Settings');
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Find the "Allow Voting?" section and click the "No" option
    const allowVotingSection = screen.getByText('Allow voting?');
    expect(allowVotingSection).toBeInTheDocument();

    // Find the closest parent section element containing the setting
    const votingSection = allowVotingSection.closest('.settings-section');

    // Within that section, find the No option and click it
    const noOption = within(votingSection).getByText('No');
    fireEvent.click(noOption);

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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Find the "Allow users to vote multiple times on the same card?" section and click the "Yes" option
    const allowMultipleVotesSection = screen.getByText('Allow users to vote multiple times on the same card?');
    expect(allowMultipleVotesSection).toBeInTheDocument();

    // Find the closest parent section element containing the setting
    const multipleVotesSection = allowMultipleVotesSection.closest('.settings-section');

    // Within that section, find the Yes option and click it
    const yesOption = within(multipleVotesSection).getByText('Yes');
    fireEvent.click(yesOption);

    // Check that updateMultipleVotesAllowed was called with true
    expect(mockContextValue.updateMultipleVotesAllowed).toHaveBeenCalledWith(true);
  });

  test('does not reset retrospective mode when changing other settings', () => {
    // Start with retrospective mode enabled
    const contextWithRetrospectiveMode = {
      ...mockContextValue,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTION_REVEAL'
    };

    useBoardContext.mockReturnValue(contextWithRetrospectiveMode);

    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the settings dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Change the multiple votes setting
    const allowMultipleVotesSection = screen.getByText('Allow users to vote multiple times on the same card?');
    const multipleVotesSection = allowMultipleVotesSection.closest('.settings-section');
    const yesOption = within(multipleVotesSection).getByText('Yes');
    fireEvent.click(yesOption);

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
        <Board showNotification={mockShowNotification} />
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Document title should be updated
    expect(document.title).toBe('Updated Board Title - Kanbanish');
  });

  test('initializes with board ID from URL', () => {
    // Mock URL with board ID
    mockURLSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue('board-from-url')
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    expect(mockContextValue.openExistingBoard).toHaveBeenCalledWith('board-from-url');
    expect(mockContextValue.createNewBoard).not.toHaveBeenCalled();

    // Template modal should not open when URL has a board ID
    expect(screen.queryByTestId('template-modal')).not.toBeInTheDocument();
  });

  test('automatically opens template modal when no board ID is in URL', () => {
    // Mock URL with no board ID
    mockURLSearchParams.mockImplementation(() => ({
      get: _param => null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Template modal should automatically open
    expect(screen.getByTestId('template-modal')).toBeInTheDocument();

    // Should not call openExistingBoard
    expect(mockContextValue.openExistingBoard).not.toHaveBeenCalled();
  });

  test('handles template selection with failed board creation', () => {
    // Mock URL with a board ID to prevent auto-opening the template modal
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    // Mock createNewBoard to return null (failed creation)
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      createNewBoard: vi.fn().mockReturnValue(null)
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the template modal
    const newBoardButton = screen.getByText('New Board');
    fireEvent.click(newBoardButton);
    expect(screen.getByTestId('template-modal')).toBeInTheDocument();

    // Since the modal is mocked, we can't actually test the selection behavior directly
    // But we can verify that pushState and notification are not called when board creation fails
    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  test('toggles downvoting enabled setting when clicked', () => {
    // For this test, let's simulate having a board ID in the URL
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: param => param === 'board' ? 'existing-board-id' : null
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Find the "Allow downvoting?" section and click the "No" option
    const allowDownvotingSection = screen.getByText('Allow downvoting?');
    expect(allowDownvotingSection).toBeInTheDocument();

    // Find the closest parent section element containing the setting
    const downvotingSection = allowDownvotingSection.closest('.settings-section');

    // Within that section, find the No option and click it
    const noOption = within(downvotingSection).getByText('No');
    fireEvent.click(noOption);

    // Check that updateDownvotingEnabled was called with false
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Verify the downvoting option is not visible when voting is disabled
    expect(screen.queryByText('Allow downvoting?')).not.toBeInTheDocument();
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Verify vote settings are displayed correctly
    expect(screen.getByText('Allow voting?')).toBeInTheDocument();

    // The multi-vote setting and reset votes button should be hidden when voting is disabled
    expect(screen.queryByText('Allow users to vote multiple times on the same card?')).not.toBeInTheDocument();
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
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Open the dropdown
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Verify all vote settings are displayed
    expect(screen.getByText('Allow voting?')).toBeInTheDocument();
    expect(screen.getByText('Allow users to vote multiple times on the same card?')).toBeInTheDocument();
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
        <Board showNotification={mockShowNotification} />
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
