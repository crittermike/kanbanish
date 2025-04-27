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
    openExistingBoard: vi.fn()
  };

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
    
    // Check if board ID is displayed
    const boardIdElement = screen.getByText('test-board-123');
    expect(boardIdElement).toBeInTheDocument();
    
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

  test('handles copying board ID to clipboard', async () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );
    
    const copyButton = screen.getByTitle('Copy Board ID');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-board-123');
    
    // Wait for the Promise to resolve and notification to be called
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('Board ID copied to clipboard');
    });
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
});
