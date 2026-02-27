import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Mock Dashboard — rendered when no ?board= param
vi.mock('./components/Dashboard', () => ({
  default: (props) => <div data-testid="dashboard" {...props}>Dashboard</div>
}));

// Mock Board — rendered inside BoardGate when ?board= param exists
vi.mock('./components/Board', () => ({
  default: (props) => <div data-testid="board" {...props}>Board</div>
}));

// Mock useRecentBoards — used directly in AppContent
vi.mock('./hooks/useRecentBoards', () => ({
  useRecentBoards: () => ({
    recentBoards: [],
    addBoard: vi.fn(),
    removeBoard: vi.fn(),
    togglePin: vi.fn(),
    updateBoardMeta: vi.fn(),
    clearAll: vi.fn()
  })
}));

// Mock BoardContext — needed when BoardGate renders BoardProvider
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
    moveCard: vi.fn(),
    getAllUsersAddingCards: vi.fn().mockReturnValue([])
  }),
  DEFAULT_BOARD_TITLE: 'Untitled Board'
}));
vi.mock('./context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));

vi.mock('react-dnd', () => ({
  DndProvider: ({ children }) => <div data-testid="dnd-provider">{children}</div>
}));

// Mock firebase — Dashboard uses auth.onAuthStateChanged
vi.mock('./utils/firebase', () => ({
  database: {},
  auth: {
    onAuthStateChanged: vi.fn((cb) => {
      // Return unsubscribe function before calling callback
      const unsubscribe = vi.fn();
      // Call callback asynchronously to avoid ReferenceError
      Promise.resolve().then(() => cb({ uid: 'test-user' }));
      return unsubscribe;
    })
  },
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'test-user' } })),
  get: vi.fn()
}));
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  set: vi.fn(() => Promise.resolve())
}));

// Mock boardUtils — createBoardFromTemplate is called when ?template= is set
vi.mock('./utils/boardUtils', () => ({
  createBoardFromTemplate: vi.fn(() => Promise.resolve('template-board-123'))
}));

// Mock boardTemplates — provides template definitions
vi.mock('./data/boardTemplates', () => ({
  default: [
    {
      id: 'lean-coffee',
      name: 'Lean Coffee',
      description: 'Democratically driven meeting agenda format',
      columns: ['Topics', 'Discussing', 'Done'],
      icon: '☕',
      tags: ['discussion', 'meeting', 'agenda']
    }
  ]
}));

describe('App Component', () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore location
    delete window.location;
    window.location = originalLocation;
  });

  test('renders Dashboard when no board param in URL', () => {
    render(<App />);

    // App container always rendered
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();

    // Dashboard is shown when no ?board= param
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();

    // Board should NOT be rendered
    expect(screen.queryByTestId('board')).not.toBeInTheDocument();
  });

  test('renders Board when board param exists in URL', () => {
    // Set URL with board param before rendering
    delete window.location;
    window.location = { ...originalLocation, search: '?board=test-123', href: 'http://localhost/?board=test-123' };

    render(<App />);

    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();

    // Board should be rendered (inside BoardGate → BoardProvider → BoardWithTracking → Board)
    expect(screen.getByTestId('board')).toBeInTheDocument();

    // Dashboard should NOT be rendered
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  test('creates board from template when ?template=lean-coffee and no ?board= param', async () => {
    // Set URL with template param before rendering
    delete window.location;
    window.location = { ...originalLocation, search: '?template=lean-coffee', href: 'http://localhost/?template=lean-coffee' };

    // Mock pushState so handleOpenBoard doesn't throw in jsdom
    const pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});

    const { createBoardFromTemplate } = await import('./utils/boardUtils');
    const createBoardMock = vi.mocked(createBoardFromTemplate);

    render(<App />);

    // App container should be rendered
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();

    // Wait for createBoardFromTemplate to have been called with the right args
    await waitFor(() => {
      expect(createBoardMock).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: ['Topics', 'Discussing', 'Done'],
          templateName: 'Lean Coffee'
        })
      );
    }, { timeout: 2000 });

    // After template board is created, the app should navigate to the board
    await waitFor(() => {
      expect(screen.getByTestId('board')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Dashboard should NOT be rendered after template creation
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();

    pushStateSpy.mockRestore();
  });

  test('does not crash when ?template=nonexistent-template is in URL', () => {
    // Set URL with nonexistent template param
    delete window.location;
    window.location = { ...originalLocation, search: '?template=does-not-exist', href: 'http://localhost/?template=does-not-exist' };

    render(<App />);

    // App container should be rendered
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();

    // Dashboard should be rendered (no matching template found)
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();

    // Board should NOT be rendered
    expect(screen.queryByTestId('board')).not.toBeInTheDocument();
  });

  test('prioritizes ?board= param over ?template= param', () => {
    // Set URL with both board and template params
    delete window.location;
    window.location = { ...originalLocation, search: '?board=existing-123&template=lean-coffee', href: 'http://localhost/?board=existing-123&template=lean-coffee' };

    render(<App />);

    // App container should be rendered
    const appElement = screen.getByTestId('app-container');
    expect(appElement).toBeInTheDocument();

    // Board should be rendered (board param takes priority)
    expect(screen.getByTestId('board')).toBeInTheDocument();

    // Dashboard should NOT be rendered
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});
