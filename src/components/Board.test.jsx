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

  test('creates new board when button is clicked', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );
    
    const newBoardButton = screen.getByText('New Board');
    fireEvent.click(newBoardButton);
    
    expect(mockContextValue.createNewBoard).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith('New board created');
  });

  test('toggles sort by votes when button is clicked', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );
    
    const sortButton = screen.getByText('Sort by Votes');
    fireEvent.click(sortButton);
    
    expect(mockContextValue.setSortByVotes).toHaveBeenCalledWith(true);
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
  });

  test('creates new board on load only when authenticated', () => {
    // Mock URL without board ID
    mockURLSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null)
    }));

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Should create new board because user is authenticated
    expect(mockContextValue.createNewBoard).toHaveBeenCalled();
    expect(window.history.pushState).toHaveBeenCalledWith({}, '', '?board=new-board-123');
  });

  test('does not create board when not authenticated', () => {
    // Mock URL without board ID
    mockURLSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null)
    }));
    
    // Mock context with no user (unauthenticated)
    useBoardContext.mockReturnValue({
      ...mockContextValue,
      user: null,
    });

    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

    // Should not create a board because user is not authenticated
    expect(mockContextValue.createNewBoard).not.toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  test('does not update URL when board creation returns null', () => {
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

    // Click the "New Board" button explicitly
    const newBoardButton = screen.getByText('New Board');
    fireEvent.click(newBoardButton);

    // Should not update URL when board creation returns null
    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });
});
