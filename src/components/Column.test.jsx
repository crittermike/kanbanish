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
  Plus: () => <div>plus-icon</div>
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
    showNotification: vi.fn()
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

  test('renders add card button at the top before existing cards', () => {
    render(<Column {...mockProps} />);
    
    const columnContent = screen.getByTestId = () => document.querySelector('.column-content');
    const addCardButton = screen.getByRole('button', { name: /add card/i });
    const cards = screen.getAllByTestId('card');
    
    expect(addCardButton).toBeInTheDocument();
    expect(cards).toHaveLength(2);
    
    // Verify that the add card button appears before the cards in the DOM
    const columnContentEl = document.querySelector('.column-content');
    const addCardButtonEl = columnContentEl.querySelector('.add-card');
    const firstCardEl = columnContentEl.querySelector('[data-testid="card"]');
    
    // The add card button should come before the first card in the DOM order
    expect(addCardButtonEl.compareDocumentPosition(firstCardEl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test('shows add card form at the top when adding a card', () => {
    render(<Column {...mockProps} />);
    
    const addCardButton = screen.getByRole('button', { name: /add card/i });
    fireEvent.click(addCardButton);
    
    const textarea = screen.getByPlaceholderText('Enter card content...');
    const cards = screen.getAllByTestId('card');
    
    expect(textarea).toBeInTheDocument();
    expect(cards).toHaveLength(2);
    
    // Verify that the form appears before the cards in the DOM
    const columnContentEl = document.querySelector('.column-content');
    const formEl = columnContentEl.querySelector('.inline-card-form');
    const firstCardEl = columnContentEl.querySelector('[data-testid="card"]');
    
    expect(formEl.compareDocumentPosition(firstCardEl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});