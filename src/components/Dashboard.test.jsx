import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { useRecentBoards } from '../hooks/useRecentBoards';
import { createBoardFromTemplate } from '../utils/boardUtils';
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
  get: vi.fn().mockResolvedValue({ exists: () => false }),
  ref: vi.fn()
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue()
}));

// Mock NewBoardTemplateModal — captures onSelectTemplate for test invocation
let capturedOnSelectTemplate = null;
vi.mock('./modals/NewBoardTemplateModal', () => ({
  default: ({ isOpen, onSelectTemplate }) => {
    capturedOnSelectTemplate = onSelectTemplate;
    return isOpen ? <div data-testid="template-modal">Template Modal</div> : null;
  }
}));

// Mock boardUtils
vi.mock('../utils/boardUtils', () => ({
  createBoardFromTemplate: vi.fn(() => Promise.resolve('new-board-123'))
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
    expect(screen.getByText('Create a new board or join an existing one above.')).toBeInTheDocument();
  });

  test('renders New Board button', () => {
    renderDashboard();

    expect(screen.getByText('New Board')).toBeInTheDocument();
  });

  test('renders join board input', () => {
    renderDashboard();

    expect(screen.getByLabelText('Board ID or URL')).toBeInTheDocument();
    expect(screen.getByText('Join')).toBeInTheDocument();
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

    window.confirm = vi.fn().mockReturnValue(true);
    const removeBtn = screen.getByLabelText('Remove board from list');
    fireEvent.click(removeBtn);
    expect(window.confirm).toHaveBeenCalled();
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

  test('opens template modal when New Board is clicked', () => {
    renderDashboard();

    expect(screen.queryByTestId('template-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('New Board'));

    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });

  test('calls onOpenBoard when joining by board ID', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'some-board-id' } });
    fireEvent.click(screen.getByText('Join'));

    expect(mockOnOpenBoard).toHaveBeenCalledWith('some-board-id');
  });

  test('extracts board ID from full URL when joining', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'https://kanbanish.com/?board=extracted-id' } });
    fireEvent.click(screen.getByText('Join'));

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

    window.confirm = vi.fn().mockReturnValue(true);
    fireEvent.click(screen.getByText('Clear all'));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearAll).toHaveBeenCalled();
  });

  test('does not remove board when confirmation is cancelled', () => {
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

    window.confirm = vi.fn().mockReturnValue(false);
    const removeBtn = screen.getByLabelText('Remove board from list');
    fireEvent.click(removeBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(mockRemoveBoard).not.toHaveBeenCalled();
  });

  test('does not clear all when confirmation is cancelled', () => {
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

    window.confirm = vi.fn().mockReturnValue(false);
    fireEvent.click(screen.getByText('Clear all'));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearAll).not.toHaveBeenCalled();
  });

  test('skips wizard and creates board directly when template has skipWizard', async () => {
    renderDashboard();

    // Open template modal to capture onSelectTemplate
    fireEvent.click(screen.getByText('New Board'));
    expect(capturedOnSelectTemplate).toBeDefined();

    // Simulate selecting a template with skipWizard and defaultSettings
    const skipWizardTemplate = {
      id: 'big-orca',
      name: 'Big Orca',
      columns: ['Good stuff', 'Bad stuff'],
      tags: ['retrospective'],
      skipWizard: true,
      defaultSettings: {
        retrospectiveMode: false,
        showDisplayNames: false,
        actionItemsEnabled: false,
        workflowPhase: 'HEALTH_CHECK'
      }
    };

    capturedOnSelectTemplate(
      skipWizardTemplate.columns,
      skipWizardTemplate.name,
      skipWizardTemplate.tags,
      skipWizardTemplate
    );

    // createBoardFromTemplate should be called directly with defaultSettings
    await waitFor(() => {
      expect(createBoardFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: ['Good stuff', 'Bad stuff'],
          templateName: 'Big Orca',
          settingsOverrides: {
            retrospectiveMode: false,
            showDisplayNames: false,
            actionItemsEnabled: false,
            workflowPhase: 'HEALTH_CHECK'
          }
        })
      );
    });

    // Board should be opened after creation
    await waitFor(() => {
      expect(mockOnOpenBoard).toHaveBeenCalledWith('new-board-123');
    });
  });

  test('opens wizard normally when template does not have skipWizard', () => {
    renderDashboard();

    // Open template modal to capture onSelectTemplate
    fireEvent.click(screen.getByText('New Board'));
    expect(capturedOnSelectTemplate).toBeDefined();

    // Simulate selecting a regular template (no skipWizard)
    capturedOnSelectTemplate(
      ['Topics', 'Discussing', 'Done'],
      'Lean Coffee',
      ['discussion'],
      { id: 'lean-coffee', name: 'Lean Coffee', columns: ['Topics', 'Discussing', 'Done'], tags: ['discussion'] }
    );

    // createBoardFromTemplate should NOT be called (wizard should open instead)
    expect(createBoardFromTemplate).not.toHaveBeenCalled();
  });
});
