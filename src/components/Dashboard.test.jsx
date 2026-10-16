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

const LAST_TEMPLATE_KEY = 'kanbanish_last_template';

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
    localStorage.clear();
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

  test('hides the Recent section when there are no recent boards', () => {
    renderDashboard();

    expect(screen.getByText('Kanbanish')).toBeInTheDocument();
    expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
  });

  const tileHrefs = () => screen.getAllByRole('link').map(link => link.getAttribute('href'));

  test('renders template tiles linking to ?template= URLs', () => {
    renderDashboard();

    expect(tileHrefs()).toEqual([
      '?template=default',
      '?template=retro',
      '?template=lean-coffee',
      '?template=start-stop-continue'
    ]);
    expect(screen.getByRole('link', { name: 'Default' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Big Orca/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All templates' })).toBeInTheDocument();
  });

  test('puts the last-used template first without duplicating it', () => {
    localStorage.setItem(LAST_TEMPLATE_KEY, 'retro');
    renderDashboard();

    expect(tileHrefs()).toEqual([
      '?template=retro',
      '?template=default',
      '?template=lean-coffee',
      '?template=start-stop-continue'
    ]);
  });

  test('adds a non-featured last-used template as the first tile', () => {
    localStorage.setItem(LAST_TEMPLATE_KEY, 'sailboat');
    renderDashboard();

    expect(tileHrefs()).toEqual([
      '?template=sailboat',
      '?template=default',
      '?template=retro',
      '?template=lean-coffee'
    ]);
  });

  test('clicking a tile creates the board with the template settings and opens it', async () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: /Retrospective/ }));

    await waitFor(() => {
      expect(createBoardFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: ['Went Well', 'Could Improve', 'Action Items'],
          templateName: 'Retro',
          settingsOverrides: { retrospectiveMode: true },
          user: { uid: 'test-user' }
        })
      );
    });
    await waitFor(() => {
      expect(mockOnOpenBoard).toHaveBeenCalledWith('new-board-123');
    });
    expect(localStorage.getItem(LAST_TEMPLATE_KEY)).toBe('retro');
  });

  test('uses template defaultSettings when present', async () => {
    localStorage.setItem(LAST_TEMPLATE_KEY, 'big-orca');
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: /Big Orca/ }));

    await waitFor(() => {
      expect(createBoardFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          templateName: 'Big Orca',
          settingsOverrides: {
            retrospectiveMode: false,
            showDisplayNames: false,
            workflowPhase: 'HEALTH_CHECK'
          }
        })
      );
    });
  });

  test('modifier-clicking a tile leaves navigation to the browser', () => {
    renderDashboard();
    // jsdom can't navigate; stop the default action after React has seen the event
    const blockNavigation = e => e.preventDefault();
    document.addEventListener('click', blockNavigation);

    fireEvent.click(screen.getByRole('link', { name: /Default/ }), { metaKey: true });

    document.removeEventListener('click', blockNavigation);
    expect(createBoardFromTemplate).not.toHaveBeenCalled();
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

  test('opens template modal when All templates is clicked', () => {
    renderDashboard();

    expect(screen.queryByTestId('template-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('All templates'));

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

  test('submits the join form', () => {
    renderDashboard();

    const input = screen.getByLabelText('Board ID or URL');
    fireEvent.change(input, { target: { value: 'enter-board' } });
    fireEvent.submit(input.closest('form'));

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

  test('creates a board when a template is picked from the modal', async () => {
    renderDashboard();

    fireEvent.click(screen.getByText('All templates'));
    capturedOnSelectTemplate({
      id: 'lean-coffee',
      name: 'Lean Coffee',
      columns: ['Topics', 'Discussing', 'Done'],
      tags: ['discussion']
    });

    await waitFor(() => {
      expect(createBoardFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: ['Topics', 'Discussing', 'Done'],
          templateName: 'Lean Coffee',
          settingsOverrides: { retrospectiveMode: false }
        })
      );
    });
    await waitFor(() => {
      expect(mockOnOpenBoard).toHaveBeenCalledWith('new-board-123');
    });
  });
});
