import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { useRecentBoards } from '../hooks/useRecentBoards';
import Dashboard from './Dashboard';

// Mock useRecentBoards hook
vi.mock('../hooks/useRecentBoards');

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {},
  auth: {
    onAuthStateChanged: vi.fn((cb) => {
      cb({ uid: 'test-user' });
      return vi.fn();
    })
  },
  signInAnonymously: vi.fn(),
  get: vi.fn().mockResolvedValue({ exists: () => false })
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue()
}));

// Mock NewBoardTemplateModal
vi.mock('./modals/NewBoardTemplateModal', () => ({
  default: ({ isOpen }) =>
    isOpen ? <div data-testid="template-modal">Template Modal</div> : null
}));

describe('Dashboard Component', () => {
  const mockOnOpenBoard = vi.fn();
  const mockToggleDarkMode = vi.fn();
  const mockRemoveBoard = vi.fn();
  const mockTogglePin = vi.fn();
  const mockClearAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRecentBoards.mockReturnValue({
      recentBoards: [],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });
  });

  const renderDashboard = (props = {}) =>
    render(
      <Dashboard
        onOpenBoard={mockOnOpenBoard}
        darkMode={true}
        onToggleDarkMode={mockToggleDarkMode}
        {...props}
      />
    );

  test('renders empty state when no recent boards', () => {
    renderDashboard();

    expect(screen.getByText('Kanbanish')).toBeInTheDocument();
    expect(screen.getByText('No recent boards')).toBeInTheDocument();
    expect(screen.getByText('Create a new board or join an existing one to get started.')).toBeInTheDocument();
  });

  test('renders Create New Board button', () => {
    renderDashboard();

    expect(screen.getByText('Create New Board')).toBeInTheDocument();
  });

  test('renders join board input', () => {
    renderDashboard();

    expect(screen.getByLabelText('Board ID or URL')).toBeInTheDocument();
    expect(screen.getByText('Join Board')).toBeInTheDocument();
  });

  test('renders recent boards', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-1', title: 'Board One', lastVisited: Date.now(), cardCount: 3, pinned: false },
        { id: 'board-2', title: 'Board Two', lastVisited: Date.now() - 1000, cardCount: 7, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    expect(screen.getByText('Board One')).toBeInTheDocument();
    expect(screen.getByText('Board Two')).toBeInTheDocument();
  });

  test('renders pinned boards in separate section', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-pinned', title: 'Pinned Board', lastVisited: Date.now(), cardCount: 2, pinned: true },
        { id: 'board-recent', title: 'Recent Board', lastVisited: Date.now(), cardCount: 1, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    expect(screen.getByText('Pinned Board')).toBeInTheDocument();
    expect(screen.getByText('Recent Board')).toBeInTheDocument();
  });

  test('calls onOpenBoard when board card is clicked', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-1', title: 'Click Me', lastVisited: Date.now(), cardCount: 0, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    fireEvent.click(screen.getByText('Click Me'));
    expect(mockOnOpenBoard).toHaveBeenCalledWith('board-1');
  });

  test('calls removeBoard when remove button is clicked', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-1', title: 'Board One', lastVisited: Date.now(), cardCount: 0, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    const removeBtn = screen.getByLabelText('Remove board from list');
    fireEvent.click(removeBtn);
    expect(mockRemoveBoard).toHaveBeenCalledWith('board-1');
  });

  test('calls togglePin when pin button is clicked', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-1', title: 'Board One', lastVisited: Date.now(), cardCount: 0, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    const pinBtn = screen.getByLabelText('Pin board');
    fireEvent.click(pinBtn);
    expect(mockTogglePin).toHaveBeenCalledWith('board-1');
  });

  test('opens template modal when Create New Board is clicked', () => {
    renderDashboard();

    expect(screen.queryByTestId('template-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Create New Board'));

    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });

  test('calls onOpenBoard when joining by board ID', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'some-board-id' } });
    fireEvent.click(screen.getByText('Join Board'));

    expect(mockOnOpenBoard).toHaveBeenCalledWith('some-board-id');
  });

  test('extracts board ID from full URL when joining', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'https://kanbanish.com/?board=extracted-id' } });
    fireEvent.click(screen.getByText('Join Board'));

    expect(mockOnOpenBoard).toHaveBeenCalledWith('extracted-id');
  });

  test('handles Enter key in join input', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'enter-board' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnOpenBoard).toHaveBeenCalledWith('enter-board');
  });

  test('toggles dark mode when theme button is clicked', () => {
    renderDashboard();

    const themeBtn = screen.getByLabelText('Switch to light mode');
    fireEvent.click(themeBtn);

    expect(mockToggleDarkMode).toHaveBeenCalled();
  });

  test('calls clearAll when Clear all button is clicked', () => {
    useRecentBoards.mockReturnValue({
      recentBoards: [
        { id: 'board-1', title: 'Board One', lastVisited: Date.now(), cardCount: 0, pinned: false }
      ],
      removeBoard: mockRemoveBoard,
      togglePin: mockTogglePin,
      updateBoardMeta: vi.fn(),
      clearAll: mockClearAll
    });

    renderDashboard();

    fireEvent.click(screen.getByText('Clear all'));
    expect(mockClearAll).toHaveBeenCalled();
  });
});
