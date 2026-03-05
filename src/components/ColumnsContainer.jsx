import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import Column from './Column';

const STORAGE_KEY_PREFIX = 'kanbanish-collapsed-';

/**
 * Renders the board columns grid with an optional "Add Column" button.
 * Columns are sorted by their ID prefix (a_, b_, c_) for consistent ordering.
 * Manages per-column collapsed state, persisted to localStorage per board.
 *
 * @param {Object} props
 * @param {Object} props.columns - Column data keyed by column ID
 * @param {boolean} props.sortByVotes - Whether cards within columns are sorted by votes
 * @param {Function} props.addNewColumn - Callback to add a new column
 */
const ColumnsContainer = ({ columns, sortByVotes, addNewColumn, isFiltering, matchingCardIds, matchingGroupIds, onExpandCard }) => {
  const { retrospectiveMode, workflowPhase, boardId } = useBoardContext();

  // Load collapsed columns from localStorage
  const [collapsedColumns, setCollapsedColumns] = useState(() => {
    if (!boardId) return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + boardId);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (!boardId) return;
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFIX + boardId,
        JSON.stringify([...collapsedColumns])
      );
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [collapsedColumns, boardId]);

  const toggleCollapse = useCallback((columnId) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  // Get columns sorted by their IDs to maintain consistent order
  const getSortedColumns = () => {
    // The column IDs are prefixed with alphabet characters (a_, b_, etc.)
    // to ensure they maintain their original order regardless of title changes
    return Object.entries(columns || {}).sort((a, b) => {
      return a[0].localeCompare(b[0]); // Sort by column ID
    });
  };

  // Hide add column button during reveal phases when board structure should be stable
  const shouldShowAddColumn = !retrospectiveMode || workflowPhase === WORKFLOW_PHASES.CREATION;

  return (
    <div className="board-container">
      <div id="board" className="board">
        {/* Render columns in sorted order */}
        {getSortedColumns().map(([columnId, columnData]) => (
          <Column
            key={columnId}
            columnId={columnId}
            columnData={columnData}
            sortByVotes={sortByVotes}
            collapsed={collapsedColumns.has(columnId)}
            onToggleCollapse={toggleCollapse}
            isFiltering={isFiltering}
            matchingCardIds={matchingCardIds}
            matchingGroupIds={matchingGroupIds}
            onExpandCard={onExpandCard}
          />
        ))}
        {/* Add column button - hidden during interaction/results phases */}
        {shouldShowAddColumn && (
          <div className="add-column-container">
            <button id="add-column" className="add-column" onClick={addNewColumn}>
              <Plus size={16} />
              Add Column
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColumnsContainer;
