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

describe('Column - CardCreationIndicator Visibility', () => {
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
    stopCardCreation: vi.fn(),
    getUsersAddingCardsInColumn: vi.fn().mockReturnValue([
      { userId: 'other-user', columnId: 'test-column', lastUpdated: Date.now() }
    ])
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows CardCreationIndicator when retrospective mode is ON and conditions are met', () => {
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

    // Should show CardCreationIndicator when retrospective mode is ON
    expect(container.querySelector('.card-creation-indicator')).toBeInTheDocument();
  });

  it('shows CardCreationIndicator when retrospective mode is OFF', () => {
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

    // Should show CardCreationIndicator in non-retro mode too
    expect(container.querySelector('.card-creation-indicator')).toBeInTheDocument();
  });

  it('shows CardCreationIndicator when retrospective mode is ON but workflow phase is not CREATION', () => {
    useBoardContext.mockReturnValue({
      ...baseMockContext,
      retrospectiveMode: true,
      workflowPhase: 'INTERACTIONS'
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

    // Should show CardCreationIndicator in all phases now
    expect(container.querySelector('.card-creation-indicator')).toBeInTheDocument();
  });

  it('shows CardCreationIndicator when retrospective mode is OFF regardless of workflow phase', () => {
    useBoardContext.mockReturnValue({
      ...baseMockContext,
      retrospectiveMode: false,
      workflowPhase: 'CREATION'
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

    // Should show CardCreationIndicator in non-retro mode
    expect(container.querySelector('.card-creation-indicator')).toBeInTheDocument();
  });
});