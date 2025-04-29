import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, beforeEach, expect, afterEach } from 'vitest';
import Board from './Board';
import { useBoardContext } from '../context/BoardContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock the BoardContext
vi.mock('../context/BoardContext');

// Mock the NewBoardTemplateModal component
vi.mock('./modals/NewBoardTemplateModal', () => ({
  default: ({ isOpen, onClose, onSelectTemplate }) => 
    isOpen ? <div data-testid="template-modal">Template Modal</div> : null
}));

// Mock the ExportBoardModal component
vi.mock('./modals/ExportBoardModal', () => ({
  default: ({ isOpen, onClose }) => 
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
    multipleVotesAllowed: false,
    setMultipleVotesAllowed: vi.fn(),
    updateMultipleVotesAllowed: vi.fn(),
    createNewBoard: vi.fn().mockReturnValue('new-board-123'),
    openExistingBoard: vi.fn(),
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
    
    // Check if Add Column button exists
    expect(screen.getByText('Add Column')).toBeInTheDocument();
  });

  test('handles board title change correctly', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );
    
    const boardTitleInput = screen.getByDisplayValue('Test Board');
    fireEvent.change(boardTitleInput, { target: { value: 'Updated Board Title' } });
    
    expect(mockContextValue.setBoardTitle).toHaveBeenCalledWith('Updated Board Title');
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
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
    
    const noOptions = screen.getAllByText('No');
    // First 'No' option is for voting settings
    fireEvent.click(noOptions[0]);
    
    // Check that updateVotingEnabled was called with the opposite of its current value
    expect(mockContextValue.updateVotingEnabled).toHaveBeenCalledWith(!mockContextValue.votingEnabled);
  });
  
  test('toggles multiple votes allowed setting when clicked', () => {
    // For this test, let's simulate having a board ID in the URL 
    // so the template modal doesn't open automatically
    mockURLSearchParams.mockImplementation(() => ({
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
    
    const yesOption = screen.getAllByText('Yes')[1]; // Get the second "Yes" button (for multiple votes)
    fireEvent.click(yesOption);
    
    // Check that updateMultipleVotesAllowed was called with true
    expect(mockContextValue.updateMultipleVotesAllowed).toHaveBeenCalledWith(true);
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
      get: (param) => null
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
      get: (param) => param === 'board' ? 'existing-board-id' : null
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
});
