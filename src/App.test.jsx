import { render, screen } from '@testing-library/react';
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
      cb({ uid: 'test-user' });
      return vi.fn();
    })
  },
  signInAnonymously: vi.fn(),
  get: vi.fn()
}));
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn()
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
});
