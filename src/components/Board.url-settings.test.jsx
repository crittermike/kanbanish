import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Board from './Board';

vi.mock('../context/BoardContext');

// Mock the NewBoardTemplateModal component to keep DOM simple
vi.mock('./modals/NewBoardTemplateModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="template-modal">Template Modal</div> : null)
}));

// Mock the ExportBoardModal component
vi.mock('./modals/ExportBoardModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="export-modal">Export Modal</div> : null)
}));

describe('Board URL settings', () => {
  const mockShowNotification = vi.fn();

  const baseCtx = {
    boardId: null,
    boardRef: null,
    boardTitle: 'Untitled Board',
    setBoardTitle: vi.fn(),
    columns: {},
    sortByVotes: false,
    setSortByVotes: vi.fn(),
    votingEnabled: true,
    updateVotingEnabled: vi.fn(),
    downvotingEnabled: true,
    updateDownvotingEnabled: vi.fn(),
    multipleVotesAllowed: false,
    updateMultipleVotesAllowed: vi.fn(),
    retrospectiveMode: false,
    updateRetrospectiveMode: vi.fn(),
    resetAllVotes: vi.fn(),
    createNewBoard: vi.fn().mockReturnValue('new-board-abc'),
    openExistingBoard: vi.fn(),
    updateBoardTitle: vi.fn(),
    darkMode: true,
    updateDarkMode: vi.fn(),
    workflowPhase: 'CREATION',
    user: { uid: 'u1' },
    getAllUsersAddingCards: vi.fn().mockReturnValue([])
  };

  const originalURLSearchParams = window.URLSearchParams;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue({ ...baseCtx });

    // Mock window.location with query params
    delete window.location;
    window.location = { origin: 'https://example.com', pathname: '/', search: '?sort=votes&theme=light' };

    window.URLSearchParams = vi.fn().mockImplementation((s) => new originalURLSearchParams(s));
  });

  afterEach(() => {
    window.URLSearchParams = originalURLSearchParams;
    window.location = originalLocation;
  });

  test('applies theme from URL on first render (sort handled on creation)', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <Board showNotification={mockShowNotification} />
      </DndProvider>
    );

  const ctx = useBoardContext.mock.results.at(-1).value;
  // sortByVotes is now treated as a board setting and not applied on initial load
  expect(ctx.setSortByVotes).not.toHaveBeenCalled();
    expect(ctx.updateDarkMode).toHaveBeenCalledWith(false); // theme=light => darkMode false
    // Template modal opens (no board id)
    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });
});
