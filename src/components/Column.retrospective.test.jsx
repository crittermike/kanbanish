import { render } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Column from './Column';

// Mock the BoardContext
vi.mock('../context/BoardContext');

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(),
  remove: vi.fn()
}));

vi.mock('../utils/firebase', () => ({
  database: {}
}));

describe('Column - Basic Rendering', () => {
  const mockShowNotification = vi.fn();
  const mockColumnData = {
    title: 'Test Column',
    cards: {}
  };

  const baseMockContext = {
    boardId: 'test-board',
    moveCard: vi.fn(),
    user: { uid: 'test-user' },
    createCardGroup: vi.fn(),
    workflowPhase: 'CREATION',
    columns: {},
    startCardCreation: vi.fn(),
    stopCardCreation: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column without CardCreationIndicator (moved to Board)', () => {
    useBoardContext.mockReturnValue({
      ...baseMockContext,
      retrospectiveMode: true
    });

    const { container } = render(
      <DndProvider backend={HTML5Backend}>
        <Column 
          columnId="test-column" 
          columnData={mockColumnData} 
          sortByVotes={false} 
          showNotification={mockShowNotification} 
        />
      </DndProvider>
    );

    // CardCreationIndicator is now rendered at Board level, not in Column
    expect(container.querySelector('.card-creation-indicator')).not.toBeInTheDocument();
  });

  it('renders column in non-retro mode without CardCreationIndicator', () => {
    useBoardContext.mockReturnValue({
      ...baseMockContext,
      retrospectiveMode: false
    });

    const { container } = render(
      <DndProvider backend={HTML5Backend}>
        <Column 
          columnId="test-column" 
          columnData={mockColumnData} 
          sortByVotes={false} 
          showNotification={mockShowNotification} 
        />
      </DndProvider>
    );

    // CardCreationIndicator is now at Board level
    expect(container.querySelector('.card-creation-indicator')).not.toBeInTheDocument();
  });
});