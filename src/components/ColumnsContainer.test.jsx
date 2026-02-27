import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import ColumnsContainer from './ColumnsContainer';

// Mock react-feather
vi.mock('react-feather', () => ({
  Plus: () => <div>plus-icon</div>
}));

// Mock Column component
vi.mock('./Column', () => ({
  default: (props) => (
    <div
      data-testid={`column-${props.columnId}`}
      data-collapsed={props.collapsed}
      onClick={() => props.onToggleCollapse(props.columnId)}
      role="button"
    >
      {props.columnData.title}
    </div>
  )
}));

// Mock workflowUtils
vi.mock('../utils/workflowUtils', () => ({
  WORKFLOW_PHASES: {
    CREATION: 'CREATION',
    GROUPING: 'GROUPING',
    INTERACTIONS: 'INTERACTIONS',
    INTERACTION_REVEAL: 'INTERACTION_REVEAL',
    RESULTS: 'RESULTS',
    POLL: 'POLL'
  }
}));

// Mock BoardContext
vi.mock('../context/BoardContext');

describe('ColumnsContainer', () => {
  const mockBoardContext = {
    retrospectiveMode: false,
    workflowPhase: 'CREATION',
    boardId: 'test-board'
  };

  const mockColumns = {
    a_col1: {
      title: 'To Do',
      cards: {
        card1: { id: 'card1', content: 'Task 1', created: 1000 },
        card2: { id: 'card2', content: 'Task 2', created: 2000 }
      },
      groups: {}
    },
    b_col2: {
      title: 'In Progress',
      cards: {},
      groups: {}
    },
    c_col3: {
      title: 'Done',
      cards: {
        card3: { id: 'card3', content: 'Completed', created: 3000 }
      },
      groups: {}
    }
  };

  const mockAddNewColumn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(mockBoardContext);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders all columns', () => {
    render(
      <ColumnsContainer
        columns={mockColumns}
        sortByVotes={false}
        addNewColumn={mockAddNewColumn}
      />
    );

    const col1 = screen.getByTestId('column-a_col1');
    const col2 = screen.getByTestId('column-b_col2');
    const col3 = screen.getByTestId('column-c_col3');

    expect(col1).toBeInTheDocument();
    expect(col2).toBeInTheDocument();
    expect(col3).toBeInTheDocument();
  });

  test('passes collapsed prop based on state', () => {
    render(
      <ColumnsContainer
        columns={mockColumns}
        sortByVotes={false}
        addNewColumn={mockAddNewColumn}
      />
    );

    const col1 = screen.getByTestId('column-a_col1');
    expect(col1).toHaveAttribute('data-collapsed', 'false');
  });

  test('persists collapsed state to localStorage', () => {
    const { rerender } = render(
      <ColumnsContainer
        columns={mockColumns}
        sortByVotes={false}
        addNewColumn={mockAddNewColumn}
      />
    );

    // Get the column element and click it to toggle collapse
    const col1 = screen.getByTestId('column-a_col1');
    fireEvent.click(col1);

    // Re-render to ensure state update is applied
    rerender(
      <ColumnsContainer
        columns={mockColumns}
        sortByVotes={false}
        addNewColumn={mockAddNewColumn}
      />
    );

    // Check localStorage
    const stored = localStorage.getItem('kanbanish-collapsed-test-board');
    expect(stored).toBeDefined();
    const collapsedIds = JSON.parse(stored);
    expect(collapsedIds).toContain('a_col1');
  });

  test('loads collapsed state from localStorage', () => {
    // Set up localStorage with collapsed column
    localStorage.setItem(
      'kanbanish-collapsed-test-board',
      JSON.stringify(['a_col1'])
    );

    render(
      <ColumnsContainer
        columns={mockColumns}
        sortByVotes={false}
        addNewColumn={mockAddNewColumn}
      />
    );

    // Check that the column has collapsed state
    const col1 = screen.getByTestId('column-a_col1');
    expect(col1).toHaveAttribute('data-collapsed', 'true');

    // Other columns should not be collapsed
    const col2 = screen.getByTestId('column-b_col2');
    expect(col2).toHaveAttribute('data-collapsed', 'false');
  });
});
