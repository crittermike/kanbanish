import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Column from './Column';

// Mock react-dnd
vi.mock('react-dnd', () => ({
  useDrop: vi.fn().mockReturnValue([{ isOver: false }, vi.fn()])
}));

// Mock Card component
vi.mock('./Card', () => ({
  default: ({ cardData }) => (
    <div data-testid="card" data-card-id={cardData.id}>
      {cardData.content}
    </div>
  )
}));

// Mock CardGroup component
vi.mock('./CardGroup', () => ({
  default: ({ groupData }) => (
    <div data-testid="card-group" data-group-id={groupData.id}>
      {groupData.name}
    </div>
  )
}));

// Mock CardCreationIndicator component
vi.mock('./CardCreationIndicator', () => ({
  default: () => <div data-testid="card-creation-indicator">Users adding cards...</div>
}));

// Mock react-feather
vi.mock('react-feather', () => ({
  Trash2: () => <div>trash-icon</div>,
  Plus: () => <div>plus-icon</div>,
  ChevronLeft: () => <div>chevron-left-icon</div>,
  ChevronRight: () => <div>chevron-right-icon</div>
}));

// Mock utils
vi.mock('../utils/boardUtils', () => ({
  addCard: vi.fn().mockResolvedValue({})
}));

vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('../utils/workflowUtils', () => ({
  isGroupingAllowed: vi.fn().mockReturnValue(true),
  isCardCreationAllowed: vi.fn().mockReturnValue(true)
}));

// Mock BoardContext
vi.mock('../context/BoardContext');
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));


describe('Column Component', () => {
const mockProps = {
    columnId: 'col1',
    columnData: {
      title: 'Test Column',
      cards: {
        card1: { id: 'card1', content: 'First card', created: 1000 },
        card2: { id: 'card2', content: 'Second card', created: 2000 }
      },
      groups: {}
    },
    sortByVotes: false,
    collapsed: false,
    onToggleCollapse: vi.fn()
  };

  const mockBoardContext = {
    boardId: 'board1',
    moveCard: vi.fn(),
    user: { uid: 'user1' },
    createCardGroup: vi.fn(),
    retrospectiveMode: false,
    workflowPhase: 'CREATION',
    columns: {},
    startCardCreation: vi.fn(),
    stopCardCreation: vi.fn(),
    getUsersAddingCardsInColumn: vi.fn().mockReturnValue([])
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(mockBoardContext);
  });

  test('renders add card button outside scrollable card area', () => {
    render(<Column {...mockProps} />);
    
    const addCardButton = screen.getByRole('button', { name: /add card/i });
    const cards = screen.getAllByTestId('card');
    
    expect(addCardButton).toBeInTheDocument();
    expect(cards).toHaveLength(2);
    
    // The add card button should be a direct child of .column, not inside .column-content
    const columnEl = document.querySelector('.column');
    const columnContentEl = columnEl.querySelector('.column-content');
    const addCardButtonEl = columnEl.querySelector('.add-card');
    
    expect(columnContentEl).not.toContainElement(addCardButtonEl);
    expect(columnEl).toContainElement(addCardButtonEl);
  });

  test('shows add card form outside scrollable card area when adding a card', () => {
    render(<Column {...mockProps} />);
    
    const addCardButton = screen.getByRole('button', { name: /add card/i });
    fireEvent.click(addCardButton);
    
    const textarea = screen.getByPlaceholderText('Enter card content...');
    const cards = screen.getAllByTestId('card');
    
    expect(textarea).toBeInTheDocument();
    expect(cards).toHaveLength(2);
    
    // The inline form should be a direct child of .column, not inside .column-content
    const columnEl = document.querySelector('.column');
    const columnContentEl = columnEl.querySelector('.column-content');
    const formEl = columnEl.querySelector('.inline-card-form');
    
    expect(columnContentEl).not.toContainElement(formEl);
    expect(columnEl).toContainElement(formEl);
  });

  describe('Column - Collapsed State', () => {
    test('renders collapsed view when collapsed prop is true', () => {
      const collapsedProps = { ...mockProps, collapsed: true };
      render(<Column {...collapsedProps} />);
      
      const columnEl = document.querySelector('.column.collapsed');
      expect(columnEl).toBeInTheDocument();
      
      const collapsedTitle = screen.getByText('Test Column');
      expect(collapsedTitle).toHaveClass('collapsed-title');
      
      const cardCountBadge = screen.getByText('2');
      expect(cardCountBadge).toHaveClass('collapsed-card-count');
      
      const expandButton = document.querySelector('.collapse-toggle');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAttribute('aria-label', expect.stringMatching(/expand.*column/i));
    });

    test('calls onToggleCollapse when collapsed column is clicked', () => {
      const onToggleCollapseMock = vi.fn();
      const collapsedProps = { ...mockProps, collapsed: true, onToggleCollapse: onToggleCollapseMock };
      render(<Column {...collapsedProps} />);
      
      const columnEl = document.querySelector('.column.collapsed');
      fireEvent.click(columnEl);
      
      expect(onToggleCollapseMock).toHaveBeenCalledWith('col1');
    });

    test('renders expanded view when collapsed prop is false', () => {
      render(<Column {...mockProps} />);
      
      const columnEl = document.querySelector('.column:not(.collapsed)');
      expect(columnEl).toBeInTheDocument();
      
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(2);
      
      const collapseButton = screen.getByRole('button', { name: /collapse column/i });
      expect(collapseButton).toBeInTheDocument();
    });

    test('does not render cards in collapsed state', () => {
      const collapsedProps = { ...mockProps, collapsed: true };
      render(<Column {...collapsedProps} />);
      
      const cards = screen.queryAllByTestId('card');
      expect(cards).toHaveLength(0);
    });
  });
});