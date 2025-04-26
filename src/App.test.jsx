import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BoardProvider } from './context/BoardContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';

// Mock the context providers to avoid actual context implementation
vi.mock('./context/BoardContext', () => ({
  BoardProvider: ({ children }) => <div data-testid="board-provider">{children}</div>,
  useBoardContext: () => ({
    user: null,
    boardId: null,
    setBoardId: vi.fn(),
    boardTitle: 'Test Board',
    setBoardTitle: vi.fn(),
    columns: {},
    updateBoardTitle: vi.fn(),
    sortByVotes: false,
    setSortByVotes: vi.fn(),
    boardRef: null,
    createNewBoard: vi.fn(),
    openExistingBoard: vi.fn(),
    moveCard: vi.fn()
  })
}));

vi.mock('react-dnd', () => ({
  DndProvider: ({ children }) => <div data-testid="dnd-provider">{children}</div>
}));

describe('App Component', () => {
  test('renders Kanbanish app correctly', () => {
    render(<App />);
    
    // Check if the main app container is present
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();
    
    // Check if the board provider is rendered
    const boardProvider = screen.getByTestId('board-provider');
    expect(boardProvider).toBeInTheDocument();
    
    // Check if the DnD provider is rendered
    const dndProvider = screen.getByTestId('dnd-provider');
    expect(dndProvider).toBeInTheDocument();
  });
});
